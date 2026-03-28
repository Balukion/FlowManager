import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// Comentários vivem dentro de tarefas. Qualquer membro do workspace
// pode criar e ver comentários. A edição é restrita ao autor.
// A deleção é permitida ao autor ou a um admin/super admin.
//
// Recursos especiais:
//   - Threading: um comentário pode ter parent_id (resposta a outro)
//   - Menções: @userId no conteúdo cria registros em comment_mentions
//   - Soft delete: comentários deletados somem da listagem

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

async function criarComentario(
  token: string,
  workspaceId: string,
  projectId: string,
  taskId: string,
  overrides: { content?: string; parent_id?: string } = {},
) {
  return app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
    headers: { authorization: `Bearer ${token}` },
    body: {
      content: overrides.content ?? "Meu comentário de teste.",
      parent_id: overrides.parent_id ?? null,
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

// ─── POST .../tasks/:taskId/comments ──────────────────────────────────────────

describe("POST .../comments", () => {
  it("deve criar comentário e retornar 201", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await criarComentario(
      access_token,
      workspace.id,
      projeto.id,
      tarefa.id,
      { content: "Primeiro comentário!" },
    );

    // Assert
    expect(response.statusCode).toBe(201);

    const comment = response.json().data.comment;
    expect(comment.content).toBe("Primeiro comentário!");
    expect(comment.task_id).toBe(tarefa.id);
    expect(comment.parent_id).toBeNull();
  });

  it("deve associar o comentário ao autor correto", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id);

    // Assert
    const comment = response.json().data.comment;
    expect(comment.author_id).toBe(user.id);
  });

  it("deve permitir que um membro comum crie comentário", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    // Act — membro comum cria comentário
    const response = await criarComentario(tokenMembro, workspace.id, projeto.id, tarefa.id);

    // Assert
    expect(response.statusCode).toBe(201);
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
    const response = await criarComentario(
      tokenForasteiro,
      workspace.id,
      projeto.id,
      tarefa.id,
    );

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 400 se o conteúdo está vazio", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content: "" },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 401 se não autenticado", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments`,
      body: { content: "Comentário sem auth" },
    });

    // Assert
    expect(response.statusCode).toBe(401);
  });
});

// ─── POST .../comments — threading ────────────────────────────────────────────

describe("POST .../comments — threading", () => {
  it("deve criar resposta a um comentário usando parent_id", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Cria o comentário pai
    const pai = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Comentário principal",
    });
    const paiId = pai.json().data.comment.id;

    // Act — cria resposta
    const response = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Respondendo ao comentário",
      parent_id: paiId,
    });

    // Assert
    expect(response.statusCode).toBe(201);
    const comment = response.json().data.comment;
    expect(comment.parent_id).toBe(paiId);
  });

  it("deve retornar 400 se o parent_id não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Resposta a nada",
      parent_id: "00000000-0000-0000-0000-000000000000",
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se o parent_id pertence a outra tarefa", async () => {
    // Arrange — dois comentários em tarefas diferentes
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const tarefa1 = await criarTarefa(access_token, workspace.id, projeto.id);
    const tarefa2 = await criarTarefa(access_token, workspace.id, projeto.id);

    const comentarioTarefa1 = await criarComentario(
      access_token,
      workspace.id,
      projeto.id,
      tarefa1.id,
      { content: "Comentário na tarefa 1" },
    );
    const paiId = comentarioTarefa1.json().data.comment.id;

    // Act — tenta usar parent_id de tarefa1 em tarefa2
    const response = await criarComentario(
      access_token,
      workspace.id,
      projeto.id,
      tarefa2.id,
      {
        content: "Resposta cruzando tarefas",
        parent_id: paiId,
      },
    );

    // Assert
    expect(response.statusCode).toBe(400);
  });
});

// ─── POST .../comments — menções ──────────────────────────────────────────────

describe("POST .../comments — menções", () => {
  it("deve criar registro em comment_mentions quando o conteúdo menciona um membro", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    // Act — cria comentário mencionando o membro
    const response = await criarComentario(
      tokenDono,
      workspace.id,
      projeto.id,
      tarefa.id,
      { content: `Olá @${membro.id}, por favor revise isso.` },
    );

    // Assert — verifica na tabela comment_mentions
    expect(response.statusCode).toBe(201);
    const commentId = response.json().data.comment.id;

    const mention = await prisma.commentMention.findFirst({
      where: { comment_id: commentId, user_id: membro.id },
    });
    expect(mention).not.toBeNull();
  });

  it("não deve criar mention para usuário que não é membro do workspace", async () => {
    // Arrange — forasteiro não é membro
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { user: forasteiro } = await registrarUsuario({ email: "forasteiro@test.com" });
    const workspace = await criarWorkspace(tokenDono);
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    // Act — menciona forasteiro
    const response = await criarComentario(
      tokenDono,
      workspace.id,
      projeto.id,
      tarefa.id,
      { content: `@${forasteiro.id} você não pertence a este workspace` },
    );

    // Assert — comentário cria, mas sem mention
    expect(response.statusCode).toBe(201);
    const commentId = response.json().data.comment.id;

    const mention = await prisma.commentMention.findFirst({
      where: { comment_id: commentId, user_id: forasteiro.id },
    });
    expect(mention).toBeNull();
  });
});

// ─── GET .../tasks/:taskId/comments ───────────────────────────────────────────

describe("GET .../comments", () => {
  it("deve retornar lista de comentários da tarefa", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Comentário 1",
    });
    await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Comentário 2",
    });
    await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Comentário 3",
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    const comments = response.json().data.comments;
    expect(comments).toHaveLength(3);
  });

  it("deve retornar comentários apenas da tarefa solicitada", async () => {
    // Arrange — duas tarefas com comentários
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);

    const tarefa1 = await criarTarefa(access_token, workspace.id, projeto.id);
    const tarefa2 = await criarTarefa(access_token, workspace.id, projeto.id);

    await criarComentario(access_token, workspace.id, projeto.id, tarefa1.id, {
      content: "Comentário da tarefa 1",
    });
    await criarComentario(access_token, workspace.id, projeto.id, tarefa2.id, {
      content: "Comentário da tarefa 2",
    });

    // Act — busca apenas comentários da tarefa1
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa1.id}/comments`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const comments = response.json().data.comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("Comentário da tarefa 1");
  });

  it("não deve incluir comentários deletados", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const c1 = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Vai ficar",
    });
    const c2 = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Vai ser deletado",
    });
    const c2Id = c2.json().data.comment.id;

    // Deleta o segundo comentário
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${c2Id}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const comments = response.json().data.comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("Vai ficar");
  });

  it("deve retornar os dados do autor em cada comentário", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);
    await criarComentario(access_token, workspace.id, projeto.id, tarefa.id);

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const comment = response.json().data.comments[0];
    expect(comment.author).toBeDefined();
    expect(comment.author.id).toBe(user.id);
    expect(comment.author.name).toBe(user.name);
    // Nunca deve vazar o hash da senha
    expect(comment.author.password_hash).toBeUndefined();
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
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments`,
      headers: { authorization: `Bearer ${tokenForasteiro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve suportar paginação cursor-based", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Cria 5 comentários
    for (let i = 1; i <= 5; i++) {
      await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
        content: `Comentário ${i}`,
      });
    }

    // Act — busca com limit=2
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments?limit=2`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.comments).toHaveLength(2);
    // Deve ter cursor para próxima página
    expect(body.meta.next_cursor).toBeDefined();
  });
});

// ─── PATCH .../comments/:commentId ────────────────────────────────────────────

describe("PATCH .../comments/:commentId", () => {
  it("deve permitir ao autor editar o próprio comentário", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const criado = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id, {
      content: "Conteúdo original",
    });
    const commentId = criado.json().data.comment.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content: "Conteúdo editado" },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const comment = response.json().data.comment;
    expect(comment.content).toBe("Conteúdo editado");
  });

  it("deve registrar edited_at após a edição", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const criado = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Verifica que edited_at é nulo antes da edição
    const antes = await prisma.comment.findUnique({ where: { id: commentId } });
    expect(antes?.edited_at).toBeNull();

    // Act
    await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content: "Editado" },
    });

    // Assert — edited_at deve ser preenchido
    const depois = await prisma.comment.findUnique({ where: { id: commentId } });
    expect(depois?.edited_at).not.toBeNull();
  });

  it("deve retornar 403 se o usuário não é o autor", async () => {
    // Arrange
    const { access_token: tokenAutor } = await registrarUsuario({ email: "autor@test.com" });
    const { access_token: tokenOutro, user: outro } = await registrarUsuario({
      email: "outro@test.com",
    });
    const workspace = await criarWorkspace(tokenAutor);
    await adicionarMembro(workspace.id, outro.id, "MEMBER");
    const projeto = await criarProjeto(tokenAutor, workspace.id);
    const tarefa = await criarTarefa(tokenAutor, workspace.id, projeto.id);

    const criado = await criarComentario(tokenAutor, workspace.id, projeto.id, tarefa.id, {
      content: "Comentário do autor",
    });
    const commentId = criado.json().data.comment.id;

    // Act — outro membro tenta editar
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${tokenOutro}` },
      body: { content: "Tentativa de edição" },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 403 mesmo para admin — só o autor pode editar", async () => {
    // Arrange
    const { access_token: tokenAutor } = await registrarUsuario({ email: "autor@test.com" });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const workspace = await criarWorkspace(tokenAutor);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");
    const projeto = await criarProjeto(tokenAutor, workspace.id);
    const tarefa = await criarTarefa(tokenAutor, workspace.id, projeto.id);

    const criado = await criarComentario(tokenAutor, workspace.id, projeto.id, tarefa.id, {
      content: "Comentário do autor",
    });
    const commentId = criado.json().data.comment.id;

    // Act — admin tenta editar
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
      body: { content: "Edição pelo admin" },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 400 se o conteúdo editado está vazio", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const criado = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content: "" },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 404 se o comentário não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${access_token}` },
      body: { content: "Editando nada" },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });
});

