import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// O dashboard agrega métricas do workspace para o usuário logado:
//   - Contagem de tarefas por status (TODO / IN_PROGRESS / DONE)
//   - Contagem de tarefas atrasadas (deadline < hoje e status != DONE)
//   - Total de membros do workspace
//   - Tarefas recentes (últimas N criadas)
//
// Rota:
//   GET /workspaces/:id/dashboard

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

async function criarTarefa(
  token: string,
  workspaceId: string,
  projectId: string,
  overrides: { title?: string; deadline?: string | null } = {},
) {
  const response = await app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    headers: { authorization: `Bearer ${token}` },
    body: {
      title: overrides.title ?? "Tarefa",
      priority: "LOW",
      deadline: overrides.deadline ?? null,
    },
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

function dataPassada(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString();
}

function dataFutura(diasNoFuturo: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diasNoFuturo);
  return d.toISOString();
}

// ─── GET /workspaces/:id/dashboard ───────────────────────────────────────────

describe("GET /workspaces/:id/dashboard", () => {
  it("deve retornar 200 com a estrutura de dados esperada", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const { data } = response.json();
    // Verifica que todas as seções estão presentes
    expect(data.tasks).toBeDefined();
    expect(data.tasks.total).toBeDefined();
    expect(data.tasks.todo).toBeDefined();
    expect(data.tasks.in_progress).toBeDefined();
    expect(data.tasks.done).toBeDefined();
    expect(data.tasks.overdue).toBeDefined();
    expect(data.members_count).toBeDefined();
    expect(data.recent_tasks).toBeDefined();
  });

  it("deve retornar zeros quando o workspace não tem tarefas", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const { tasks } = response.json().data;
    expect(tasks.total).toBe(0);
    expect(tasks.todo).toBe(0);
    expect(tasks.in_progress).toBe(0);
    expect(tasks.done).toBe(0);
    expect(tasks.overdue).toBe(0);
  });

  it("deve contar corretamente as tarefas por status", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Cria 3 tarefas TODO, 2 IN_PROGRESS e 1 DONE diretamente no banco
    // (a API cria tarefas como TODO; para IN_PROGRESS e DONE, alteramos via banco)
    const t1 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T1" });
    const t2 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T2" });
    const t3 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T3" });
    const t4 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T4" });
    const t5 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T5" });
    const t6 = await criarTarefa(access_token, workspace.id, projeto.id, { title: "T6" });

    // Altera status diretamente no banco
    await prisma.task.updateMany({
      where: { id: { in: [t4.id, t5.id] } },
      data: { status: "IN_PROGRESS", status_is_manual: true },
    });
    await prisma.task.update({
      where: { id: t6.id },
      data: { status: "DONE", status_is_manual: true },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const { tasks } = response.json().data;
    expect(tasks.total).toBe(6);
    expect(tasks.todo).toBe(3);
    expect(tasks.in_progress).toBe(2);
    expect(tasks.done).toBe(1);
  });

  it("deve contar tarefas atrasadas — deadline no passado e status != DONE", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Tarefas atrasadas: deadline passado + status TODO ou IN_PROGRESS
    const atrasada1 = await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Atrasada 1",
    });
    const atrasada2 = await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Atrasada 2",
    });

    await prisma.task.updateMany({
      where: { id: { in: [atrasada1.id, atrasada2.id] } },
      data: { deadline: new Date(Date.now() - 1000 * 60 * 60 * 24) }, // ontem
    });

    // Tarefa com deadline passado mas DONE — não deve contar como atrasada
    const concluida = await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "Concluída atrasada",
    });
    await prisma.task.update({
      where: { id: concluida.id },
      data: {
        deadline: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: "DONE",
        status_is_manual: true,
      },
    });

    // Tarefa no prazo — não deve contar
    await criarTarefa(access_token, workspace.id, projeto.id, {
      title: "No prazo",
      deadline: dataFutura(7),
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — só as 2 atrasadas não concluídas
    expect(response.json().data.tasks.overdue).toBe(2);
  });

  it("deve contar o número correto de membros", async () => {
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const { user: membro1 } = await registrarUsuario({ email: "m1@test.com" });
    const { user: membro2 } = await registrarUsuario({ email: "m2@test.com" });

    const workspace = await criarWorkspace(access_token);
    await adicionarMembro(workspace.id, membro1.id);
    await adicionarMembro(workspace.id, membro2.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — dono + 2 membros = 3
    expect(response.json().data.members_count).toBe(3);
  });

  it("deve retornar as 5 tarefas mais recentes em recent_tasks", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Cria 7 tarefas
    for (let i = 1; i <= 7; i++) {
      await criarTarefa(access_token, workspace.id, projeto.id, { title: `Tarefa ${i}` });
    }

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — máximo 5 tarefas recentes
    expect(response.json().data.recent_tasks).toHaveLength(5);
  });

  it("recent_tasks deve estar ordenado da mais recente para a mais antiga", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Primeira" });
    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Segunda" });
    await criarTarefa(access_token, workspace.id, projeto.id, { title: "Terceira" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const titles = response.json().data.recent_tasks.map((t: any) => t.title);
    expect(titles[0]).toBe("Terceira");
    expect(titles[2]).toBe("Primeira");
  });

  it("não deve incluir tarefas deletadas nas métricas", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Soft delete direto no banco
    await prisma.task.update({
      where: { id: tarefa.id },
      data: { deleted_at: new Date() },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/dashboard`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — tarefa deletada não conta
    expect(response.json().data.tasks.total).toBe(0);
    expect(response.json().data.recent_tasks).toHaveLength(0);
  });

  it("as métricas são isoladas por workspace", async () => {
    // Arrange — dois workspaces com tarefas diferentes
    const { access_token: tokenA } = await registrarUsuario({ email: "a@test.com" });
    const { access_token: tokenB } = await registrarUsuario({ email: "b@test.com" });

    const wsA = await criarWorkspace(tokenA);
    const wsB = await criarWorkspace(tokenB);

    const projetoA = await criarProjeto(tokenA, wsA.id);
    const projetoB = await criarProjeto(tokenB, wsB.id);

    // 1 tarefa no WS-A, 3 tarefas no WS-B
    await criarTarefa(tokenA, wsA.id, projetoA.id);
    await criarTarefa(tokenB, wsB.id, projetoB.id);
    await criarTarefa(tokenB, wsB.id, projetoB.id);
    await criarTarefa(tokenB, wsB.id, projetoB.id);

    // Act — consulta dashboard do WS-A
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${wsA.id}/dashboard`,
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert — só aparece a tarefa do WS-A
    expect(response.json().data.tasks.total).toBe(1);
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
      url: `/workspaces/${workspace.id}/dashboard`,
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
      url: `/workspaces/${workspace.id}/dashboard`,
    });

    // Assert
    expect(response.statusCode).toBe(401);
  });
});
