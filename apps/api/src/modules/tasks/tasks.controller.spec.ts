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

async function criarProjeto(token: string, workspaceId: string, name = "Meu Projeto") {
  const response = await app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects`,
    headers: { authorization: `Bearer ${token}` },
    body: { name },
  });
  return response.json().data.project;
}

async function criarTarefa(
  token: string,
  workspaceId: string,
  projectId: string,
  overrides: {
    title?: string;
    priority?: string;
    deadline?: string;
    description?: string;
  } = {},
) {
  return app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    headers: { authorization: `Bearer ${token}` },
    body: {
      title: overrides.title ?? "Minha Tarefa",
      priority: overrides.priority ?? "LOW",
      description: overrides.description ?? null,
      deadline: overrides.deadline ?? null,
    },
  });
}

async function criarPasso(
  token: string,
  workspaceId: string,
  projectId: string,
  taskId: string,
  title = "Meu Passo",
) {
  const response = await app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/steps`,
    headers: { authorization: `Bearer ${token}` },
    body: { title },
  });
  return response.json().data.step;
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

// ─── POST /workspaces/:id/projects/:projectId/tasks ───────────────────────────

describe("POST .../tasks", () => {
  it("deve criar tarefa e retornar 201 com número sequencial", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Act
    const response = await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Primeira Tarefa",
      priority: "HIGH",
    });

    // Assert
    expect(response.statusCode).toBe(201);

    const task = response.json().data.task;
    expect(task.title).toBe("Primeira Tarefa");
    expect(task.number).toBe(1);
    expect(task.priority).toBe("HIGH");
    expect(task.status).toBe("TODO");
    expect(task.status_is_manual).toBe(false);
  });

  it("deve incrementar o número sequencial por projeto", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Act — cria três tarefas
    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Tarefa 1" });
    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Tarefa 2" });
    const response = await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Tarefa 3",
    });

    // Assert — terceira tarefa tem number 3
    expect(response.json().data.task.number).toBe(3);
  });

  it("deve manter numeração independente por projeto", async () => {
    // O número é sequencial por projeto — não global
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoA = await criarProjeto(access_token, workspace.id, "Projeto A");
    const projetoB = await criarProjeto(access_token, workspace.id, "Projeto B");

    // Act — cria tarefa em cada projeto
    await criarTarefa(access_token, workspace.id, projetoA.id);
    await criarTarefa(access_token, workspace.id, projetoA.id);
    const responseB = await criarTarefa(access_token, workspace.id, projetoB.id);

    // Assert — primeira tarefa do projeto B começa do 1
    expect(responseB.json().data.task.number).toBe(1);
  });

  it("deve permitir a um admin criar tarefa", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");
    const projeto = await criarProjeto(tokenDono, workspace.id);

    // Act
    const response = await criarTarefa(tokenAdmin, workspace.id, projeto.id);

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
    const projeto = await criarProjeto(tokenDono, workspace.id);

    // Act
    const response = await criarTarefa(tokenMembro, workspace.id, projeto.id);

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 400 se o título está vazio", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "", priority: "LOW" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se a prioridade é inválida", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "Tarefa", priority: "URGENTE" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/workspaces/id/projects/id/tasks",
      body: { title: "Tarefa", priority: "LOW" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces/:id/projects/:projectId/tasks ────────────────────────────

describe("GET .../tasks", () => {
  it("deve retornar todas as tarefas ativas do projeto para qualquer membro", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Tarefa 1" });
    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Tarefa 2" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const tasks = response.json().data.tasks;
    expect(tasks).toHaveLength(2);
  });

  it("deve filtrar tarefas por status", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Tarefa Em Progresso",
    });
    const taskId = tarefaResponse.json().data.task.id;

    // Muda status para IN_PROGRESS
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "IN_PROGRESS" },
    });

    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Tarefa TODO" });

    // Act — filtra só IN_PROGRESS
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks?status=IN_PROGRESS`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const tasks = response.json().data.tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Tarefa Em Progresso");
  });

  it("deve filtrar tarefas por prioridade", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Alta Prioridade",
      priority: "HIGH",
    });
    await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Baixa Prioridade",
      priority: "LOW",
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks?priority=HIGH`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const tasks = response.json().data.tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Alta Prioridade");
  });

  it("não deve retornar tarefas deletadas", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.json().data.tasks).toHaveLength(0);
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
    const projeto = await criarProjeto(tokenDono, workspace.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/id/projects/id/tasks",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET .../tasks/:taskId ────────────────────────────────────────────────────

describe("GET .../tasks/:taskId", () => {
  it("deve retornar detalhes da tarefa para qualquer membro", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Tarefa Detalhada",
    });
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.task.title).toBe("Tarefa Detalhada");
  });

  it("deve retornar 404 se a tarefa não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/id-inexistente`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/id/projects/id/tasks/id",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH .../tasks/:taskId ──────────────────────────────────────────────────

describe("PATCH .../tasks/:taskId", () => {
  it("deve permitir ao admin editar título e prioridade", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "Título Atualizado", priority: "HIGH" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.task.title).toBe("Título Atualizado");
    expect(response.json().data.task.priority).toBe("HIGH");
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
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefaResponse = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { title: "Tentativa" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/workspaces/id/projects/id/tasks/id",
      body: { title: "Teste" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH .../tasks/:taskId/status ──────────────────────────────────────────

describe("PATCH .../tasks/:taskId/status — alteração manual", () => {
  it("deve alterar o status e marcar como manual", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "IN_PROGRESS" },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const task = response.json().data.task;
    expect(task.status).toBe("IN_PROGRESS");
    expect(task.status_is_manual).toBe(true);
    expect(task.status_overridden_by).toBeDefined();
  });

  it("deve retornar 400 se o status é inválido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "STATUS_INVALIDO" },
    });

    expect(response.statusCode).toBe(400);
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
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefaResponse = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/status`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { status: "DONE" },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ─── Status automático ────────────────────────────────────────────────────────
//
// Essa é a regra de negócio mais importante do módulo de tarefas.
// O status muda automaticamente com base nos passos — mas só se
// status_is_manual for false.

describe("status automático da tarefa", () => {
  it("deve mudar para DONE quando todos os passos são concluídos", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    const passo = await criarPasso(access_token, workspace.id, projeto.id, taskId);

    // Act — conclui o único passo
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/steps/${passo.id}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "DONE" },
    });

    // Assert — tarefa deve ter virado DONE automaticamente
    const taskResponse = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(taskResponse.json().data.task.status).toBe("DONE");
    expect(taskResponse.json().data.task.status_is_manual).toBe(false);
  });

  it("deve voltar para IN_PROGRESS quando um passo concluído é reaberto", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    const passo = await criarPasso(access_token, workspace.id, projeto.id, taskId);

    // Conclui o passo → tarefa vira DONE
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/steps/${passo.id}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "DONE" },
    });

    // Act — reabre o passo
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/steps/${passo.id}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "PENDING" },
    });

    // Assert — tarefa voltou para IN_PROGRESS
    const taskResponse = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(taskResponse.json().data.task.status).toBe("IN_PROGRESS");
  });

  it("não deve alterar status automaticamente se status_is_manual é true", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Define status manualmente como TODO
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "TODO" },
    });

    const passo = await criarPasso(access_token, workspace.id, projeto.id, taskId);

    // Act — conclui o passo
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/steps/${passo.id}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "DONE" },
    });

    // Assert — status deve continuar TODO porque foi definido manualmente
    const taskResponse = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(taskResponse.json().data.task.status).toBe("TODO");
    expect(taskResponse.json().data.task.status_is_manual).toBe(true);
  });
});

// ─── PATCH .../tasks/reorder ──────────────────────────────────────────────────

describe("PATCH .../tasks/reorder", () => {
  it("deve reordenar as tarefas do projeto", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const t1 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T1" });
    const t2 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T2" });
    const t3 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T3" });

    const id1 = t1.json().data.task.id;
    const id2 = t2.json().data.task.id;
    const id3 = t3.json().data.task.id;

    // Act — inverte a ordem
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/reorder`,
      headers: { authorization: `Bearer ${access_token}` },
      body: {
        order: [id3, id2, id1], // nova ordem desejada
      },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    // Verifica no banco se a ordem foi atualizada
    const tarefa1 = await prisma.task.findUnique({ where: { id: id1 } });
    const tarefa3 = await prisma.task.findUnique({ where: { id: id3 } });

    expect(tarefa3?.order).toBe(1); // id3 agora é o primeiro
    expect(tarefa1?.order).toBe(3); // id1 agora é o último
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
    const projeto = await criarProjeto(tokenDono, workspace.id);

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/reorder`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { order: [] },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ─── Watchers ─────────────────────────────────────────────────────────────────

describe("watchers — seguir e parar de seguir uma tarefa", () => {
  it("deve permitir a qualquer membro seguir uma tarefa", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefaResponse = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/watch`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(201);

    const watcher = await prisma.taskWatcher.findUnique({
      where: {
        task_id_user_id: {
          task_id: taskId,
          user_id: membro.id,
        },
      },
    });
    expect(watcher).not.toBeNull();
  });

  it("deve retornar 409 se o membro já está seguindo a tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Segue a tarefa pela primeira vez
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/watch`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act — tenta seguir de novo
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/watch`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(409);
  });

  it("deve permitir parar de seguir uma tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Segue a tarefa
    await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/watch`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act — para de seguir
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}/watch`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(204);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/workspaces/id/projects/id/tasks/id/watch",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── DELETE .../tasks/:taskId ─────────────────────────────────────────────────

describe("DELETE .../tasks/:taskId", () => {
  it("deve permitir ao super admin deletar a tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.statusCode).toBe(204);
  });

  it("deve fazer soft delete — tarefa fica no banco com deleted_at preenchido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefaResponse = await criarTarefa(access_token, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    expect(task).not.toBeNull();
    expect(task?.deleted_at).not.toBeNull();
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
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefaResponse = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const taskId = tarefaResponse.json().data.task.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${taskId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/workspaces/id/projects/id/tasks/id",
    });

    expect(response.statusCode).toBe(401);
  });
});
