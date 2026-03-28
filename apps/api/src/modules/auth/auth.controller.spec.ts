import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";
import bcrypt from "bcryptjs";

// O registro de usuário dispara um email de verificação via Resend.
// Aqui não queremos enviar emails de verdade — mockamos o cliente.
vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "fake-email-id" }),
}));

// ─── O que são testes de integração? ─────────────────────────────────────────
//
// Aqui não usamos mocks. Subimos a aplicação Fastify completa e fazemos
// requisições HTTP reais contra ela. O banco de testes é usado de verdade.
// O setup.ts já garante que o banco é limpo após cada teste.
//
// app.inject() é o método do Fastify para simular requisições HTTP
// sem precisar de um servidor rodando de verdade na porta.

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
//
// Funções auxiliares para não repetir código nos testes.
// Cada helper encapsula uma operação comum.

async function registerUser(overrides: {
  name?: string;
  email?: string;
  password?: string;
} = {}) {
  return app.inject({
    method: "POST",
    url: "/auth/register",
    body: {
      name: overrides.name ?? "João Silva",
      email: overrides.email ?? "joao@test.com",
      password: overrides.password ?? "minhasenha123",
    },
  });
}

async function loginUser(email: string, password: string) {
  return app.inject({
    method: "POST",
    url: "/auth/login",
    body: { email, password },
  });
}

