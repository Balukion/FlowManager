import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// Activity logs são registros imutáveis de ações no sistema.
// São criados automaticamente pelo backend — o usuário nunca os cria diretamente.
// Não têm soft delete: uma vez criados, são permanentes.
//
// Nos testes criamos logs diretamente no banco para verificar as queries.
//
// Rotas:
//   GET /workspaces/:id/activity-logs
//       → histórico geral do workspace (paginado, do mais recente ao mais antigo)
//
//   GET /workspaces/:id/projects/:projectId/tasks/:taskId/activity-logs
//       → histórico específico de uma tarefa

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

// Cria um activity log diretamente no banco
async function criarLog(
  workspaceId: string,
  userId: string,
  overrides: {
    action?: string;
    task_id?: string | null;
    metadata?: object;
  } = {},
) {
  return prisma.activityLog.create({
    data: {
      workspace_id: workspaceId,
      user_id: userId,
      action: (overrides.action ?? "TASK_CREATED") as any,
      task_id: overrides.task_id ?? null,
      metadata: overrides.metadata ?? {},
    },
  });
}

// ─── GET /workspaces/:id/activity-logs ───────────────────────────────────────

describe("GET /workspaces/:id/activity-logs", () => {
  it("deve retornar 200 com a lista de logs do workspace", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarLog(workspace.id, user.id, { action: "TASK_CREATED" });
    await criarLog(workspace.id, user.id, { action: "MEMBER_ADDED" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.logs).toHaveLength(2);
  });

  it("deve retornar lista vazia quando não há logs", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.logs).toHaveLength(0);
  });

  it("deve ordenar os logs do mais recente para o mais antigo", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarLog(workspace.id, user.id, { action: "TASK_CREATED" });
    await new Promise((r) => setTimeout(r, 10));
    await criarLog(workspace.id, user.id, { action: "TASK_STATUS_CHANGED" });
    await new Promise((r) => setTimeout(r, 10));
    await criarLog(workspace.id, user.id, { action: "COMMENT_CREATED" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — mais recente primeiro
    const actions = response.json().data.logs.map((l: any) => l.action);
    expect(actions[0]).toBe("COMMENT_CREATED");
    expect(actions[2]).toBe("TASK_CREATED");
  });

  it("deve incluir os dados do usuário que executou a ação", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    await criarLog(workspace.id, user.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const log = response.json().data.logs[0];
    expect(log.user).toBeDefined();
    expect(log.user.id).toBe(user.id);
    expect(log.user.name).toBe(user.name);
    expect(log.user.password_hash).toBeUndefined();
  });

  it("deve incluir o metadata do log", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarLog(workspace.id, user.id, {
      action: "TASK_STATUS_CHANGED",
      metadata: { from: "TODO", to: "DONE", is_manual: true },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const log = response.json().data.logs[0];
    expect(log.metadata).toEqual({ from: "TODO", to: "DONE", is_manual: true });
  });

  it("deve retornar apenas logs do workspace solicitado", async () => {
    // Arrange — dois workspaces com logs
    const { access_token: tokenA, user: userA } = await registrarUsuario({ email: "a@test.com" });
    const { access_token: tokenB, user: userB } = await registrarUsuario({ email: "b@test.com" });

    const wsA = await criarWorkspace(tokenA);
    const wsB = await criarWorkspace(tokenB);

    await criarLog(wsA.id, userA.id, { action: "TASK_CREATED" });
    await criarLog(wsB.id, userB.id, { action: "MEMBER_ADDED" });
    await criarLog(wsB.id, userB.id, { action: "PROJECT_CREATED" });

    // Act — consulta logs do WS-A
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${wsA.id}/activity-logs`,
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert — só o log do WS-A
    expect(response.json().data.logs).toHaveLength(1);
    expect(response.json().data.logs[0].action).toBe("TASK_CREATED");
  });

  it("deve suportar paginação cursor-based", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    for (let i = 0; i < 10; i++) {
      await criarLog(workspace.id, user.id);
    }

    // Act — busca com limit=3
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs?limit=3`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.json().data.logs).toHaveLength(3);
    expect(response.json().meta.next_cursor).toBeDefined();
  });

  it("deve permitir que qualquer membro veja os logs do workspace", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    await criarLog(workspace.id, dono.id);

    // Act — membro comum consulta
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
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
      url: `/workspaces/${workspace.id}/activity-logs`,
      headers: { authorization: `Bearer ${tokenForasteiro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não autenticado", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs`,
    });

    // Assert
    expect(response.statusCode).toBe(401);
  });
});

// ─── GET /workspaces/:id/activity-logs — filtros ─────────────────────────────

