import { prisma } from "../../lib/prisma.js";

export interface CreateUserData {
  name: string;
  email: string;
  password_hash: string;
  email_verification_token?: string;
  email_verification_expires_at?: Date;
}

export interface UpdateUserData {
  name?: string;
  email_verified?: boolean;
  email_verified_at?: Date;
  email_verification_token?: string | null;
  email_verification_expires_at?: Date | null;
  password_hash?: string;
  password_reset_token?: string | null;
  password_reset_expires_at?: Date | null;
  password_changed_at?: Date;
  failed_login_attempts?: number;
  locked_until?: Date | null;
  avatar_url?: string | null;
  timezone?: string;
}

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deleted_at: null },
    });
  }

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deleted_at: null },
    });
  }

  async create(data: CreateUserData) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserData) {
    return prisma.user.update({ where: { id }, data });
  }

  async findByVerificationToken(tokenHash: string) {
    return prisma.user.findFirst({
      where: { email_verification_token: tokenHash, deleted_at: null },
    });
  }

  async findByPasswordResetToken(tokenHash: string) {
    return prisma.user.findFirst({
      where: { password_reset_token: tokenHash, deleted_at: null },
    });
  }
}

export class TokenRepository {
  async createRefreshToken(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
  }) {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({ where: { token_hash: tokenHash } });
  }

  async deleteRefreshToken(tokenHash: string) {
    await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
  }

  async createRevokedToken(data: { token_hash: string; expires_at: Date }) {
    return prisma.revokedToken.create({ data });
  }

  async isTokenRevoked(tokenHash: string): Promise<boolean> {
    const token = await prisma.revokedToken.findFirst({
      where: { token_hash: tokenHash },
    });
    return !!token;
  }

  async deleteExpiredRevokedTokens(): Promise<number> {
    const result = await prisma.revokedToken.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
    return result.count;
  }
}
