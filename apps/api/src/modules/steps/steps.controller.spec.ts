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
  overrides: { title?: string; deadline?: string } = {},
) {
  const response = await app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    headers: { authorization: `Bearer ${token}` },
    body: {
      title: overrides.title ?? "Minha Tarefa",
      priority: "LOW",
      deadline: overrides.deadline ?? null,
    },
  });
  return response.json().data.task;
}

async function criarPasso(
  token: string,
  workspaceId: string,
  projectId: string,
  taskId: string,
  overrides: { title?: string; deadline?: string } = {},
) {
  return app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/steps`,
    headers: { authorization: `Bearer ${token}` },
    body: {
      title: overrides.title ?? "Meu Passo",
      deadline: overrides.deadline ?? null,
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

// Data no futuro para usar como prazo válido
function dataFutura(diasNoFuturo: number): string {
  const data = new Date();
  data.setDate(data.getDate() + diasNoFuturo);
  return data.toISOString();
}

// ─── POST .../tasks/:taskId/steps ─────────────────────────────────────────────

describe("POST .../steps", () => {
  it("deve criar passo com order correto", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, {
      title: "Primeiro Passo",
    });

    // Assert
    expect(response.statusCode).toBe(201);

    const step = response.json().data.step;
    expect(step.title).toBe("Primeiro Passo");
    expect(step.order).toBe(1);
    expect(step.status).toBe("PENDING");
  });

  it("deve incrementar o order para cada novo passo", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "Passo 1" });
    await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "Passo 2" });
    const response = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, {
      title: "Passo 3",
    });

    // Assert
    expect(response.json().data.step.order).toBe(3);
  });

  it("deve permitir a um admin criar passo", async () => {
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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    // Act
    const response = await criarPasso(tokenAdmin, workspace.id, projeto.id, tarefa.id);

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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    // Act
    const response = await criarPasso(tokenMembro, workspace.id, projeto.id, tarefa.id);

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 400 se o prazo do passo é posterior ao prazo da tarefa", async () => {
    // Essa é uma regra crítica de consistência de dados.
    // Um passo não pode ter prazo depois da tarefa que o contém.
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Tarefa com prazo em 5 dias
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id, {
      deadline: dataFutura(5),
    });

    // Act — passo com prazo em 10 dias (posterior à tarefa)
    const response = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, {
      deadline: dataFutura(10),
    });

    // Assert
    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("STEP_DEADLINE_EXCEEDS_TASK");
  });

  it("deve aceitar passo com prazo anterior ao da tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id, {
      deadline: dataFutura(10),
    });

    // Act — passo com prazo em 5 dias (antes da tarefa)
    const response = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, {
      deadline: dataFutura(5),
    });

    expect(response.statusCode).toBe(201);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/workspaces/id/projects/id/tasks/id/steps",
      body: { title: "Passo" },
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── GET .../tasks/:taskId/steps ──────────────────────────────────────────────

describe("GET .../steps", () => {
  it("deve retornar todos os passos ativos da tarefa em ordem", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "Passo A" });
    await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "Passo B" });
    await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "Passo C" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const steps = response.json().data.steps;
    expect(steps).toHaveLength(3);
    expect(steps[0].title).toBe("Passo A");
    expect(steps[0].order).toBe(1);
    expect(steps[2].title).toBe("Passo C");
    expect(steps[2].order).toBe(3);
  });

  it("não deve retornar passos deletados", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const passoResponse = await criarPasso(
      access_token,
      workspace.id,
      projeto.id,
      tarefa.id,
    );
    const stepId = passoResponse.json().data.step.id;

    // Deleta o passo
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    expect(response.json().data.steps).toHaveLength(0);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/workspaces/id/projects/id/tasks/id/steps",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH .../steps/:stepId ──────────────────────────────────────────────────

describe("PATCH .../steps/:stepId", () => {
  it("deve permitir ao admin editar título e descrição do passo", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const passoResponse = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { title: "Título Atualizado", description: "Nova descrição" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.step.title).toBe("Título Atualizado");
  });

  it("deve retornar 400 ao editar prazo do passo para depois do prazo da tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Tarefa com prazo em 5 dias
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id, {
      deadline: dataFutura(5),
    });
    const passoResponse = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act — tenta editar prazo para depois da tarefa
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { deadline: dataFutura(10) },
    });

    // Assert
    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.error.code).toBe("STEP_DEADLINE_EXCEEDS_TASK");
  });

  it("deve retornar um warning ao encurtar prazo da tarefa com passos afetados", async () => {
    // Essa é a regra do CLAUDE.md: ao encurtar prazo da tarefa — alertar, não bloquear.
    // O sistema avisa mas permite a operação.
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    // Tarefa com prazo em 10 dias
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id, {
      deadline: dataFutura(10),
    });

    // Passo com prazo em 7 dias
    await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, {
      deadline: dataFutura(7),
    });

    // Act — encurta prazo da tarefa para 3 dias (antes do prazo do passo)
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { deadline: dataFutura(3) },
    });

    // Assert — operação deve ter sucesso mas com warning
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.warnings).toContain("STEPS_DEADLINE_EXCEEDED");
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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { title: "Tentativa" },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ─── PATCH .../steps/:stepId/status ──────────────────────────────────────────

describe("PATCH .../steps/:stepId/status", () => {
  it("deve permitir ao membro atribuído alterar o status do passo", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Atribui o membro ao passo
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { user_id: membro.id },
    });

    // Act — membro atribuído altera o status
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/status`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { status: "IN_PROGRESS" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.step.status).toBe("IN_PROGRESS");
  });

  it("deve retornar 403 se o membro não está atribuído ao passo", async () => {
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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act — membro tenta alterar status sem estar atribuído
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/status`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { status: "DONE" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 400 se o status é inválido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const passoResponse = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/status`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { status: "INVALIDO" },
    });

    expect(response.statusCode).toBe(400);
  });
});

