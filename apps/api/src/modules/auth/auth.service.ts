import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signAccessToken } from "../../lib/jwt.js";
import { sendEmail } from "../../lib/resend.js";
import { env } from "../../config/env.js";
import { addHours, addDays } from "@flowmanager/shared";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../errors/index.js";
import type { UserRepository, TokenRepository } from "./auth.repository.js";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function stripPassword<T extends { password_hash?: string }>(user: T) {
  const { password_hash: _, ...safe } = user;
  return safe;
}

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private tokenRepo: TokenRepository,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    const email = data.email.toLowerCase().trim();

    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError("EMAIL_ALREADY_EXISTS", "Email já cadastrado");

    const password_hash = await bcrypt.hash(data.password, 10);

    const verificationToken = generateToken();
    const verificationTokenHash = hashToken(verificationToken);

    const user = await this.userRepo.create({
      name: data.name,
      email,
      password_hash,
      email_verification_token: verificationTokenHash,
      email_verification_expires_at: addHours(
        new Date(),
        env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS,
      ),
    });

    await sendEmail({
      to: email,
      subject: "Confirme seu email — FlowManager",
      template: "verify-email",
      data: { name: data.name, token: verificationToken },
    });

    const { access_token, refresh_token } = await this._issueTokens(user.id);

    return { user: stripPassword(user), access_token, refresh_token };
  }

  async login(data: { email: string; password: string }) {
    const email = data.email.toLowerCase().trim();

    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError("Credenciais inválidas");

    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedError("Conta temporariamente bloqueada", "ACCOUNT_LOCKED");
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      const attempts = user.failed_login_attempts + 1;
      const updateData: Parameters<UserRepository["update"]>[1] = {
        failed_login_attempts: attempts,
      };
      if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
        updateData.locked_until = addHours(
          new Date(),
          env.ACCOUNT_LOCK_DURATION_MINUTES / 60,
        );
      }
      await this.userRepo.update(user.id, updateData);
      if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
        throw new UnauthorizedError("Conta temporariamente bloqueada", "ACCOUNT_LOCKED");
      }
      throw new UnauthorizedError("Credenciais inválidas");
    }

    await this.userRepo.update(user.id, {
      failed_login_attempts: 0,
      locked_until: null,
    });

    const { access_token, refresh_token } = await this._issueTokens(user.id);

    return { user: stripPassword(user), access_token, refresh_token };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.tokenRepo.findRefreshToken(tokenHash);

    if (!stored) throw new UnauthorizedError("Refresh token inválido");
    if (stored.expires_at < new Date()) {
      await this.tokenRepo.deleteRefreshToken(tokenHash);
      throw new UnauthorizedError("Refresh token expirado");
    }

    const user = await this.userRepo.findById(stored.user_id);
    if (!user) throw new UnauthorizedError("Usuário não encontrado");

    await this.tokenRepo.deleteRefreshToken(tokenHash);
    return this._issueTokens(user.id);
  }

  async logout(data: { refresh_token: string; access_token: string }) {
    const refreshHash = hashToken(data.refresh_token);
    await this.tokenRepo.deleteRefreshToken(refreshHash);

    const accessHash = hashToken(data.access_token);
    await this.tokenRepo.createRevokedToken({
      token_hash: accessHash,
      expires_at: addHours(new Date(), 1),
    });
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const user = await this.userRepo["findByVerificationToken"]?.(tokenHash)
      ?? await this._findUserByToken("email_verification_token", tokenHash);

    if (!user) throw new BadRequestError("Token inválido", "INVALID_TOKEN");
    if (!user.email_verification_expires_at || user.email_verification_expires_at < new Date()) {
      throw new BadRequestError("Token expirado", "TOKEN_EXPIRED");
    }
    if (user.email_verified) {
      throw new BadRequestError("Email já verificado", "TOKEN_ALREADY_USED");
    }

    await this.userRepo.update(user.id, {
      email_verified: true,
      email_verified_at: new Date(),
      email_verification_token: null,
      email_verification_expires_at: null,
    });
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) return; // sempre retorna 200 por segurança

    const token = generateToken();
    const tokenHash = hashToken(token);

    await this.userRepo.update(user.id, {
      password_reset_token: tokenHash,
      password_reset_expires_at: addHours(
        new Date(),
        env.PASSWORD_RESET_TOKEN_EXPIRES_HOURS,
      ),
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Redefinição de senha — FlowManager",
      template: "reset-password",
      data: { name: user.name, token },
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const user = await this._findUserByToken("password_reset_token", tokenHash);

    if (!user) throw new BadRequestError("Token inválido", "INVALID_TOKEN");
    if (!user.password_reset_expires_at || user.password_reset_expires_at < new Date()) {
      throw new BadRequestError("Token expirado", "TOKEN_EXPIRED");
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await this.userRepo.update(user.id, {
      password_hash,
      password_changed_at: new Date(),
      password_reset_token: null,
      password_reset_expires_at: null,
    });
  }

  private async _issueTokens(userId: string) {
    const access_token = signAccessToken(userId);

    const refreshToken = generateToken();
    const refreshTokenHash = hashToken(refreshToken);

    await this.tokenRepo.createRefreshToken({
      user_id: userId,
      token_hash: refreshTokenHash,
      expires_at: addDays(new Date(), 7),
    });

    return { access_token, refresh_token: refreshToken };
  }

  private async _findUserByToken(
    field: "email_verification_token" | "password_reset_token",
    tokenHash: string,
  ) {
    return prisma_findUserByTokenField(field, tokenHash);
  }
}

// helpers de acesso direto ao prisma para buscas por token
import { prisma } from "../../lib/prisma.js";

async function prisma_findUserByTokenField(
  field: "email_verification_token" | "password_reset_token",
  tokenHash: string,
) {
  return prisma.user.findFirst({
    where: { [field]: tokenHash, deleted_at: null },
  });
}
