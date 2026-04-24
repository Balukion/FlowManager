import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";

vi.mock("../../lib/s3.js", () => ({
  generatePresignedUploadUrl: vi
    .fn()
    .mockResolvedValue("https://fake-s3.amazonaws.com/upload?token=fake"),
  getPublicUrl: vi
    .fn()
    .mockReturnValue("https://fake-s3.amazonaws.com/logos/ws-id.jpg"),
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

async function registrarUsuario(overrides: {
  email?: string;
  name?: string;
  password?: string;
} = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    body: {
      name: overrides.name ?? "João Silva",
      email: overrides.email ?? "joao@test.com",
      password: overrides.password ?? "minhasenha123",
    },
  });

  const { access_token, user } = response.json().data;
  return { access_token, user };
}

async function criarWorkspace(token: string, overrides: {
  name?: string;
  description?: string;
  color?: string;
} = {}) {
  return app.inject({
    method: "POST",
    url: "/workspaces",
    headers: { authorization: `Bearer ${token}` },
    body: {
      name: overrides.name ?? "Meu Workspace",
      description: overrides.description ?? null,
      color: overrides.color ?? null,
    },
  });
}

// ─── POST /workspaces ─────────────────────────────────────────────────────────

describe("POST /workspaces", () => {
  it("deve criar workspace e retornar 201 com dados completos", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await criarWorkspace(access_token, {
      name: "Meu Workspace",
      description: "Descrição do workspace",
    });

    // Assert
    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.data.workspace.name).toBe("Meu Workspace");
    expect(body.data.workspace.slug).toBe("meu-workspace");
    expect(body.data.workspace.description).toBe("Descrição do workspace");
    expect(body.data.workspace.id).toBeDefined();
  });

  it("deve definir o criador como owner do workspace", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();

    // Act
    const response = await criarWorkspace(access_token);

    // Assert
    const workspace = response.json().data.workspace;
    expect(workspace.owner_id).toBe(user.id);
  });

  it("deve adicionar o criador como membro do workspace automaticamente", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();

    // Act
    const response = await criarWorkspace(access_token);
    const workspaceId = response.json().data.workspace.id;

    // Assert — verifica no banco se o membro foi criado
    const membro = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: user.id,
        },
      },
    });
    expect(membro).not.toBeNull();
  });

  it("deve gerar slug único quando já existe workspace com mesmo nome", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    await criarWorkspace(access_token, { name: "Meu Workspace" });

    // Act — cria segundo workspace com mesmo nome
    const response = await criarWorkspace(access_token, {
      name: "Meu Workspace",
    });

    // Assert — slug deve ser diferente
    const slug = response.json().data.workspace.slug;
    expect(slug).toBe("meu-workspace-2");
  });

  it("deve retornar 400 se o nome está vazio", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/workspaces",
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/workspaces",
      body: { name: "Meu Workspace" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces ──────────────────────────────────────────────────────────

describe("GET /workspaces", () => {
  it("deve retornar apenas os workspaces que o usuário participa", async () => {
    // Arrange — dois usuários, cada um com seu workspace
    const { access_token: tokenA } = await registrarUsuario({
      email: "a@test.com",
    });
    const { access_token: tokenB } = await registrarUsuario({
      email: "b@test.com",
    });

    await criarWorkspace(tokenA, { name: "Workspace do A" });
    await criarWorkspace(tokenB, { name: "Workspace do B" });

    // Act — usuário A lista seus workspaces
    const response = await app.inject({
      method: "GET",
      url: "/workspaces",
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert — só deve ver o workspace dele
    expect(response.statusCode).toBe(200);

    const workspaces = response.json().data.workspaces;
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].name).toBe("Workspace do A");
  });

  it("deve retornar lista vazia se o usuário não tem workspaces", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/workspaces",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const workspaces = response.json().data.workspaces;
    expect(workspaces).toHaveLength(0);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces/:id ──────────────────────────────────────────────────────

describe("GET /workspaces/:id", () => {
  it("deve retornar detalhes do workspace para um membro", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token, {
      name: "Meu Workspace",
    });
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.workspace.name).toBe("Meu Workspace");
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act — usuário que não é membro tenta acessar
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 404 se o workspace não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/id-que-nao-existe",
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/qualquer-id",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces/:id/me ───────────────────────────────────────────────────

describe("GET /workspaces/:id/me", () => {
  it("deve retornar o membership do usuário autenticado no workspace", async () => {
    const { access_token, user } = await registrarUsuario({ email: "me@test.com" });
    const criarResponse = await criarWorkspace(access_token, {
      name: "Workspace com membership",
    });
    const workspaceId = criarResponse.json().data.workspace.id;

    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}/me`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.member).toMatchObject({
      workspace_id: workspaceId,
      user_id: user.id,
      role: "ADMIN",
    });
  });

  it("deve retornar 403 quando o usuário não participa do workspace", async () => {
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono-me@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro-me@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}/me`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 404 quando o workspace não existe", async () => {
    const { access_token } = await registrarUsuario({ email: "missing-me@test.com" });

    const response = await app.inject({
      method: "GET",
      url: "/workspaces/id-que-nao-existe/me",
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 401 quando não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/qualquer-id/me",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /workspaces/:id ────────────────────────────────────────────────────

describe("PATCH /workspaces/:id", () => {
  it("deve permitir ao super admin editar o workspace", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Nome Atualizado", description: "Nova descrição" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.workspace.name).toBe("Nome Atualizado");
  });

  it("deve persistir as alterações no banco", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Nome Atualizado" },
    });

    // Assert
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    expect(workspace?.name).toBe("Nome Atualizado");
  });

  it("deve retornar 403 se o usuário é admin mas não super admin", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Adiciona o segundo usuário como admin no banco diretamente
    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: admin.id,
        role: "ADMIN",
        joined_at: new Date(),
      },
    });

    // Act — admin tenta editar o workspace
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
      body: { name: "Tentativa de Edição" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: membro.id,
        role: "MEMBER",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { name: "Tentativa" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/workspaces/qualquer-id",
      body: { name: "Teste" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── DELETE /workspaces/:id ───────────────────────────────────────────────────

describe("DELETE /workspaces/:id", () => {
  it("deve permitir ao super admin deletar o workspace", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(204);
  });

  it("deve fazer soft delete — workspace fica no banco com deleted_at preenchido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — registro ainda existe no banco, só com deleted_at preenchido
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    expect(workspace).not.toBeNull();
    expect(workspace?.deleted_at).not.toBeNull();
  });

  it("deve sumir da listagem após ser deletado", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — não aparece mais na listagem
    const listResponse = await app.inject({
      method: "GET",
      url: "/workspaces",
      headers: { authorization: `Bearer ${access_token}` },
    });
    const workspaces = listResponse.json().data.workspaces;
    expect(workspaces).toHaveLength(0);
  });

  it("deve retornar 403 se o usuário é admin mas não super admin", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: admin.id,
        role: "ADMIN",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/workspaces/qualquer-id",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces/:id/members ──────────────────────────────────────────────

describe("GET /workspaces/:id/members", () => {
  it("deve listar todos os membros do workspace", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: membro.id,
        role: "MEMBER",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}/members`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const members = response.json().data.members;
    expect(members).toHaveLength(2); // dono + membro
  });

  it("deve incluir os dados básicos do usuário em cada membro", async () => {
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono-members-user@test.com",
      name: "Dono Workspace",
    });
    const { user: membro } = await registrarUsuario({
      email: "membro-members-user@test.com",
      name: "Membro Workspace",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: membro.id,
        role: "MEMBER",
        joined_at: new Date(),
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}/members`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });

    expect(response.statusCode).toBe(200);

    const members = response.json().data.members;
    expect(members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: dono.id,
          user: expect.objectContaining({
            id: dono.id,
            name: "Dono Workspace",
            email: "dono-members-user@test.com",
          }),
        }),
        expect.objectContaining({
          user_id: membro.id,
          user: expect.objectContaining({
            id: membro.id,
            name: "Membro Workspace",
            email: "membro-members-user@test.com",
          }),
        }),
      ]),
    );
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}/members`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/qualquer-id/members",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /workspaces/:id/members/:userId ────────────────────────────────────

describe("PATCH /workspaces/:id/members/:userId — alterar role", () => {
  it("deve permitir ao super admin promover um membro para admin", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: membro.id,
        role: "MEMBER",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/members/${membro.id}`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { role: "ADMIN" },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const membroAtualizado = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: membro.id,
        },
      },
    });
    expect(membroAtualizado?.role).toBe("ADMIN");
  });

  it("deve permitir ao super admin rebaixar um admin para membro", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: admin.id,
        role: "ADMIN",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/members/${admin.id}`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { role: "MEMBER" },
    });

    expect(response.statusCode).toBe(200);
  });

  it("deve retornar 403 se um admin tenta rebaixar outro admin", async () => {
    // Arrange — só super admin pode rebaixar admins
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const { user: outroAdmin } = await registrarUsuario({
      email: "outro-admin@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.createMany({
      data: [
        { workspace_id: workspaceId, user_id: admin.id, role: "ADMIN", joined_at: new Date() },
        { workspace_id: workspaceId, user_id: outroAdmin.id, role: "ADMIN", joined_at: new Date() },
      ],
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/members/${outroAdmin.id}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
      body: { role: "MEMBER" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/workspaces/qualquer-id/members/qualquer-user",
      body: { role: "ADMIN" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── DELETE /workspaces/:id/members/:userId ───────────────────────────────────

describe("DELETE /workspaces/:id/members/:userId — remover membro", () => {
  it("deve permitir ao super admin remover um membro", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: membro.id,
        role: "MEMBER",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}/members/${membro.id}`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);

    const membroRemovido = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: membro.id,
        },
      },
    });
    expect(membroRemovido).toBeNull();
  });

  it("deve retornar 403 ao tentar remover o próprio super admin", async () => {
    // O super admin não pode se auto-remover — precisaria transferir ownership primeiro
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}/members/${dono.id}`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/workspaces/qualquer-id/members/qualquer-user",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /workspaces/:id/transfer ──────────────────────────────────────────

describe("PATCH /workspaces/:id/transfer — transferir ownership", () => {
  it("deve permitir ao super admin transferir ownership para um admin", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: novoAdmin } = await registrarUsuario({
      email: "novo-admin@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: novoAdmin.id,
        role: "ADMIN",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/transfer`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { new_owner_id: novoAdmin.id },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    expect(workspace?.owner_id).toBe(novoAdmin.id);
  });

  it("deve retornar 400 ao tentar transferir para um membro comum", async () => {
    // Só admins podem receber o ownership
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: membro.id,
        role: "MEMBER",
        joined_at: new Date(),
      },
    });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/transfer`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { new_owner_id: membro.id },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 403 se quem tenta transferir não é super admin", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const { user: outroAdmin } = await registrarUsuario({
      email: "outro@test.com",
    });

    const criarResponse = await criarWorkspace(tokenDono);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.createMany({
      data: [
        { workspace_id: workspaceId, user_id: admin.id, role: "ADMIN", joined_at: new Date() },
        { workspace_id: workspaceId, user_id: outroAdmin.id, role: "ADMIN", joined_at: new Date() },
      ],
    });

    // Act — admin tenta transferir ownership
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/transfer`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
      body: { new_owner_id: outroAdmin.id },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/workspaces/qualquer-id/transfer",
      body: { new_owner_id: "qualquer-id" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── DELETE /workspaces/:id — cascade delete ──────────────────────────────────

describe("DELETE /workspaces/:id — cascade delete", () => {
  it("deve soft deletar projetos do workspace em cascata", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    // Cria dois projetos
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Projeto 1" },
    });
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Projeto 2" },
    });

    // Act — deleta o workspace
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — projetos têm deleted_at preenchido
    const projetos = await prisma.project.findMany({
      where: { workspace_id: workspaceId },
    });
    expect(projetos).toHaveLength(2);
    projetos.forEach((p) => expect(p.deleted_at).not.toBeNull());
  });

  it("deve soft deletar tarefas dos projetos em cascata", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    const projetoResponse = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Projeto" },
    });
    const projectId = projetoResponse.json().data.project.id;

    await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "Tarefa 1", priority: "LOW" },
    });
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "Tarefa 2", priority: "LOW" },
    });

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — tarefas têm deleted_at preenchido
    const tarefas = await prisma.task.findMany({
      where: { project_id: projectId },
    });
    expect(tarefas).toHaveLength(2);
    tarefas.forEach((t) => expect(t.deleted_at).not.toBeNull());
  });

  it("deve soft deletar passos das tarefas em cascata", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    const projetoResponse = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Projeto" },
    });
    const projectId = projetoResponse.json().data.project.id;

    const tarefaResponse = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "Tarefa", priority: "LOW" },
    });
    const taskId = tarefaResponse.json().data.task.id;

    await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/steps`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "Passo 1" },
    });

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const passos = await prisma.step.findMany({ where: { task_id: taskId } });
    expect(passos).toHaveLength(1);
    expect(passos[0].deleted_at).not.toBeNull();
  });

  it("deve remover membros e convites imediatamente (não soft delete)", async () => {
    // workspace_members e invitations são deletados de imediato —
    // não faz sentido manter histórico de membros de um workspace deletado.
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });
    const criarResponse = await criarWorkspace(access_token);
    const workspaceId = criarResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: {
        workspace_id: workspaceId,
        user_id: membro.id,
        role: "MEMBER",
        joined_at: new Date(),
      },
    });

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — nenhum registro de membro deve existir mais
    const membros = await prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
    });
    expect(membros).toHaveLength(0);
  });
});

// ─── Activity logs como efeito colateral ─────────────────────────────────────

describe("activity logs — efeitos colaterais de ações no workspace", () => {
  it("deve criar log MEMBER_ROLE_CHANGED ao alterar o role de um membro", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });

    const wsResponse = await criarWorkspace(tokenDono);
    const workspaceId = wsResponse.json().data.workspace.id;

    await prisma.workspaceMember.create({
      data: { workspace_id: workspaceId, user_id: membro.id, role: "MEMBER", joined_at: new Date() },
    });

    // Act — promove membro para admin
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/members/${membro.id}`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { role: "ADMIN" },
    });

    // Assert
    const log = await prisma.activityLog.findFirst({
      where: { workspace_id: workspaceId, action: "MEMBER_ROLE_CHANGED" },
    });
    expect(log).not.toBeNull();
    expect(log?.user_id).toBe(dono.id);
    expect(log?.metadata).toMatchObject({ from: "MEMBER", to: "ADMIN" });
  });
});

