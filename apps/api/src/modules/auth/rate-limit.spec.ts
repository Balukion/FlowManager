import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";
import bcrypt from "bcryptjs";

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// Rate limiting protege endpoints sensíveis contra abuso.
// Configuração definida no CLAUDE.md:
//
//   POST /auth/login              → 5 por IP por minuto
//   POST /auth/forgot-password    → 3 por email por hora
//   POST /workspaces/:id/invitations → 10 por usuário por hora
//
// Nesses testes verificamos que ao exceder o limite a API retorna 429
// (Too Many Requests).

vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "fake-email-id" }),
}));

// Usa limites reais de rate limit neste spec — sobrescreve o guard do vitest config
// A checagem em auth.routes.ts é avaliada quando buildApp() registra as rotas,
// não no import, então setar aqui (antes do beforeAll) é suficiente.
process.env.DISABLE_RATE_LIMIT = "";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ─── POST /auth/login — 5 tentativas por IP por minuto ────────────────────────

describe("rate limit — POST /auth/login", () => {
  it("deve retornar 429 após exceder 5 requisições por minuto", async () => {
    // Arrange — cria um usuário para ter um alvo válido de login
    const hash = await bcrypt.hash("minhasenha123", 10);
    await prisma.user.create({
      data: {
        name: "Usuário Teste",
        email: "ratelimit@test.com",
        password_hash: hash,
        email_verified: true,
      },
    });

    // Act — faz 5 requisições (dentro do limite)
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: "POST",
        url: "/auth/login",
        body: { email: "ratelimit@test.com", password: "senhaerrada" },
      });
    }

    // A 6ª deve ser bloqueada
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { email: "ratelimit@test.com", password: "senhaerrada" },
    });

    // Assert
    expect(response.statusCode).toBe(429);
  });
});

// ─── POST /auth/forgot-password — 3 por email por hora ───────────────────────

describe("rate limit — POST /auth/forgot-password", () => {
  it("deve retornar 429 após exceder 3 requisições com o mesmo email", async () => {
    // Arrange
    const hash = await bcrypt.hash("minhasenha123", 10);
    await prisma.user.create({
      data: {
        name: "Usuário Teste",
        email: "forgot@test.com",
        password_hash: hash,
        email_verified: true,
      },
    });

    // Act — 3 requisições (dentro do limite)
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: "POST",
        url: "/auth/forgot-password",
        body: { email: "forgot@test.com" },
      });
    }

    // A 4ª deve ser bloqueada
    const response = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      body: { email: "forgot@test.com" },
    });

    // Assert
    expect(response.statusCode).toBe(429);
  });

  it("não deve bloquear requisições com emails diferentes", async () => {
    // O limite é por email — emails diferentes têm contadores independentes
    // Arrange
    const hash = await bcrypt.hash("minhasenha123", 10);
    await prisma.user.create({
      data: {
        name: "Usuário A",
        email: "a-forgot@test.com",
        password_hash: hash,
        email_verified: true,
      },
    });
    await prisma.user.create({
      data: {
        name: "Usuário B",
        email: "b-forgot@test.com",
        password_hash: hash,
        email_verified: true,
      },
    });

    // Esgota o limite do email A
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: "POST",
        url: "/auth/forgot-password",
        body: { email: "a-forgot@test.com" },
      });
    }

    // Act — email B ainda não foi usado, não deve estar bloqueado
    const response = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      body: { email: "b-forgot@test.com" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });
});

// ─── POST /workspaces/:id/invitations — 10 por usuário por hora ──────────────

describe("rate limit — POST /workspaces/:id/invitations", () => {
  it("deve retornar 429 após exceder 10 convites enviados pelo mesmo usuário", async () => {
    // Arrange
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      body: {
        name: "Dono",
        email: "dono-ratelimit@test.com",
        password: "minhasenha123",
      },
    });
    const { access_token } = registerResponse.json().data;

    const workspaceResponse = await app.inject({
      method: "POST",
      url: "/workspaces",
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Workspace" },
    });
    const workspaceId = workspaceResponse.json().data.workspace.id;

    // Act — envia 10 convites para emails diferentes (dentro do limite)
    for (let i = 0; i < 10; i++) {
      await app.inject({
        method: "POST",
        url: `/workspaces/${workspaceId}/invitations`,
        headers: { authorization: `Bearer ${access_token}` },
        body: { email: `convidado${i}@test.com` },
      });
    }

    // O 11º deve ser bloqueado
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/invitations`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { email: "convidado11@test.com" },
    });

    // Assert
    expect(response.statusCode).toBe(429);
  });
});