// ─── POST /auth/register ──────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  it("deve retornar 201 com user e tokens quando os dados são válidos", async () => {
    // Act
    const response = await registerUser();

    // Assert
    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.data.user.email).toBe("joao@test.com");
    expect(body.data.user.name).toBe("João Silva");
    expect(body.data.access_token).toBeDefined();
    expect(body.data.refresh_token).toBeDefined();

    // Nunca deve vazar o hash da senha na resposta
    expect(body.data.user.password_hash).toBeUndefined();
  });

  it("deve salvar o usuário no banco após o registro", async () => {
    // Act
    await registerUser({ email: "joao@test.com" });

    // Assert — verifica diretamente no banco
    const usuario = await prisma.user.findUnique({
      where: { email: "joao@test.com" },
    });
    expect(usuario).not.toBeNull();
    expect(usuario?.name).toBe("João Silva");
  });

  it("deve salvar a senha como hash — nunca em texto puro", async () => {
    // Act
    await registerUser({ email: "joao@test.com", password: "minhasenha123" });

    // Assert
    const usuario = await prisma.user.findUnique({
      where: { email: "joao@test.com" },
    });
    expect(usuario?.password_hash).not.toBe("minhasenha123");
    expect(usuario?.password_hash).toMatch(/^\$2[ab]\$10\$/); // formato bcrypt
  });

  it("deve retornar 409 se o email já está cadastrado", async () => {
    // Arrange — registra o usuário uma primeira vez
    await registerUser({ email: "joao@test.com" });

    // Act — tenta registrar de novo com o mesmo email
    const response = await registerUser({ email: "joao@test.com" });

    // Assert
    expect(response.statusCode).toBe(409);

    const body = response.json();
    expect(body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("deve retornar 400 se o email é inválido", async () => {
    const response = await registerUser({ email: "nao-e-um-email" });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se a senha tem menos de 8 caracteres", async () => {
    const response = await registerUser({ password: "curta" });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se o nome está vazio", async () => {
    const response = await registerUser({ name: "" });

    expect(response.statusCode).toBe(400);
  });

  it("deve normalizar o email para lowercase", async () => {
    // Act
    await registerUser({ email: "JOAO@TEST.COM" });

    // Assert — o banco deve ter o email em lowercase
    const usuario = await prisma.user.findUnique({
      where: { email: "joao@test.com" },
    });
    expect(usuario).not.toBeNull();
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  it("deve retornar 200 com tokens quando as credenciais são válidas", async () => {
    // Arrange — cria o usuário primeiro
    await registerUser({ email: "joao@test.com", password: "minhasenha123" });

    // Act
    const response = await loginUser("joao@test.com", "minhasenha123");

    // Assert
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.data.access_token).toBeDefined();
    expect(body.data.refresh_token).toBeDefined();
    expect(body.data.user.email).toBe("joao@test.com");
  });

  it("deve retornar 401 se o email não está cadastrado", async () => {
    const response = await loginUser("naoexiste@test.com", "qualquersenha");

    expect(response.statusCode).toBe(401);
  });

  it("deve retornar 401 se a senha está errada", async () => {
    // Arrange
    await registerUser({ email: "joao@test.com", password: "minhasenha123" });

    // Act
    const response = await loginUser("joao@test.com", "senhaerrada");

    // Assert
    expect(response.statusCode).toBe(401);
  });

  it("deve retornar 401 se a conta está bloqueada", async () => {
    // Arrange — cria usuário com conta bloqueada diretamente no banco
    const hash = await bcrypt.hash("minhasenha123", 10);
    await prisma.user.create({
      data: {
        name: "Usuário Bloqueado",
        email: "bloqueado@test.com",
        password_hash: hash,
        locked_until: new Date(Date.now() + 1000 * 60 * 30), // 30min no futuro
      },
    });

    // Act
    const response = await loginUser("bloqueado@test.com", "minhasenha123");

    // Assert
    expect(response.statusCode).toBe(401);

    const body = response.json();
    expect(body.error.code).toBe("ACCOUNT_LOCKED");
  });

  it("deve bloquear a conta após exceder o limite de tentativas", async () => {
    // Arrange
    await registerUser({ email: "joao@test.com", password: "minhasenha123" });

    // Act — faz 5 tentativas com senha errada (MAX_LOGIN_ATTEMPTS=5)
    for (let i = 0; i < 5; i++) {
      await loginUser("joao@test.com", "senhaerrada");
    }

    // Assert — na próxima tentativa, mesmo com senha correta, deve estar bloqueada
    const response = await loginUser("joao@test.com", "minhasenha123");
    expect(response.statusCode).toBe(401);

    const body = response.json();
    expect(body.error.code).toBe("ACCOUNT_LOCKED");
  });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {
  it("deve retornar 200 com novos tokens quando o refresh token é válido", async () => {
    // Arrange — registra e pega o refresh token
    const registerResponse = await registerUser();
    const { refresh_token } = registerResponse.json().data;

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      body: { refresh_token },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.data.access_token).toBeDefined();
    expect(body.data.refresh_token).toBeDefined();
  });

  it("deve invalidar o refresh token antigo após o uso — rotation", async () => {
    // Arrange
    const registerResponse = await registerUser();
    const { refresh_token } = registerResponse.json().data;

    // Act — usa o token uma vez
    await app.inject({
      method: "POST",
      url: "/auth/refresh",
      body: { refresh_token },
    });

    // Assert — tenta usar o mesmo token novamente, deve falhar
    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      body: { refresh_token },
    });
    expect(response.statusCode).toBe(401);
  });

  it("deve retornar 401 se o refresh token é inválido", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      body: { refresh_token: "token_completamente_invalido" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("deve retornar 400 se o refresh token não foi enviado", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      body: {},
    });

    expect(response.statusCode).toBe(400);
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  it("deve retornar 204 e invalidar os tokens", async () => {
    // Arrange — registra e pega os tokens
    const registerResponse = await registerUser();
    const { access_token, refresh_token } = registerResponse.json().data;

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { authorization: `Bearer ${access_token}` },
      body: { refresh_token },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve impedir o uso do refresh token após logout", async () => {
    // Arrange
    const registerResponse = await registerUser();
    const { access_token, refresh_token } = registerResponse.json().data;

    // Act — faz logout
    await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { authorization: `Bearer ${access_token}` },
      body: { refresh_token },
    });

    // Assert — tenta usar o refresh token depois do logout
    const response = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      body: { refresh_token },
    });
    expect(response.statusCode).toBe(401);
  });

  it("deve retornar 401 se o access token não foi enviado", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
      body: { refresh_token: "qualquer" },
    });

    expect(response.statusCode).toBe(401);
  });
});