// ─── POST /workspaces/:id/logo/presign ───────────────────────────────────────

describe("POST /workspaces/:id/logo/presign", () => {
  it("deve retornar upload_url e final_url para JPEG", async () => {
    const { access_token } = await registrarUsuario({ email: "owner@test.com" });
    const wsRes = await criarWorkspace(access_token);
    const workspaceId = wsRes.json().data.workspace.id;

    const res = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/logo/presign`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content_type: "image/jpeg", file_size_bytes: 1024 * 1024 },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data).toHaveProperty("upload_url");
    expect(data).toHaveProperty("final_url");
  });

  it("deve retornar 400 para tipo de arquivo inválido", async () => {
    const { access_token } = await registrarUsuario({ email: "owner2@test.com" });
    const wsRes = await criarWorkspace(access_token);
    const workspaceId = wsRes.json().data.workspace.id;

    const res = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/logo/presign`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content_type: "image/gif", file_size_bytes: 1024 },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("INVALID_FILE_TYPE");
  });

  it("deve retornar 400 quando arquivo excede 5MB", async () => {
    const { access_token } = await registrarUsuario({ email: "owner3@test.com" });
    const wsRes = await criarWorkspace(access_token);
    const workspaceId = wsRes.json().data.workspace.id;

    const res = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/logo/presign`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content_type: "image/png", file_size_bytes: 6 * 1024 * 1024 },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("FILE_TOO_LARGE");
  });

  it("deve retornar 403 se o usuário não é dono do workspace", async () => {
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono4@test.com" });
    const { access_token: tokenMembro } = await registrarUsuario({ email: "membro4@test.com" });
    const wsRes = await criarWorkspace(tokenDono);
    const workspaceId = wsRes.json().data.workspace.id;

    const res = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/logo/presign`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { content_type: "image/png", file_size_bytes: 1024 },
    });

    expect(res.statusCode).toBe(403);
  });
});

