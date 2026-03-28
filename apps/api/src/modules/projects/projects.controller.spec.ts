import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registrarUsuario(overrides: { email?: string; name?: string } = {}) {
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    body: {
      name: overrides.name ?? "João Silva",
      email: overrides.email ?? "joao@test.com",
      password: "minhasenha123",
    },
  });
  const { access_token, user } = response.json().data;
  return { access_token, user };
}

async function criarWorkspace(token: string, name = "Meu Workspace") {
  const response = await app.inject({
    method: "POST",
    url: "/workspaces",
    headers: { authorization: `Bearer ${token}` },
    body: { name },
  });
  return response.json().data.workspace;
}

async function criarProjeto(
  token: string,
  workspaceId: string,
  overrides: { name?: string; description?: string; deadline?: string } = {},
) {
  return app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects`,
    headers: { authorization: `Bearer ${token}` },
    body: {
      name: overrides.name ?? "Meu Projeto",
      description: overrides.description ?? null,
      deadline: overrides.deadline ?? null,
    },
  });
}

// Adiciona um usuário como membro de um workspace com um papel específico
async function adicionarMembro(
  workspaceId: string,
  userId: string,
  role: "ADMIN" | "MEMBER" = "MEMBER",
) {
  await prisma.workspaceMember.create({
    data: {
      workspace_id: workspaceId,
      user_id: userId,
      role,
      joined_at: new Date(),
    },
  });
}

// ─── POST /workspaces/:id/projects ────────────────────────────────────────────

describe("POST /workspaces/:id/projects", () => {
  it("deve permitir ao super admin criar um projeto", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await criarProjeto(access_token, workspace.id, {
      name: "Meu Projeto",
      description: "Descrição do projeto",
    });

    // Assert
    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.data.project.name).toBe("Meu Projeto");
    expect(body.data.project.slug).toBe("meu-projeto");
    expect(body.data.project.status).toBe("ACTIVE");
  });

  it("deve permitir a um admin criar um projeto", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");

    // Act
    const response = await criarProjeto(tokenAdmin, workspace.id);

    expect(response.statusCode).toBe(201);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");

    // Act
    const response = await criarProjeto(tokenMembro, workspace.id);

    expect(response.statusCode).toBe(403);
  });

  it("deve gerar slug único quando já existe projeto com mesmo nome no workspace", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarProjeto(access_token, workspace.id, { name: "Meu Projeto" });

    // Act — mesmo nome
    const response = await criarProjeto(access_token, workspace.id, {
      name: "Meu Projeto",
    });

    // Assert — slug deve ser único dentro do workspace
    expect(response.statusCode).toBe(201);
    expect(response.json().data.project.slug).toBe("meu-projeto-2");
  });

  it("deve permitir mesmo slug em workspaces diferentes", async () => {
    // O slug é único por workspace, não globalmente
    const { access_token: tokenA } = await registrarUsuario({
      email: "a@test.com",
    });
    const { access_token: tokenB } = await registrarUsuario({
      email: "b@test.com",
    });

    const workspaceA = await criarWorkspace(tokenA, "Workspace A");
    const workspaceB = await criarWorkspace(tokenB, "Workspace B");

    // Act — mesmo nome em workspaces diferentes
    const responseA = await criarProjeto(tokenA, workspaceA.id, {
      name: "Projeto X",
    });
    const responseB = await criarProjeto(tokenB, workspaceB.id, {
      name: "Projeto X",
    });

    // Assert — os dois devem ter o mesmo slug sem conflito
    expect(responseA.statusCode).toBe(201);
    expect(responseB.statusCode).toBe(201);
    expect(responseA.json().data.project.slug).toBe("projeto-x");
    expect(responseB.json().data.project.slug).toBe("projeto-x");
  });

  it("deve retornar 400 se o nome está vazio", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);

    // Act — usuário de fora tenta criar projeto
    const response = await criarProjeto(tokenOutro, workspace.id);

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/workspaces/qualquer-id/projects",
      body: { name: "Projeto" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces/:id/projects ─────────────────────────────────────────────

describe("GET /workspaces/:id/projects", () => {
  it("deve retornar apenas projetos ativos para qualquer membro", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarProjeto(access_token, workspace.id, { name: "Projeto Ativo" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const projects = response.json().data.projects;
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Projeto Ativo");
    expect(projects[0].status).toBe("ACTIVE");
  });

  it("não deve retornar projetos arquivados na listagem padrão", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    const projetoResponse = await criarProjeto(access_token, workspace.id, {
      name: "Projeto a Arquivar",
    });
    const projetoId = projetoResponse.json().data.project.id;

    // Arquiva o projeto
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/archive`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — lista vazia, projeto arquivado não aparece
    const projects = response.json().data.projects;
    expect(projects).toHaveLength(0);
  });

  it("não deve retornar projetos deletados", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    const projetoResponse = await criarProjeto(access_token, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Deleta o projeto
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    const projects = response.json().data.projects;
    expect(projects).toHaveLength(0);
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/qualquer-id/projects",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces/:id/projects/archived ────────────────────────────────────

describe("GET /workspaces/:id/projects/archived", () => {
  it("deve retornar apenas projetos arquivados", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    const projetoResponse = await criarProjeto(access_token, workspace.id, {
      name: "Projeto Arquivado",
    });
    const projetoId = projetoResponse.json().data.project.id;

    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/archive`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Cria outro projeto ativo para confirmar que não aparece aqui
    await criarProjeto(access_token, workspace.id, { name: "Projeto Ativo" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/archived`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const projects = response.json().data.projects;
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Projeto Arquivado");
    expect(projects[0].status).toBe("ARCHIVED");
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/archived`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ─── GET /workspaces/:id/projects/:projectId ──────────────────────────────────

describe("GET /workspaces/:id/projects/:projectId", () => {
  it("deve retornar detalhes do projeto para qualquer membro", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoResponse = await criarProjeto(access_token, workspace.id, {
      name: "Meu Projeto",
    });
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.project.name).toBe("Meu Projeto");
  });

  it("deve retornar 404 se o projeto não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/id-inexistente`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    const projetoResponse = await criarProjeto(tokenDono, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/qualquer-id/projects/qualquer-projeto",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /workspaces/:id/projects/:projectId ────────────────────────────────

describe("PATCH /workspaces/:id/projects/:projectId", () => {
  it("deve permitir ao super admin editar o projeto", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoResponse = await criarProjeto(access_token, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Nome Atualizado", description: "Nova descrição" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.project.name).toBe("Nome Atualizado");
  });

  it("deve permitir a um admin editar o projeto", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");

    const projetoResponse = await criarProjeto(tokenDono, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
      body: { name: "Editado pelo Admin" },
    });

    expect(response.statusCode).toBe(200);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");

    const projetoResponse = await criarProjeto(tokenDono, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { name: "Tentativa" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/workspaces/qualquer-id/projects/qualquer-projeto",
      body: { name: "Teste" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /workspaces/:id/projects/:projectId/archive ────────────────────────

describe("PATCH /workspaces/:id/projects/:projectId/archive", () => {
  it("deve arquivar o projeto e retornar status ARCHIVED", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoResponse = await criarProjeto(access_token, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/archive`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.project.status).toBe("ARCHIVED");

    // Confirma no banco
    const projeto = await prisma.project.findUnique({
      where: { id: projetoId },
    });
    expect(projeto?.archived_at).not.toBeNull();
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");

    const projetoResponse = await criarProjeto(tokenDono, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/archive`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/workspaces/qualquer-id/projects/qualquer-projeto/archive",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /workspaces/:id/projects/:projectId/unarchive ──────────────────────

describe("PATCH /workspaces/:id/projects/:projectId/unarchive", () => {
  it("deve desarquivar o projeto e retornar status ACTIVE", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoResponse = await criarProjeto(access_token, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Arquiva primeiro
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/archive`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act — desarquiva
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/unarchive`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.project.status).toBe("ACTIVE");

    const projeto = await prisma.project.findUnique({
      where: { id: projetoId },
    });
    expect(projeto?.archived_at).toBeNull();
  });

  it("deve reaparecer na listagem principal após desarquivar", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoResponse = await criarProjeto(access_token, workspace.id, {
      name: "Projeto Ressuscitado",
    });
    const projetoId = projetoResponse.json().data.project.id;

    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/archive`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projetoId}/unarchive`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — aparece de volta na listagem ativa
    const listResponse = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    const projects = listResponse.json().data.projects;
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Projeto Ressuscitado");
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/workspaces/qualquer-id/projects/qualquer-projeto/unarchive",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── DELETE /workspaces/:id/projects/:projectId ───────────────────────────────

describe("DELETE /workspaces/:id/projects/:projectId", () => {
  it("deve permitir ao super admin deletar o projeto", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoResponse = await criarProjeto(access_token, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(204);
  });

  it("deve fazer soft delete — projeto fica no banco com deleted_at preenchido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoResponse = await criarProjeto(access_token, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const projeto = await prisma.project.findUnique({
      where: { id: projetoId },
    });
    expect(projeto).not.toBeNull();
    expect(projeto?.deleted_at).not.toBeNull();
  });

  it("deve retornar 403 se o usuário é admin mas não super admin", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");

    const projetoResponse = await criarProjeto(tokenDono, workspace.id);
    const projetoId = projetoResponse.json().data.project.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projetoId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/workspaces/qualquer-id/projects/qualquer-projeto",
    });

    expect(response.statusCode).toBe(401);
  });
});