// ─── DELETE .../comments/:commentId ───────────────────────────────────────────

describe("DELETE .../comments/:commentId", () => {
  it("deve permitir ao autor deletar o próprio comentário", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const criado = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve fazer soft delete — deleted_at preenchido, não remove do banco", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const criado = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — registro ainda existe no banco, mas com deleted_at preenchido
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    expect(comment).not.toBeNull();
    expect(comment?.deleted_at).not.toBeNull();
  });

  it("deve permitir que um admin delete comentário de outro usuário", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const { access_token: tokenAutor, user: autor } = await registrarUsuario({
      email: "autor@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");
    await adicionarMembro(workspace.id, autor.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    const criado = await criarComentario(tokenAutor, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Act — admin deleta comentário do autor
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${tokenAdmin}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve permitir que o super admin delete qualquer comentário", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    const criado = await criarComentario(tokenMembro, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Act — super admin (dono) deleta
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve retornar 403 se o usuário é membro comum tentando deletar comentário de outro", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenAutor, user: autor } = await registrarUsuario({
      email: "autor@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, autor.id, "MEMBER");
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    const projeto = await criarProjeto(tokenDono, workspace.id);
    const tarefa = await criarTarefa(tokenDono, workspace.id, projeto.id);

    const criado = await criarComentario(tokenAutor, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Act — membro comum tenta deletar comentário de outro membro
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 404 se o comentário não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 404 se tentar deletar o mesmo comentário duas vezes", async () => {
    // Soft delete: na segunda tentativa o comentário já tem deleted_at,
    // então deve ser tratado como inexistente.
    // Arrange
    const { access_token } = await registrarUsuario();
    const workspace = await criarWorkspace(access_token);
    const projeto = await criarProjeto(access_token, workspace.id);
    const tarefa = await criarTarefa(access_token, workspace.id, projeto.id);

    const criado = await criarComentario(access_token, workspace.id, projeto.id, tarefa.id);
    const commentId = criado.json().data.comment.id;

    // Act — deleta pela primeira vez
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — segunda deleção retorna 404
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/projects/${projeto.id}/tasks/${tarefa.id}/comments/${commentId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });
    expect(response.statusCode).toBe(404);
  });
});
