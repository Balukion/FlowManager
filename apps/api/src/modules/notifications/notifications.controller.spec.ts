import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// Notificações são criadas pelo sistema — não pelo usuário diretamente.
// Exemplos: passo atribuído, prazo se aproximando, status de tarefa alterado.
//
// Nos testes criamos as notificações diretamente no banco para simular
// o que o sistema faria (assim como fizemos com tokens de email).
//
// O usuário só pode:
//   - Ver suas próprias notificações
//   - Marcar como lida (uma ou todas)
//   - Deletar
//
// Rotas:
//   GET    /notifications                → lista notificações do usuário logado
//   PATCH  /notifications/:id/read      → marca uma notificação como lida
//   PATCH  /notifications/read-all      → marca todas como lidas
//   DELETE /notifications/:id           → remove notificação

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

// Cria notificação diretamente no banco para o usuário informado
async function criarNotificacao(
  userId: string,
  overrides: {
    type?: string;
    title?: string;
    body?: string;
    read_at?: Date | null;
  } = {},
) {
  return prisma.notification.create({
    data: {
      user_id: userId,
      type: (overrides.type ?? "STEP_ASSIGNED") as any,
      title: overrides.title ?? "Passo atribuído",
      body: overrides.body ?? "Você foi atribuído ao passo 'Revisar PR'.",
      read_at: overrides.read_at ?? null,
    },
  });
}

// ─── GET /notifications ───────────────────────────────────────────────────────

describe("GET /notifications", () => {
  it("deve retornar as notificações do usuário logado", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();

    await criarNotificacao(user.id, { title: "Notificação 1" });
    await criarNotificacao(user.id, { title: "Notificação 2" });
    await criarNotificacao(user.id, { title: "Notificação 3" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.notifications).toHaveLength(3);
  });

  it("não deve retornar notificações de outros usuários", async () => {
    // Arrange — dois usuários com notificações
    const { access_token: tokenA, user: userA } = await registrarUsuario({
      email: "a@test.com",
    });
    const { user: userB } = await registrarUsuario({ email: "b@test.com" });

    await criarNotificacao(userA.id, { title: "Notificação do A" });
    await criarNotificacao(userB.id, { title: "Notificação do B" });

    // Act — A consulta suas notificações
    const response = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert — só aparece a notificação do A
    const notifications = response.json().data.notifications;
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe("Notificação do A");
  });

  it("deve retornar lista vazia se o usuário não tem notificações", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json().data.notifications).toHaveLength(0);
  });

  it("deve incluir a contagem de não lidas no meta", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();

    await criarNotificacao(user.id, { read_at: null });           // não lida
    await criarNotificacao(user.id, { read_at: null });           // não lida
    await criarNotificacao(user.id, { read_at: new Date() });     // já lida

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.json().meta.unread_count).toBe(2);
  });

  it("deve ordenar as notificações da mais recente para a mais antiga", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();

    // Cria com intervalo para garantir created_at diferente
    await criarNotificacao(user.id, { title: "Primeira" });
    await new Promise((r) => setTimeout(r, 10));
    await criarNotificacao(user.id, { title: "Segunda" });
    await new Promise((r) => setTimeout(r, 10));
    await criarNotificacao(user.id, { title: "Terceira" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — mais recente primeiro
    const titles = response.json().data.notifications.map((n: any) => n.title);
    expect(titles[0]).toBe("Terceira");
    expect(titles[2]).toBe("Primeira");
  });

  it("deve suportar paginação cursor-based", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();

    for (let i = 1; i <= 5; i++) {
      await criarNotificacao(user.id, { title: `Notificação ${i}` });
    }

    // Act — busca com limit=2
    const response = await app.inject({
      method: "GET",
      url: "/notifications?limit=2",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.json().data.notifications).toHaveLength(2);
    expect(response.json().meta.next_cursor).toBeDefined();
  });

  it("deve retornar 401 se não autenticado", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/notifications",
    });

    expect(response.statusCode).toBe(401);
  });
});

// ─── PATCH /notifications/:id/read ───────────────────────────────────────────

