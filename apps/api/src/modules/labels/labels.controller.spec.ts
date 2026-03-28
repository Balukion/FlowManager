import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// Labels (etiquetas) pertencem a um workspace e podem ser aplicadas a tarefas.
// Apenas admins e super admins gerenciam labels (criar, editar, deletar).
// Qualquer membro pode ver as labels do workspace.
// Aplicar/remover labels de tarefas segue a mesma regra de permissão das tarefas.
//
// Rotas:
//   POST   /workspaces/:id/labels                       → cria label
//   GET    /workspaces/:id/labels                       → lista labels do workspace
//   PATCH  /workspaces/:id/labels/:labelId              → edita label
//   DELETE /workspaces/:id/labels/:labelId              → deleta label
//   POST   .../tasks/:taskId/labels                     → aplica label à tarefa
//   DELETE .../tasks/:taskId/labels/:labelId            → remove label da tarefa

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

async function criarWorkspace(token: string) {
  const response = await app.inject({
    method: "POST",
    url: "/workspaces",
    headers: { authorization: `Bearer ${token}` },
    body: { name: "Meu Workspace" },
  });
  return response.json().data.workspace;
}

async function criarProjeto(token: string, workspaceId: string) {
  const response = await app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects`,
    headers: { authorization: `Bearer ${token}` },
    body: { name: "Meu Projeto" },
  });
  return response.json().data.project;
}

async function criarTarefa(token: string, workspaceId: string, projectId: string) {
  const response = await app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    headers: { authorization: `Bearer ${token}` },
    body: { title: "Minha Tarefa", priority: "LOW" },
  });
  return response.json().data.task;
}

async function criarLabel(
  token: string,
  workspaceId: string,
  overrides: { name?: string; color?: string } = {},
) {
  return app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/labels`,
    headers: { authorization: `Bearer ${token}` },
    body: {
      name: overrides.name ?? "Bug",
      color: overrides.color ?? "#ef4444",
    },
  });
}

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

// ─── POST /workspaces/:id/labels ──────────────────────────────────────────────

describe("POST /workspaces/:id/labels", () => {
  it("deve criar label e retornar 201", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await criarLabel(access_token, workspace.id, {
      name: "Bug",
      color: "#ef4444",
    });

    // Assert
    expect(response.statusCode).toBe(201);

    const label = response.json().data.label;
    expect(label.name).toBe("Bug");
    expect(label.color).toBe("#ef4444");
    expect(label.workspace_id).toBe(workspace.id);
  });

  it("deve permitir que um admin crie label", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");

    // Act
    const response = await criarLabel(tokenAdmin, workspace.id);

    // Assert
    expect(response.statusCode).toBe(201);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");

    // Act
    const response = await criarLabel(tokenMembro, workspace.id);

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenForasteiro } = await registrarUsuario({
      email: "forasteiro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    // Act
    const response = await criarLabel(tokenForasteiro, workspace.id);

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 400 se o nome está vazio", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "", color: "#ef4444" },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se a cor não é um hex válido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Bug", color: "vermelho" },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 409 se já existe uma label com o mesmo nome no workspace", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act — cria a mesma label duas vezes
    await criarLabel(access_token, workspace.id, { name: "Urgente" });
    const response = await criarLabel(access_token, workspace.id, { name: "Urgente" });

    // Assert
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("LABEL_ALREADY_EXISTS");
  });

  it("deve permitir o mesmo nome de label em workspaces diferentes", async () => {
    // Labels são escopadas por workspace, não globais.
    // Arrange — dois workspaces distintos
    const { access_token: tokenA } = await registrarUsuario({ email: "a@test.com" });
    const { access_token: tokenB } = await registrarUsuario({ email: "b@test.com" });

    const wsA = await criarWorkspace(tokenA);
    const wsB = await criarWorkspace(tokenB);

    // Act — mesma label nos dois
    await criarLabel(tokenA, wsA.id, { name: "Feature" });
    const response = await criarLabel(tokenB, wsB.id, { name: "Feature" });

    // Assert — não deve conflitar
    expect(response.statusCode).toBe(201);
  });
});