// ─── PATCH .../steps/:stepId/assign ──────────────────────────────────────────

describe("PATCH .../steps/:stepId/assign — atribuir membro", () => {
  it("deve permitir ao admin atribuir um membro ao passo", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { user_id: membro.id },
    });

    // Assert
    expect(response.statusCode).toBe(201);

    const assignment = await prisma.stepAssignment.findUnique({
      where: {
        step_id_user_id: {
          step_id: stepId,
          user_id: membro.id,
        },
      },
    });
    expect(assignment).not.toBeNull();
    expect(assignment?.unassigned_at).toBeNull();
  });

  it("deve retornar 400 se o usuário não é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: usuarioFora } = await registrarUsuario({
      email: "fora@test.com",
    });

    const workspace = await criarWorkspace(tokenDono);
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act — tenta atribuir usuário que não é membro
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { user_id: usuarioFora.id },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 409 se o membro já está atribuído ao passo", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Atribui uma vez
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { user_id: membro.id },
    });

    // Act — atribui de novo
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { user_id: membro.id },
    });

    expect(response.statusCode).toBe(409);
  });

  it("deve retornar 403 se quem atribui é membro comum", async () => {
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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { user_id: membro.id },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ─── DELETE .../steps/:stepId/assign/:userId ──────────────────────────────────

describe("DELETE .../steps/:stepId/assign/:userId — remover atribuição", () => {
  it("deve preencher unassigned_at e unassigned_by em vez de deletar", async () => {
    // Essa é uma regra importante do CLAUDE.md: não deletar ao remover membro
    // do passo — preencher unassigned_at e unassigned_by para manter histórico.
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });

    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Atribui o membro
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign`,
      headers: { authorization: `Bearer ${tokenDono}` },
      body: { user_id: membro.id },
    });

    // Act — remove a atribuição
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign/${membro.id}`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);

    // O registro ainda deve existir no banco — não foi deletado
    const assignment = await prisma.stepAssignment.findUnique({
      where: {
        step_id_user_id: {
          step_id: stepId,
          user_id: membro.id,
        },
      },
    });
    expect(assignment).not.toBeNull();
    expect(assignment?.unassigned_at).not.toBeNull();
    expect(assignment?.unassigned_by).toBe(dono.id);
  });

  it("deve retornar 403 se quem remove é membro comum", async () => {
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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}/assign/${membro.id}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ─── PATCH .../steps/reorder ──────────────────────────────────────────────────

describe("PATCH .../steps/reorder", () => {
  it("deve reordenar os passos da tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const p1 = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "P1" });
    const p2 = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "P2" });
    const p3 = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "P3" });

    const id1 = p1.json().data.step.id;
    const id2 = p2.json().data.step.id;
    const id3 = p3.json().data.step.id;

    // Act — inverte a ordem
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/reorder`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { order: [id3, id2, id1] },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const passo1 = await prisma.step.findUnique({ where: { id: id1 } });
    const passo3 = await prisma.step.findUnique({ where: { id: id3 } });

    expect(passo3?.order).toBe(1);
    expect(passo1?.order).toBe(3);
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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/reorder`,
      headers: { authorization: `Bearer ${tokenMembro}` },
      body: { order: [] },
    });

    expect(response.statusCode).toBe(403);
  });
});

// ─── DELETE .../steps/:stepId ─────────────────────────────────────────────────

describe("DELETE .../steps/:stepId", () => {
  it("deve fazer soft delete do passo", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    const passoResponse = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);

    const passo = await prisma.step.findUnique({ where: { id: stepId } });
    expect(passo?.deleted_at).not.toBeNull();
  });

  it("deve reajustar o order dos passos restantes após deleção", async () => {
    // Essa é a regra do CLAUDE.md: order reajustado após deleção.
    // Se temos passos [1, 2, 3] e deletamos o 2, deve ficar [1, 2].
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const p1 = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "P1" });
    const p2 = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "P2" });
    const p3 = await criarPasso(access_token, workspace.id, projeto.id, tarefa.id, { title: "P3" });

    const id1 = p1.json().data.step.id;
    const id2 = p2.json().data.step.id;
    const id3 = p3.json().data.step.id;

    // Act — deleta o passo do meio
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${id2}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — P1 continua order 1, P3 passa para order 2
    const passo1 = await prisma.step.findUnique({ where: { id: id1 } });
    const passo3 = await prisma.step.findUnique({ where: { id: id3 } });

    expect(passo1?.order).toBe(1);
    expect(passo3?.order).toBe(2); // era 3, agora é 2
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
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);
    const passoResponse = await criarPasso(tokenDono, workspace.id, projeto.id, tarefa.id);
    const stepId = passoResponse.json().data.step.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/steps/${stepId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se não há token", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/workspaces/id/projects/id/tasks/id/steps/id",
    });

    expect(response.statusCode).toBe(401);
  });
});
