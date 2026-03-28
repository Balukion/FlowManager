import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";
import bcrypt from "bcryptjs";

// ─── Mock do S3 ───────────────────────────────────────────────────────────────
//
// Interceptamos o import do módulo S3 antes do código rodar.
// Qualquer chamada a generatePresignedUploadUrl ou getPublicUrl
// vai receber valores falsos — sem tocar na AWS de verdade.

vi.mock("../../lib/s3.js", () => ({
  generatePresignedUploadUrl: vi
    .fn()
    .mockResolvedValue("https://fake-s3.amazonaws.com/upload?token=fake"),
  getPublicUrl: vi
    .fn()
    .mockReturnValue("https://fake-s3.amazonaws.com/avatars/user-id.jpg"),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Registra um usuário e retorna o access token para usar nos testes
async function criarUsuarioAutenticado(overrides: {
  email?: string;
  password?: string;
  name?: string;
} = {}) {
  const email = overrides.email ?? "joao@test.com";
  const password = overrides.password ?? "minhasenha123";
  const name = overrides.name ?? "João Silva";

  const registerResponse = await app.inject({
    method: "POST",
    url: "/auth/register",
    body: { name, email, password },
  });

  const { access_token } = registerResponse.json().data;
  return { access_token, email, password };
}

// ─── GET /users/me ────────────────────────────────────────────────────────────

describe("GET /users/me", () => {
  it("deve retornar o perfil do usuário autenticado", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/users/me",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.data.user.email).toBe("joao@test.com");
    expect(body.data.user.name).toBe("João Silva");
    expect(body.data.user.password_hash).toBeUndefined();
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/users/me",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /users/me ──────────────────────────────────────────────────────────

describe("PATCH /users/me", () => {
  it("deve atualizar o nome com sucesso", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "João Atualizado" },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.data.user.name).toBe("João Atualizado");
  });

  it("deve persistir o nome atualizado no banco", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado({
      email: "joao@test.com",
    });

    // Act
    await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "João Atualizado" },
    });

    // Assert — verifica direto no banco
    const usuario = await prisma.user.findUnique({
      where: { email: "joao@test.com" },
    });
    expect(usuario?.name).toBe("João Atualizado");
  });

  it("deve atualizar o timezone com sucesso", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${access_token}` },
      body: { timezone: "America/Sao_Paulo" },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.data.user.timezone).toBe("America/Sao_Paulo");
  });

  it("deve retornar 400 se o nome está vazio", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se o timezone é inválido", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${access_token}` },
      body: { timezone: "Timezone/Inexistente" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me",
      body: { name: "Qualquer" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /users/me/password ─────────────────────────────────────────────────

describe("PATCH /users/me/password", () => {
  it("deve atualizar a senha com sucesso quando a senha atual está correta", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado({
      password: "minhasenha123",
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/password",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        current_password: "minhasenha123",
        new_password: "novasenha456",
      },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });

  it("deve permitir login com a nova senha após a troca", async () => {
    // Arrange
    const { access_token, email } = await criarUsuarioAutenticado({
      password: "minhasenha123",
    });

    // Act — troca a senha
    await app.inject({
      method: "PATCH",
      url: "/users/me/password",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        current_password: "minhasenha123",
        new_password: "novasenha456",
      },
    });

    // Assert — login com nova senha funciona
    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { email, password: "novasenha456" },
    });
    expect(loginResponse.statusCode).toBe(200);
  });

  it("deve invalidar a senha antiga após a troca", async () => {
    // Arrange
    const { access_token, email } = await criarUsuarioAutenticado({
      password: "minhasenha123",
    });

    // Act
    await app.inject({
      method: "PATCH",
      url: "/users/me/password",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        current_password: "minhasenha123",
        new_password: "novasenha456",
      },
    });

    // Assert — senha antiga não funciona mais
    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { email, password: "minhasenha123" },
    });
    expect(loginResponse.statusCode).toBe(401);
  });

  it("deve retornar 401 se a senha atual está errada", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/password",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        current_password: "senhaerrada",
        new_password: "novasenha456",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("deve retornar 400 se a nova senha é igual à atual", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado({
      password: "minhasenha123",
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/password",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        current_password: "minhasenha123",
        new_password: "minhasenha123",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se a nova senha tem menos de 8 caracteres", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/password",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        current_password: "minhasenha123",
        new_password: "curta",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/password",
      body: {
        current_password: "minhasenha123",
        new_password: "novasenha456",
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── POST /users/me/avatar/presign ────────────────────────────────────────────

describe("POST /users/me/avatar/presign", () => {
  it("deve retornar uma presigned URL para upload de JPEG", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/users/me/avatar/presign",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        content_type: "image/jpeg",
        file_size_bytes: 1024 * 1024, // 1MB
      },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.data.upload_url).toBeDefined();
    expect(body.data.final_url).toBeDefined();
  });

  it("deve retornar uma presigned URL para upload de PNG", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/users/me/avatar/presign",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        content_type: "image/png",
        file_size_bytes: 500 * 1024, // 500KB
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("deve retornar uma presigned URL para upload de WebP", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/users/me/avatar/presign",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        content_type: "image/webp",
        file_size_bytes: 800 * 1024, // 800KB
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("deve retornar 400 se o arquivo excede 2MB", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act — 3MB, acima do limite de avatar
    const response = await app.inject({
      method: "POST",
      url: "/users/me/avatar/presign",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        content_type: "image/jpeg",
        file_size_bytes: 3 * 1024 * 1024,
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("deve retornar 400 se o tipo do arquivo não é permitido", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act — PDF não é permitido
    const response = await app.inject({
      method: "POST",
      url: "/users/me/avatar/presign",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        content_type: "application/pdf",
        file_size_bytes: 100 * 1024,
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("deve retornar 400 se o tipo GIF não é permitido", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/users/me/avatar/presign",
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        content_type: "image/gif",
        file_size_bytes: 100 * 1024,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users/me/avatar/presign",
      body: {
        content_type: "image/jpeg",
        file_size_bytes: 1024,
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /users/me/avatar ───────────────────────────────────────────────────
//
// Após o frontend fazer o upload direto para o S3 usando a presigned URL,
// ele chama esse endpoint com a URL final para salvar no perfil.

describe("PATCH /users/me/avatar", () => {
  it("deve salvar a URL do avatar no perfil do usuário", async () => {
    // Arrange
    const { access_token, email } = await criarUsuarioAutenticado();
    const avatarUrl = "https://fake-s3.amazonaws.com/avatars/meu-avatar.jpg";

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/avatar",
      headers: { authorization: `Bearer ${access_token}` },
      body: { avatar_url: avatarUrl },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const usuario = await prisma.user.findUnique({
      where: { email },
    });
    expect(usuario?.avatar_url).toBe(avatarUrl);
  });

  it("deve retornar 400 se a URL enviada não é uma URL válida", async () => {
    // Arrange
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/avatar",
      headers: { authorization: `Bearer ${access_token}` },
      body: { avatar_url: "isso-nao-e-uma-url" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/users/me/avatar",
      body: { avatar_url: "https://exemplo.com/foto.jpg" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── DELETE /users/me/avatar ──────────────────────────────────────────────────

describe("DELETE /users/me/avatar", () => {
  it("deve remover o avatar e voltar para null no banco", async () => {
    // Arrange — cria usuário com avatar já definido
    const { access_token, email } = await criarUsuarioAutenticado();
    await prisma.user.update({
      where: { email },
      data: { avatar_url: "https://fake-s3.amazonaws.com/meu-avatar.jpg" },
    });

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: "/users/me/avatar",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const usuario = await prisma.user.findUnique({ where: { email } });
    expect(usuario?.avatar_url).toBeNull();
  });

  it("deve retornar 200 mesmo se o usuário não tinha avatar — operação idempotente", async () => {
    // Arrange — usuário sem avatar (padrão)
    const { access_token } = await criarUsuarioAutenticado();

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: "/users/me/avatar",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — não deve dar erro
    expect(response.statusCode).toBe(200);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/users/me/avatar",
    });

    expect(response.statusCode).toBe(401);
  });
});