describe("GET /workspaces/:id/activity-logs — filtros", () => {
  it("deve filtrar logs por user_id", async () => {
    // Arrange — dois usuários, cada um gera um log
    const { access_token: tokenDono, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");

    await criarLog(workspace.id, dono.id, { action: "TASK_CREATED" });
    await criarLog(workspace.id, membro.id, { action: "TASK_CREATED" });

    // Act — filtra só pelo membro
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs?user_id=${membro.id}`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const logs = response.json().data.logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].user.id).toBe(membro.id);
  });

  it("deve filtrar logs por action", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    await criarLog(workspace.id, user.id, { action: "TASK_CREATED" });
    await criarLog(workspace.id, user.id, { action: "STEP_ASSIGNED" });
    await criarLog(workspace.id, user.id, { action: "TASK_CREATED" });

    // Act — filtra só STEP_ASSIGNED
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs?action=STEP_ASSIGNED`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const logs = response.json().data.logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("STEP_ASSIGNED");
  });

  it("deve filtrar logs por período (from e to)", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Log antigo — fora do período
    await prisma.activityLog.create({
      data: {
        workspace_id: workspace.id,
        user_id: user.id,
        action: "TASK_CREATED" as any,
        metadata: {},
        created_at: new Date("2026-01-01"),
      },
    });

    // Log recente — dentro do período
    await prisma.activityLog.create({
      data: {
        workspace_id: workspace.id,
        user_id: user.id,
        action: "STEP_ASSIGNED" as any,
        metadata: {},
        created_at: new Date("2026-03-15"),
      },
    });

    // Act — filtra de 2026-03-01 a 2026-03-31
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/activity-logs?from=2026-03-01&to=2026-03-31`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const logs = response.json().data.logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("STEP_ASSIGNED");
  });
});

// ─── GET .../projects/:projectId/activity-logs ───────────────────────────────

describe("GET /workspaces/:id/projects/:projectId/activity-logs", () => {
  it("deve retornar logs das tarefas do projeto", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    await criarLog(workspace.id, user.id, {
      action: "TASK_STATUS_CHANGED",
      task_id: tarefa.id,
    });
    await criarLog(workspace.id, user.id, {
      action: "COMMENT_CREATED",
      task_id: tarefa.id,
    });
    // Log de workspace sem task_id — não deve aparecer
    await criarLog(workspace.id, user.id, { action: "MEMBER_ADDED" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.logs).toHaveLength(2);
  });

  it("não deve retornar logs de tarefas de outro projeto", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projetoA = await criarProjeto(access_token, workspace.id);
    const projetoB = await criarProjeto(access_token, workspace.id);
    const tarefaA = await criarTarefa(access_token, workspace.id, projetoA.id);
    const tarefaB = await criarTarefa(access_token, workspace.id, projetoB.id);

    await criarLog(workspace.id, user.id, { action: "TASK_CREATED", task_id: tarefaA.id });
    await criarLog(workspace.id, user.id, { action: "TASK_CREATED", task_id: tarefaB.id });

    // Act — busca logs do projetoA
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projetoA.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — só o log da tarefaA
    expect(response.json().data.logs).toHaveLength(1);
  });

  it("deve suportar paginação cursor-based", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    for (let i = 0; i < 8; i++) {
      await criarLog(workspace.id, user.id, { action: "TASK_CREATED", task_id: tarefa.id });
    }

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/activity-logs?limit=3`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.json().data.logs).toHaveLength(3);
    expect(response.json().meta.next_cursor).toBeDefined();
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenForasteiro } = await registrarUsuario({
      email: "forasteiro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    const projeto = await criarProjeto(tokenDono, workspace.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/activity-logs`,
      headers: { authorization: `Bearer ${tokenForasteiro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não autenticado", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/activity-logs`,
    });

    // Assert
    expect(response.statusCode).toBe(401);
  });
});

// ─── GET .../tasks/:taskId/activity-logs ─────────────────────────────────────

describe("GET .../tasks/:taskId/activity-logs", () => {
  it("deve retornar logs específicos de uma tarefa", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Logs vinculados à tarefa
    await criarLog(workspace.id, user.id, {
      action: "TASK_STATUS_CHANGED",
      task_id: tarefa.id,
      metadata: { from: "TODO", to: "IN_PROGRESS" },
    });
    await criarLog(workspace.id, user.id, {
      action: "TASK_PRIORITY_CHANGED",
      task_id: tarefa.id,
      metadata: { from: "LOW", to: "HIGH" },
    });

    // Log geral do workspace (sem task_id)
    await criarLog(workspace.id, user.id, { action: "MEMBER_ADDED" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — só os 2 logs da tarefa
    expect(response.statusCode).toBe(200);
    expect(response.json().data.logs).toHaveLength(2);
  });

  it("não deve retornar logs de outra tarefa do mesmo workspace", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const tarefa1 = await criarTarefa(access_token, workspace.id, projeto.id);
    const tarefa2 = await criarTarefa(access_token, workspace.id, projeto.id);

    await criarLog(workspace.id, user.id, {
      action: "TASK_CREATED",
      task_id: tarefa1.id,
    });
    await criarLog(workspace.id, user.id, {
      action: "TASK_CREATED",
      task_id: tarefa2.id,
    });

    // Act — busca logs da tarefa1
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa1.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — só o log da tarefa1
    expect(response.json().data.logs).toHaveLength(1);
  });

  it("deve ordenar do mais recente para o mais antigo", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    await criarLog(workspace.id, user.id, {
      action: "TASK_CREATED",
      task_id: tarefa.id,
    });
    await new Promise((r) => setTimeout(r, 10));
    await criarLog(workspace.id, user.id, {
      action: "TASK_STATUS_CHANGED",
      task_id: tarefa.id,
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/activity-logs`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const actions = response.json().data.logs.map((l: any) => l.action);
    expect(actions[0]).toBe("TASK_STATUS_CHANGED");
    expect(actions[1]).toBe("TASK_CREATED");
  });

  it("deve suportar paginação cursor-based", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    for (let i = 0; i < 8; i++) {
      await criarLog(workspace.id, user.id, {
        action: "TASK_STATUS_CHANGED",
        task_id: tarefa.id,
      });
    }

    // Act — busca com limit=3
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/activity-logs?limit=3`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.json().data.logs).toHaveLength(3);
    expect(response.json().meta.next_cursor).toBeDefined();
  });

  it("deve retornar 403 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenForasteiro } = await registrarUsuario({
      email: "forasteiro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/activity-logs`,
      headers: { authorization: `Bearer ${tokenForasteiro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });
});