describe("PATCH /notifications/:id/read", () => {
  it("deve marcar a notificação como lida e retornar 200", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const notificacao = await criarNotificacao(user.id, { read_at: null });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: `/notifications/${notificacao.id}/read`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });

  it("deve preencher read_at no banco após marcar como lida", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const notificacao = await criarNotificacao(user.id, { read_at: null });

    // Act
    await app.inject({
      method: "PATCH",
      url: `/notifications/${notificacao.id}/read`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const atualizada = await prisma.notification.findUnique({
      where: { id: notificacao.id },
    });
    expect(atualizada?.read_at).not.toBeNull();
  });

  it("deve ser idempotente — marcar como lida duas vezes não gera erro", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const notificacao = await criarNotificacao(user.id, { read_at: null });

    // Act — marca como lida duas vezes
    await app.inject({
      method: "PATCH",
      url: `/notifications/${notificacao.id}/read`,
      headers: { authorization: `Bearer ${access_token}` },
    });
    const response = await app.inject({
      method: "PATCH",
      url: `/notifications/${notificacao.id}/read`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });

  it("deve retornar 404 se a notificação não pertence ao usuário logado", async () => {
    // Importante: não pode marcar como lida notificação de outro usuário
    // Arrange
    const { access_token: tokenA } = await registrarUsuario({ email: "a@test.com" });
    const { user: userB } = await registrarUsuario({ email: "b@test.com" });

    // Notificação pertence ao usuário B
    const notificacao = await criarNotificacao(userB.id);

    // Act — usuário A tenta marcar como lida
    const response = await app.inject({
      method: "PATCH",
      url: `/notifications/${notificacao.id}/read`,
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 404 se a notificação não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/notifications/00000000-0000-0000-0000-000000000000/read",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });
});

// ─── PATCH /notifications/read-all ───────────────────────────────────────────

describe("PATCH /notifications/read-all", () => {
  it("deve marcar todas as notificações do usuário como lidas", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();

    await criarNotificacao(user.id, { read_at: null });
    await criarNotificacao(user.id, { read_at: null });
    await criarNotificacao(user.id, { read_at: null });

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/notifications/read-all",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);

    // Verifica no banco que todas foram marcadas
    const naoLidas = await prisma.notification.count({
      where: { user_id: user.id, read_at: null },
    });
    expect(naoLidas).toBe(0);
  });

  it("deve afetar apenas as notificações do usuário logado", async () => {
    // Arrange
    const { access_token: tokenA, user: userA } = await registrarUsuario({
      email: "a@test.com",
    });
    const { user: userB } = await registrarUsuario({ email: "b@test.com" });

    await criarNotificacao(userA.id, { read_at: null });
    await criarNotificacao(userB.id, { read_at: null }); // não deve ser afetada

    // Act — A marca todas as suas como lidas
    await app.inject({
      method: "PATCH",
      url: "/notifications/read-all",
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert — notificação do B ainda não lida
    const naoLidaDoB = await prisma.notification.count({
      where: { user_id: userB.id, read_at: null },
    });
    expect(naoLidaDoB).toBe(1);
  });

  it("deve retornar 200 mesmo se não há notificações para marcar", async () => {
    // Arrange — usuário sem notificações
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "PATCH",
      url: "/notifications/read-all",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — não deve falhar
    expect(response.statusCode).toBe(200);
  });
});

// ─── DELETE /notifications/:id ────────────────────────────────────────────────

describe("DELETE /notifications/:id", () => {
  it("deve deletar a notificação e retornar 204", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const notificacao = await criarNotificacao(user.id);

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/notifications/${notificacao.id}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve sumir da listagem após deletar", async () => {
    // Arrange
    const { access_token, user } = await registrarUsuario();
    const n1 = await criarNotificacao(user.id, { title: "Fica" });
    const n2 = await criarNotificacao(user.id, { title: "Sai" });

    // Deleta a segunda
    await app.inject({
      method: "DELETE",
      url: `/notifications/${n2.id}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: "/notifications",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const notifications = response.json().data.notifications;
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe("Fica");
  });

  it("deve retornar 404 se a notificação não pertence ao usuário logado", async () => {
    // Arrange
    const { access_token: tokenA } = await registrarUsuario({ email: "a@test.com" });
    const { user: userB } = await registrarUsuario({ email: "b@test.com" });

    const notificacao = await criarNotificacao(userB.id);

    // Act — A tenta deletar notificação do B
    const response = await app.inject({
      method: "DELETE",
      url: `/notifications/${notificacao.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 404 se a notificação não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: "/notifications/00000000-0000-0000-0000-000000000000",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });
});
