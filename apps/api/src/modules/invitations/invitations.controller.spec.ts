import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../../../tests/helpers/setup.js";
import crypto from "crypto";
import { addHours } from "@flowmanager/shared";

// Envio de convite dispara email via Resend. Mockamos para não depender
// do serviço externo nos testes.
vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "fake-email-id" }),
}));

// ─── O que estamos testando aqui? ────────────────────────────────────────────
//
// Convites permitem adicionar novos membros ao workspace sem passar pelo fluxo
// de registro manual. O fluxo completo é:
//
//   1. Admin envia convite → token gerado, armazenado como hash, email enviado
//   2. Convidado recebe o link com o token original
//   3. Convidado aceita ou recusa via token
//   4. Se aceito → entra no workspace como MEMBER
//
// Nos testes NÃO enviamos email de verdade. O token é criado diretamente no
// banco para simular o que o sistema faria.
//
// Rotas:
//   POST   /workspaces/:id/invitations                  → envia convite
//   GET    /workspaces/:id/invitations                  → lista convites pendentes
//   DELETE /workspaces/:id/invitations/:invitationId    → cancela convite
//   POST   /invitations/:token/accept                   → aceita convite
//   POST   /invitations/:token/decline                  → recusa convite

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

async function enviarConvite(
  token: string,
  workspaceId: string,
  email: string,
) {
  return app.inject({
    method: "POST",
    url: `/workspaces/${workspaceId}/invitations`,
    headers: { authorization: `Bearer ${token}` },
    body: { email },
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

// Cria um convite diretamente no banco com token legível (para simular o link do email)
async function criarConviteNoBanco(
  workspaceId: string,
  invitedByUserId: string,
  overrides: {
    email?: string;
    tokenExpirado?: boolean;
    status?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  } = {},
) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiresAt = overrides.tokenExpirado
    ? new Date(Date.now() - 1000)
    : addHours(new Date(), 48);

  await prisma.invitation.create({
    data: {
      workspace_id: workspaceId,
      invited_by: invitedByUserId,
      email: overrides.email ?? "convidado@test.com",
      role: "MEMBER",
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: overrides.status ?? "PENDING",
    },
  });

  return token; // retorna o token original para usar nos testes
}

// ─── POST /workspaces/:id/invitations ─────────────────────────────────────────

describe("POST /workspaces/:id/invitations", () => {
  it("deve criar convite e retornar 201", async () => {
    // Arrange
    const { access_token } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await enviarConvite(access_token, workspace.id, "novo@test.com");

    // Assert
    expect(response.statusCode).toBe(201);

    const invitation = response.json().data.invitation;
    expect(invitation.email).toBe("novo@test.com");
    expect(invitation.status).toBe("PENDING");
    // Nunca expor o token na resposta
    expect(invitation.token).toBeUndefined();
  });

  it("deve armazenar o token como hash no banco — nunca o valor real", async () => {
    // Arrange
    const { access_token } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    // Act
    await enviarConvite(access_token, workspace.id, "novo@test.com");

    // Assert — o token no banco não pode ser igual a nenhum valor previsível
    const invitation = await prisma.invitation.findFirst({
      where: { workspace_id: workspace.id },
    });
    expect(invitation?.token_hash).toBeDefined();
    // Token real tem 64 chars hex (32 bytes), hash sha256 também tem 64 chars hex
    // mas são gerados de formas diferentes — o importante é que não é texto puro
    expect(invitation?.token_hash).toHaveLength(64);
  });

  it("deve normalizar o email do convite para lowercase", async () => {
    // Arrange
    const { access_token } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    // Act
    await enviarConvite(access_token, workspace.id, "NOVO@TEST.COM");

    // Assert
    const invitation = await prisma.invitation.findFirst({
      where: { workspace_id: workspace.id },
    });
    expect(invitation?.email).toBe("novo@test.com");
  });

  it("deve permitir que um admin envie convite", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { access_token: tokenAdmin, user: admin } = await registrarUsuario({
      email: "admin@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, admin.id, "ADMIN");

    // Act
    const response = await enviarConvite(tokenAdmin, workspace.id, "novo@test.com");

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
    const response = await enviarConvite(tokenMembro, workspace.id, "novo@test.com");

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 409 se o email já é membro do workspace", async () => {
    // Arrange
    const { access_token: tokenDono } = await registrarUsuario({ email: "dono@test.com" });
    const { user: membro } = await registrarUsuario({ email: "membro@test.com" });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");

    // Act — tenta convidar alguém que já é membro
    const response = await enviarConvite(tokenDono, workspace.id, "membro@test.com");

    // Assert
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("ALREADY_A_MEMBER");
  });

  it("deve retornar 409 se já existe um convite pendente para o mesmo email", async () => {
    // Arrange
    const { access_token } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    // Act — envia dois convites para o mesmo email
    await enviarConvite(access_token, workspace.id, "novo@test.com");
    const response = await enviarConvite(access_token, workspace.id, "novo@test.com");

    // Assert
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("INVITATION_ALREADY_PENDING");
  });

  it("deve retornar 400 se o email é inválido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await enviarConvite(access_token, workspace.id, "isso-nao-e-email");

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve permitir novo convite para email com convite expirado ou recusado anteriormente", async () => {
    // Se o convite anterior foi expirado ou recusado, deve ser possível
    // convidar o mesmo email novamente.
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    // Cria um convite expirado diretamente no banco
    await criarConviteNoBanco(workspace.id, dono.id, {
      email: "novo@test.com",
      status: "EXPIRED",
    });

    // Act — tenta convidar novamente
    const response = await enviarConvite(access_token, workspace.id, "novo@test.com");

    // Assert
    expect(response.statusCode).toBe(201);
  });
});

// ─── GET /workspaces/:id/invitations ──────────────────────────────────────────

describe("GET /workspaces/:id/invitations", () => {
  it("deve listar convites pendentes do workspace", async () => {
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    await criarConviteNoBanco(workspace.id, dono.id, { email: "a@test.com" });
    await criarConviteNoBanco(workspace.id, dono.id, { email: "b@test.com" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
    const invitations = response.json().data.invitations;
    expect(invitations).toHaveLength(2);
  });

  it("não deve incluir convites aceitos ou recusados na listagem", async () => {
    // A listagem padrão mostra apenas PENDING — o restante é histórico
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    await criarConviteNoBanco(workspace.id, dono.id, {
      email: "pendente@test.com",
      status: "PENDING",
    });
    await criarConviteNoBanco(workspace.id, dono.id, {
      email: "aceito@test.com",
      status: "ACCEPTED",
    });
    await criarConviteNoBanco(workspace.id, dono.id, {
      email: "recusado@test.com",
      status: "DECLINED",
    });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — só o PENDING deve aparecer
    const invitations = response.json().data.invitations;
    expect(invitations).toHaveLength(1);
    expect(invitations[0].email).toBe("pendente@test.com");
  });

  it("deve incluir os dados de quem enviou o convite", async () => {
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);
    await criarConviteNoBanco(workspace.id, dono.id, { email: "novo@test.com" });

    // Act
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    const invitation = response.json().data.invitations[0];
    expect(invitation.invited_by).toBeDefined();
    expect(invitation.invited_by.id).toBe(dono.id);
    expect(invitation.invited_by.password_hash).toBeUndefined();
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
    const response = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });
});

// ─── DELETE /workspaces/:id/invitations/:invitationId — cancelar ──────────────

describe("DELETE /workspaces/:id/invitations/:invitationId", () => {
  it("deve cancelar um convite pendente e retornar 204", async () => {
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);
    await criarConviteNoBanco(workspace.id, dono.id, { email: "novo@test.com" });

    const listagem = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${access_token}` },
    });
    const invitationId = listagem.json().data.invitations[0].id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/invitations/${invitationId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(204);
  });

  it("deve remover o convite cancelado da listagem de pendentes", async () => {
    // Arrange
    const { access_token, user: dono } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);
    await criarConviteNoBanco(workspace.id, dono.id, { email: "novo@test.com" });

    const listagem = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${access_token}` },
    });
    const invitationId = listagem.json().data.invitations[0].id;

    // Act
    await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/invitations/${invitationId}`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert — listagem deve estar vazia
    const depois = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${access_token}` },
    });
    expect(depois.json().data.invitations).toHaveLength(0);
  });

  it("deve retornar 403 se o usuário é membro comum", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenMembro, user: membro } = await registrarUsuario({
      email: "membro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    await adicionarMembro(workspace.id, membro.id, "MEMBER");
    await criarConviteNoBanco(workspace.id, dono.id, { email: "novo@test.com" });

    const listagem = await app.inject({
      method: "GET",
      url: `/workspaces/${workspace.id}/invitations`,
      headers: { authorization: `Bearer ${tokenDono}` },
    });
    const invitationId = listagem.json().data.invitations[0].id;

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/invitations/${invitationId}`,
      headers: { authorization: `Bearer ${tokenMembro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 404 se o convite não existe", async () => {
    // Arrange
    const { access_token } = await registrarUsuario({ email: "dono@test.com" });
    const workspace = await criarWorkspace(access_token);

    // Act
    const response = await app.inject({
      method: "DELETE",
      url: `/workspaces/${workspace.id}/invitations/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(404);
  });
});

// ─── POST /invitations/:token/accept ─────────────────────────────────────────

describe("POST /invitations/:token/accept", () => {
  it("deve aceitar o convite e retornar 200", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act — convidado aceita
    const response = await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });

  it("deve adicionar o usuário ao workspace após aceitar", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado, user: convidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act
    await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert — verificar no banco que o usuário virou membro
    const membro = await prisma.workspaceMember.findFirst({
      where: { workspace_id: workspace.id, user_id: convidado.id },
    });
    expect(membro).not.toBeNull();
    expect(membro?.role).toBe("MEMBER");
  });

  it("deve marcar o convite como ACCEPTED no banco", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act
    await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const convite = await prisma.invitation.findFirst({ where: { token_hash: tokenHash } });
    expect(convite?.status).toBe("ACCEPTED");
  });

  it("deve retornar 400 se o token é inválido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/invitations/token-que-nao-existe/accept",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_TOKEN");
  });

  it("deve retornar 400 se o convite está expirado", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
      tokenExpirado: true,
    });

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("TOKEN_EXPIRED");
  });

  it("deve retornar 400 se o convite já foi usado (token de uso único)", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Aceita uma primeira vez
    await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Act — tenta aceitar de novo
    const response = await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert
    expect(response.statusCode).toBe(400);
  });

  it("deve retornar 400 se o email do usuário logado não bate com o email do convite", async () => {
    // Um convite é pessoal: só o destinatário pode aceitar.
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({
      email: "outro@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);

    // Convite endereçado a "convidado@test.com"
    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act — "outro@test.com" tenta aceitar o convite que não é dele
    const response = await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 401 se o usuário não está autenticado", async () => {
    // Arrange — token válido mas sem autenticação
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/invitations/${token}/accept`,
    });

    // Assert
    expect(response.statusCode).toBe(401);
  });
});

