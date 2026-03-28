import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { addHours } from "@flowmanager/shared";

// forgot-password envia email de reset via Resend. Mockamos para não
// depender do serviço externo nos testes.
vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "fake-email-id" }),
}));

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// verify-email: o usuário clica no link do email e confirma a conta.
// forgot-password: o usuário pede um link de recuperação.
// reset-password: o usuário usa o link para definir uma nova senha.
//
// Nesses testes não enviamos email de verdade. Criamos o token
// diretamente no banco para simular o que o sistema faria.

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Cria um usuário no banco com um token de verificação de email pronto
async function criarUsuarioComTokenVerificacao(overrides: {
  tokenExpirado?: boolean;
} = {}) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const hash = await bcrypt.hash("minhasenha123", 10);

  const expiresAt = overrides.tokenExpirado
    ? new Date(Date.now() - 1000)           // 1 segundo no passado = expirado
    : addHours(new Date(), 24);             // 24 horas no futuro = válido

  await prisma.user.create({
    data: {
      name: "João Silva",
      email: "joao@test.com",
      password_hash: hash,
      email_verified: false,
      email_verification_token: tokenHash,
      email_verification_expires_at: expiresAt,
    },
  });

  return token; // retornamos o token original (não o hash) para usar nos testes
}

// Cria um usuário no banco com um token de recuperação de senha pronto
async function criarUsuarioComTokenReset(overrides: {
  tokenExpirado?: boolean;
} = {}) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const hash = await bcrypt.hash("senhaantiga123", 10);

  const expiresAt = overrides.tokenExpirado
    ? new Date(Date.now() - 1000)
    : addHours(new Date(), 1);

  await prisma.user.create({
    data: {
      name: "João Silva",
      email: "joao@test.com",
      password_hash: hash,
      email_verified: true,
      password_reset_token: tokenHash,
      password_reset_expires_at: expiresAt,
    },
  });

  return token;
}

// ─── POST /auth/verify-email ──────────────────────────────────────────────────

describe("POST /auth/verify-email", () => {
  it("deve retornar 200 e marcar o email como verificado quando o token é válido", async () => {
    // Arrange — cria usuário com token de verificação no banco
    const token = await criarUsuarioComTokenVerificacao();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/verify-email",
      body: { token },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    // Verifica diretamente no banco se o campo foi atualizado
    const usuario = await prisma.user.findUnique({
      where: { email: "joao@test.com" },
    });
    expect(usuario?.email_verified).toBe(true);
    expect(usuario?.email_verified_at).not.toBeNull();
  });

  it("deve limpar o token após verificação — não pode ser usado duas vezes", async () => {
    // Arrange
    const token = await criarUsuarioComTokenVerificacao();

    // Act — verifica o email
    await app.inject({
      method: "POST",
      url: "/auth/verify-email",
      body: { token },
    });

    // Assert — tenta usar o mesmo token de novo
    const response = await app.inject({
      method: "POST",
      url: "/auth/verify-email",
      body: { token },
    });
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se o token é inválido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/verify-email",
      body: { token: "token_que_nao_existe" },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("deve retornar 400 se o token está expirado", async () => {
    // Arrange — cria usuário com token já expirado
    const token = await criarUsuarioComTokenVerificacao({ tokenExpirado: true });

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/verify-email",
      body: { token },
    });

    // Assert
    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("TOKEN_EXPIRED");
  });

  it("deve retornar 400 se o token não foi enviado", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/verify-email",
      body: {},
    });

    expect(response.statusCode).toBe(400);
  });
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

describe("POST /auth/forgot-password", () => {
  it("deve retornar 200 mesmo se o email não está cadastrado — não revelamos se existe", async () => {
    // Essa é uma regra de segurança importante: se retornássemos 404
    // quando o email não existe, um atacante poderia descobrir quais
    // emails estão cadastrados no sistema tentando vários endereços.

    const response = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      body: { email: "naoexiste@test.com" },
    });

    expect(response.statusCode).toBe(200);
  });

  it("deve retornar 200 e criar token de reset quando o email está cadastrado", async () => {
    // Arrange
    const hash = await bcrypt.hash("minhasenha123", 10);
    await prisma.user.create({
      data: {
        name: "João Silva",
        email: "joao@test.com",
        password_hash: hash,
        email_verified: true,
      },
    });

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      body: { email: "joao@test.com" },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    // Verifica que o token foi criado no banco
    const usuario = await prisma.user.findUnique({
      where: { email: "joao@test.com" },
    });
    expect(usuario?.password_reset_token).not.toBeNull();
    expect(usuario?.password_reset_expires_at).not.toBeNull();
  });

  it("deve retornar 400 se o email enviado é inválido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      body: { email: "isso-nao-e-email" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve normalizar o email para lowercase antes de buscar", async () => {
    // Arrange — email no banco em lowercase
    const hash = await bcrypt.hash("minhasenha123", 10);
    await prisma.user.create({
      data: {
        name: "João Silva",
        email: "joao@test.com",
        password_hash: hash,
        email_verified: true,
      },
    });

    // Act — envia com uppercase
    const response = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      body: { email: "JOAO@TEST.COM" },
    });

    // Assert — deve ter encontrado o usuário e criado o token
    expect(response.statusCode).toBe(200);
    const usuario = await prisma.user.findUnique({
      where: { email: "joao@test.com" },
    });
    expect(usuario?.password_reset_token).not.toBeNull();
  });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────

describe("POST /auth/reset-password", () => {
  it("deve retornar 200 e atualizar a senha quando o token é válido", async () => {
    // Arrange
    const token = await criarUsuarioComTokenReset();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, password: "novasenha456" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });

  it("deve atualizar a senha no banco com bcrypt", async () => {
    // Arrange
    const token = await criarUsuarioComTokenReset();

    // Act
    await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, password: "novasenha456" },
    });

    // Assert — a nova senha deve funcionar no login
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { email: "joao@test.com", password: "novasenha456" },
    });
    expect(response.statusCode).toBe(200);
  });

  it("deve invalidar a senha antiga após o reset", async () => {
    // Arrange
    const token = await criarUsuarioComTokenReset();

    // Act
    await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, password: "novasenha456" },
    });

    // Assert — senha antiga não funciona mais
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { email: "joao@test.com", password: "senhaantiga123" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("deve limpar o token após o uso — não pode resetar duas vezes com o mesmo token", async () => {
    // Arrange
    const token = await criarUsuarioComTokenReset();

    // Act — usa o token uma vez
    await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, password: "novasenha456" },
    });

    // Assert — tenta usar o mesmo token de novo
    const response = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, password: "outrasenha789" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se o token é inválido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token: "token_invalido", password: "novasenha456" },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  it("deve retornar 400 se o token está expirado", async () => {
    // Arrange
    const token = await criarUsuarioComTokenReset({ tokenExpirado: true });

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, password: "novasenha456" },
    });

    // Assert
    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("TOKEN_EXPIRED");
  });

  it("deve retornar 400 se a nova senha tem menos de 8 caracteres", async () => {
    // Arrange
    const token = await criarUsuarioComTokenReset();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { token, password: "curta" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se o token não foi enviado", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      body: { password: "novasenha456" },
    });

    expect(response.statusCode).toBe(400);
  });
});