// ─── GET /workspaces/:id/labels ───────────────────────────────────────────────

describe("GET /workspaces/:id/labels", () => {
  it("deve listar todas as labels do workspace", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarLabel(access_token, workspace.id, { name: "Bug" });
    await criarLabel(access_token, workspace.id, { name: "Feature" });
    await criarLabel(access_token, workspace.id, { name: "Melhoria" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.labels).toHaveLength(3);
  });

  it("deve retornar apenas labels do workspace solicitado", async () => {
    // Arrange — dois workspaces
    const { access_token: tokenA } = await registrarUsuario({ email: "a@test.com" });
    const { access_token: tokenB } = await registrarUsuario({ email: "b@test.com" });

    const wsA = await criarWorkspace(tokenA);
    const wsB = await criarWorkspace(tokenB);

    await criarLabel(tokenA, wsA.id, { name: "Label do WS-A" });
    await criarLabel(tokenB, wsB.id, { name: "Label do WS-B 1" });
    await criarLabel(tokenB, wsB.id, { name: "Label do WS-B 2" });

    // Act — lista labels do WS-A
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${wsA.id}/labels`,
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert — só aparece a label do WS-A
    const labels = response.json().data.labels;
    expect(labels).toHaveLength(1);
    expect(labels[0].name).toBe("Label do WS-A");
  });

  it("não deve incluir labels deletadas", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    const criada = await criarLabel(access_token, workspace.id, { name: "Temporária" });
    const labelId = criada.json().data.label.id;

    // Deleta a label
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.json().data.labels).toHaveLength(0);
  });

  it("deve permitir que um membro comum liste labels", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    await criarLabel(tokenDono, workspace.id, { name: "Bug" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/labels`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.labels).toHaveLength(1);
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenForasteiro } = await registrarUsuario({
      email: "forasteiro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/labels`,
      headers: { authorization: `Bearer ${tokenForasteiro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });
});

// ─── PATCH /workspaces/:id/labels/:labelId ────────────────────────────────────

describe("PATCH /workspaces/:id/labels/:labelId", () => {
  it("deve permitir ao super admin editar nome e cor da label", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const criada = await criarLabel(access_token, workspace.id, {
      name: "Nome Antigo",
      color: "#aaaaaa",
    });
    const labelId = criada.json().data.label.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Nome Novo", color: "#3b82f6" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const label = response.json().data.label;
    expect(label.name).toBe("Nome Novo");
    expect(label.color).toBe("#3b82f6");
  });

  it("deve permitir que um admin edite label", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");
    const criada = await criarLabel(tokenDono, workspace.id, { name: "Original" });
    const labelId = criada.json().data.label.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
      body: { name: "Editado pelo Admin" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const criada = await criarLabel(tokenDono, workspace.id, { name: "Label" });
    const labelId = criada.json().data.label.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { name: "Tentativa" },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 409 se o novo nome já existe em outra label do mesmo workspace", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarLabel(access_token, workspace.id, { name: "Bug" });
    const feature = await criarLabel(access_token, workspace.id, { name: "Feature" });
    const featureId = feature.json().data.label.id;

    // Act — tenta renomear "Feature" para "Bug" (que já existe)
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/labels/${featureId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Bug" },
    });

    // Assert
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("LABEL_ALREADY_EXISTS");
  });

  it("deve retornar 404 se a label não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/labels/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { name: "Novo Nome" },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 400 se o body está vazio", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const criada = await criarLabel(access_token, workspace.id);
    const labelId = criada.json().data.label.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: {},
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });
});

// ─── DELETE /workspaces/:id/labels/:labelId ───────────────────────────────────

describe("DELETE /workspaces/:id/labels/:labelId", () => {
  it("deve permitir ao super admin deletar label e retornar 204", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const criada = await criarLabel(access_token, workspace.id);
    const labelId = criada.json().data.label.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve fazer soft delete — deleted_at preenchido, registro permanece no banco", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const criada = await criarLabel(access_token, workspace.id);
    const labelId = criada.json().data.label.id;

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — o registro ainda existe, mas com deleted_at preenchido
    const label = await prisma.label.findUnique({ where: { id: labelId } });
    expect(label).not.toBeNull();
    expect(label?.deleted_at).not.toBeNull();
  });

  it("deve permitir que admin delete label", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");
    const criada = await criarLabel(tokenDono, workspace.id);
    const labelId = criada.json().data.label.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const criada = await criarLabel(tokenDono, workspace.id);
    const labelId = criada.json().data.label.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/labels/${labelId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 404 se a label não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/labels/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });
});

// ─── POST .../tasks/:taskId/labels — aplicar label à tarefa ──────────────────

describe("POST .../tasks/:taskId/labels", () => {
  it("deve aplicar label a uma tarefa e retornar 201", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const label = (await criarLabel(access_token, workspace.id)).json().data.label;

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { label_id: label.id },
    });

    // Assert
    expect(response.statusCode).toBe(201);
  });

  it("deve registrar a associação na tabela task_labels", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const label = (await criarLabel(access_token, workspace.id)).json().data.label;

    // Act
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { label_id: label.id },
    });

    // Assert — verifica na tabela de junção
    const associacao = await prisma.taskLabel.findFirst({
      where: { task_id: tarefa.id, label_id: label.id },
    });
    expect(associacao).not.toBeNull();
  });

  it("deve retornar 409 se a label já está aplicada à tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const label = (await criarLabel(access_token, workspace.id)).json().data.label;

    // Aplica a label uma primeira vez
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { label_id: label.id },
    });

    // Act — tenta aplicar novamente
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { label_id: label.id },
    });

    // Assert
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("LABEL_ALREADY_APPLIED");
  });

  it("deve retornar 400 se a label não pertence ao workspace da tarefa", async () => {
    // Arrange — label de outro workspace
    const { access_token: tokenA } = await registrarUsuario({ email: "a@test.com" });
    const { access_token: tokenB } = await registrarUsuario({ email: "b@test.com" });

    const wsA = await criarWorkspace(tokenA);
    const wsB = await criarWorkspace(tokenB);

    const projetoA = await criarProjeto(tokenA, wsA.id);
    const tarefaA = await criarTarefa(tokenA, wsA.id, projetoA.id);
    const labelB = (await criarLabel(tokenB, wsB.id)).json().data.label;

    // Act — tenta aplicar label do wsB na tarefa do wsA
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${wsA.id}/projects/${projetoA.id}/tasks/${tarefaA.id}/labels`,
      headers: { authorization: `Bearer ${tokenA}` },
      body: { label_id: labelB.id },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const label = (await criarLabel(tokenDono, workspace.id)).json().data.label;

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { label_id: label.id },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });
});

// ─── DELETE .../tasks/:taskId/labels/:labelId — remover label da tarefa ───────

describe("DELETE .../tasks/:taskId/labels/:labelId", () => {
  it("deve remover label da tarefa e retornar 204", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const label = (await criarLabel(access_token, workspace.id)).json().data.label;

    // Aplica a label primeiro
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { label_id: label.id },
    });

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels/${label.id}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve remover a associação da tabela task_labels", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const label = (await criarLabel(access_token, workspace.id)).json().data.label;

    await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { label_id: label.id },
    });

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels/${label.id}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — associação removida do banco
    const associacao = await prisma.taskLabel.findFirst({
      where: { task_id: tarefa.id, label_id: label.id },
    });
    expect(associacao).toBeNull();
  });

  it("deve retornar 404 se a label não estava aplicada à tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const label = (await criarLabel(access_token, workspace.id)).json().data.label;

    // Act — tenta remover label que nunca foi aplicada
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels/${label.id}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const label = (await criarLabel(tokenDono, workspace.id)).json().data.label;

    // Aplica a label como dono
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { label_id: label.id },
    });

    // Act — membro tenta remover
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/labels/${label.id}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });
});