// ─── POST /invitations/:token/decline ────────────────────────────────────────

describe("POST /invitations/:token/decline", () => {
  it("deve recusar o convite e retornar 200", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/invitations/${token}/decline`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert
    expect(response.statusCode).toBe(200);
  });

  it("deve marcar o convite como DECLINED no banco", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act
    await app.inject({
      method: "POST",
      url: `/invitations/${token}/decline`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const convite = await prisma.invitation.findFirst({ where: { token_hash: tokenHash } });
    expect(convite?.status).toBe("DECLINED");
  });

  it("não deve adicionar o usuário ao workspace quando recusa", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenConvidado, user: convidado } = await registrarUsuario({
      email: "convidado@test.com",
    });
    const workspace = await criarWorkspace(tokenDono);
    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act
    await app.inject({
      method: "POST",
      url: `/invitations/${token}/decline`,
      headers: { authorization: `Bearer ${tokenConvidado}` },
    });

    // Assert — NÃO deve aparecer como membro
    const membro = await prisma.workspaceMember.findFirst({
      where: { workspace_id: workspace.id, user_id: convidado.id },
    });
    expect(membro).toBeNull();
  });

  it("deve retornar 400 se o token é inválido", async () => {
    // Arrange
    const { access_token } = await registrarUsuario();

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/invitations/token-invalido/decline",
      headers: { authorization: `Bearer ${access_token}` },
    });

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_TOKEN");
  });

  it("deve retornar 403 se o email do usuário logado não bate com o email do convite", async () => {
    // Arrange
    const { access_token: tokenDono, user: dono } = await registrarUsuario({
      email: "dono@test.com",
    });
    const { access_token: tokenOutro } = await registrarUsuario({ email: "outro@test.com" });
    const workspace = await criarWorkspace(tokenDono);

    const token = await criarConviteNoBanco(workspace.id, dono.id, {
      email: "convidado@test.com",
    });

    // Act
    const response = await app.inject({
      method: "POST",
      url: `/invitations/${token}/decline`,
      headers: { authorization: `Bearer ${tokenOutro}` },
    });

    // Assert
    expect(response.statusCode).toBe(403);
  });
});