// ─── PATCH /workspaces/:id/logo ───────────────────────────────────────────────

describe("PATCH /workspaces/:id/logo", () => {
  it("deve atualizar o logo_url do workspace", async () => {
    const { access_token } = await registrarUsuario({ email: "owner5@test.com" });
    const wsRes = await criarWorkspace(access_token);
    const workspaceId = wsRes.json().data.workspace.id;
    const logoUrl = "https://fake-s3.amazonaws.com/logos/ws-logo.png";

    const res = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/logo`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { logo_url: logoUrl },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.workspace.logo_url).toBe(logoUrl);
  });

  it("deve retornar 403 se o usuário não é dono", async () => {
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono6@test.com" });
    const { access_token: tokenMembro } = await registrarUsuario({ email: "membro6@test.com" });
    const wsRes = await criarWorkspace(tokenDono);
    const workspaceId = wsRes.json().data.workspace.id;

    const res = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspaceId}/logo`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { logo_url: "https://fake.com/logo.png" },
    });

    expect(res.statusCode).toBe(403);
  });
});

// ─── DELETE /workspaces/:id/logo ──────────────────────────────────────────────

describe("DELETE /workspaces/:id/logo", () => {
  it("deve remover o logo do workspace (logo_url = null)", async () => {
    const { access_token } = await registrarUsuario({ email: "owner7@test.com" });
    const wsRes = await criarWorkspace(access_token);
    const workspaceId = wsRes.json().data.workspace.id;

    // First set a logo
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { logo_url: "https://fake.com/logo.png" },
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspaceId}/logo`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.workspace.logo_url).toBeNull();
  });
});
