import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvitationsService } from "./invitations.service.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../errors/index.js";

vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { sendEmail } from "../../lib/resend.js";
import { makeInvitation } from "../../../tests/helpers/factories/invitation.factory.js";
import { makeUser } from "../../../tests/helpers/factories/user.factory.js";
import { makeWorkspace } from "../../../tests/helpers/factories/workspace.factory.js";

// ─── Mock do sendEmail ────────────────────────────────────────────────────────

vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mocks dos repositórios ───────────────────────────────────────────────────

const mockRepo = {
  findPendingByEmail: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findByWorkspace: vi.fn(),
  delete: vi.fn(),
  findByTokenHash: vi.fn(),
  findByTokenHashWithDetails: vi.fn(),
  createWorkspaceMember: vi.fn(),
  updateStatus: vi.fn(),
  resendToken: vi.fn(),
};

const mockWorkspacesRepo = {
  findById: vi.fn(),
  findMember: vi.fn(),
  findMemberByEmail: vi.fn(),
};

const mockUsersRepo = {
  findById: vi.fn(),
};

let service: InvitationsService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new InvitationsService(mockRepo as any, mockWorkspacesRepo as any, mockUsersRepo as any);
});

// ─── createInvitation ─────────────────────────────────────────────────────────

describe("createInvitation", () => {
  const WORKSPACE_ID = "ws-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockWorkspacesRepo.findMemberByEmail.mockResolvedValue(null);
    mockRepo.findPendingByEmail.mockResolvedValue(null);
  });

  it("deve normalizar o email para lowercase antes de verificar duplicatas", async () => {
    mockRepo.create.mockResolvedValue(makeInvitation({ email: "convidado@test.com" }));

    await service.createInvitation(WORKSPACE_ID, USER_ID, "CONVIDADO@TEST.COM");

    expect(mockWorkspacesRepo.findMemberByEmail).toHaveBeenCalledWith(WORKSPACE_ID, "convidado@test.com");
    expect(mockRepo.findPendingByEmail).toHaveBeenCalledWith(WORKSPACE_ID, "convidado@test.com");
  });

  it("deve salvar o token_hash (sha256) e nunca o token em texto puro", async () => {
    mockRepo.create.mockResolvedValue(makeInvitation());

    await service.createInvitation(WORKSPACE_ID, USER_ID, "convidado@test.com");

    const criado = mockRepo.create.mock.calls[0][0];
    // token_hash deve ser um sha256 (64 chars hex)
    expect(criado.token_hash).toMatch(/^[a-f0-9]{64}$/);
    // nunca deve ter a chave "token"
    expect(criado).not.toHaveProperty("token");
  });

  it("não deve expor token_hash na resposta", async () => {
    mockRepo.create.mockResolvedValue(makeInvitation({ token_hash: "hash_secreto" }));

    const result = await service.createInvitation(WORKSPACE_ID, USER_ID, "convidado@test.com");

    expect(result.invitation).not.toHaveProperty("token_hash");
  });

  it("deve lançar ConflictError ALREADY_A_MEMBER se o usuário já é membro", async () => {
    mockWorkspacesRepo.findMemberByEmail.mockResolvedValue({ id: "membro-existente" });

    await expect(
      service.createInvitation(WORKSPACE_ID, USER_ID, "membro@test.com"),
    ).rejects.toMatchObject({ code: "ALREADY_A_MEMBER" });
  });

  it("deve lançar ConflictError INVITATION_ALREADY_PENDING se já existe convite pendente", async () => {
    mockRepo.findPendingByEmail.mockResolvedValue(makeInvitation());

    await expect(
      service.createInvitation(WORKSPACE_ID, USER_ID, "pendente@test.com"),
    ).rejects.toMatchObject({ code: "INVITATION_ALREADY_PENDING" });
  });

  it("deve lançar ConflictError e não rejeitar quando o usuário já é membro — verifica antes de ConflictError pendente", async () => {
    mockWorkspacesRepo.findMemberByEmail.mockResolvedValue({ id: "membro-existente" });

    await expect(
      service.createInvitation(WORKSPACE_ID, USER_ID, "qualquer@test.com"),
    ).rejects.toThrow(ConflictError);
  });
});

// ─── acceptInvitation ─────────────────────────────────────────────────────────

describe("acceptInvitation", () => {
  it("deve lançar BadRequestError INVALID_TOKEN se o token não existe no banco", async () => {
    mockRepo.findByTokenHash.mockResolvedValue(null);

    await expect(
      service.acceptInvitation("token_invalido", "user-1"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("deve lançar BadRequestError TOKEN_ALREADY_USED se o convite não está PENDING", async () => {
    mockRepo.findByTokenHash.mockResolvedValue(
      makeInvitation({ status: "ACCEPTED" }),
    );

    await expect(
      service.acceptInvitation("token_usado", "user-1"),
    ).rejects.toMatchObject({ code: "TOKEN_ALREADY_USED" });
  });

  it("deve lançar BadRequestError TOKEN_EXPIRED se o convite está vencido", async () => {
    const expirado = makeInvitation({
      status: "PENDING",
      expires_at: new Date(Date.now() - 1000), // no passado
    });
    mockRepo.findByTokenHash.mockResolvedValue(expirado);

    await expect(
      service.acceptInvitation("token_expirado", "user-1"),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
  });

  it("deve lançar ForbiddenError se o email do usuário não bate com o email do convite", async () => {
    const convite = makeInvitation({ email: "certo@test.com", status: "PENDING" });
    const user = makeUser({ email: "errado@test.com" });
    mockRepo.findByTokenHash.mockResolvedValue(convite);
    mockUsersRepo.findById.mockResolvedValue(user);

    await expect(
      service.acceptInvitation("token_valido", user.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve criar membro no workspace e marcar convite como ACCEPTED quando tudo está correto", async () => {
    const convite = makeInvitation({ email: "certo@test.com", status: "PENDING", role: "MEMBER" });
    const user = makeUser({ email: "certo@test.com" });
    mockRepo.findByTokenHash.mockResolvedValue(convite);
    mockUsersRepo.findById.mockResolvedValue(user);
    mockRepo.createWorkspaceMember.mockResolvedValue(undefined);
    mockRepo.updateStatus.mockResolvedValue(undefined);

    await service.acceptInvitation("token_valido", user.id);

    expect(mockRepo.createWorkspaceMember).toHaveBeenCalledWith(
      convite.workspace_id,
      user.id,
      convite.role,
    );
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      convite.id,
      "ACCEPTED",
      expect.objectContaining({ accepted_at: expect.any(Date) }),
    );
  });
});

// ─── declineInvitation ────────────────────────────────────────────────────────

describe("declineInvitation", () => {
  it("deve lançar BadRequestError TOKEN_EXPIRED se o convite está vencido", async () => {
    const expirado = makeInvitation({
      status: "PENDING",
      expires_at: new Date(Date.now() - 1000),
    });
    mockRepo.findByTokenHash.mockResolvedValue(expirado);

    await expect(
      service.declineInvitation("token_expirado", "user-1"),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
  });

  it("deve lançar ForbiddenError se o email do usuário não bate com o email do convite", async () => {
    const convite = makeInvitation({ email: "certo@test.com", status: "PENDING" });
    const user = makeUser({ email: "errado@test.com" });
    mockRepo.findByTokenHash.mockResolvedValue(convite);
    mockUsersRepo.findById.mockResolvedValue(user);

    await expect(
      service.declineInvitation("token_valido", user.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve marcar convite como DECLINED quando tudo está correto", async () => {
    const convite = makeInvitation({ email: "certo@test.com", status: "PENDING" });
    const user = makeUser({ email: "certo@test.com" });
    mockRepo.findByTokenHash.mockResolvedValue(convite);
    mockUsersRepo.findById.mockResolvedValue(user);
    mockRepo.updateStatus.mockResolvedValue(undefined);

    await service.declineInvitation("token_valido", user.id);

    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      convite.id,
      "DECLINED",
      expect.objectContaining({ declined_at: expect.any(Date) }),
    );
  });
});

// ─── resendInvitation ─────────────────────────────────────────────────────────

describe("resendInvitation", () => {
  const WORKSPACE_ID = "ws-1";
  const INVITATION_ID = "inv-resend";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID, name: "Meu WS" });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    vi.mocked(sendEmail).mockResolvedValue(undefined);
  });

  it("deve lançar NotFoundError se o convite não existir", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      service.resendInvitation(WORKSPACE_ID, INVITATION_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lançar NotFoundError se o convite não pertencer ao workspace", async () => {
    mockRepo.findById.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: "outro-ws", status: "EXPIRED" }),
    );

    await expect(
      service.resendInvitation(WORKSPACE_ID, INVITATION_ID, USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lançar BadRequestError INVITATION_NOT_EXPIRED se o status não for EXPIRED", async () => {
    mockRepo.findById.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: WORKSPACE_ID, status: "PENDING" }),
    );

    await expect(
      service.resendInvitation(WORKSPACE_ID, INVITATION_ID, USER_ID),
    ).rejects.toMatchObject({ code: "INVITATION_NOT_EXPIRED" });
  });

  it("deve gerar novo hash sha256 e chamar resendToken com ele", async () => {
    mockRepo.findById.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: WORKSPACE_ID, status: "EXPIRED", email: "user@test.com" }),
    );
    mockRepo.resendToken.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: WORKSPACE_ID, status: "PENDING" }),
    );

    await service.resendInvitation(WORKSPACE_ID, INVITATION_ID, USER_ID);

    const [id, tokenHash] = mockRepo.resendToken.mock.calls[0];
    expect(id).toBe(INVITATION_ID);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("deve definir novo prazo de expiração no futuro", async () => {
    mockRepo.findById.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: WORKSPACE_ID, status: "EXPIRED", email: "user@test.com" }),
    );
    mockRepo.resendToken.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: WORKSPACE_ID, status: "PENDING" }),
    );

    await service.resendInvitation(WORKSPACE_ID, INVITATION_ID, USER_ID);

    const [, , expiresAt] = mockRepo.resendToken.mock.calls[0];
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("deve reenviar email para o endereço do convite", async () => {
    mockRepo.findById.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: WORKSPACE_ID, status: "EXPIRED", email: "convidado@test.com" }),
    );
    mockRepo.resendToken.mockResolvedValue(
      makeInvitation({ id: INVITATION_ID, workspace_id: WORKSPACE_ID, status: "PENDING" }),
    );

    await service.resendInvitation(WORKSPACE_ID, INVITATION_ID, USER_ID);

    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ to: "convidado@test.com", template: "invitation" }),
    );
  });

  it("não deve expor token_hash na resposta", async () => {
    const invitation = makeInvitation({
      id: INVITATION_ID,
      workspace_id: WORKSPACE_ID,
      status: "EXPIRED",
      email: "user@test.com",
    });
    mockRepo.findById.mockResolvedValue(invitation);
    mockRepo.resendToken.mockResolvedValue({ ...invitation, status: "PENDING", token_hash: "novo_hash" });

    const result = await service.resendInvitation(WORKSPACE_ID, INVITATION_ID, USER_ID);

    expect(result.invitation).not.toHaveProperty("token_hash");
  });
});

// ─── getInvitationPreview ─────────────────────────────────────────────────────

describe("getInvitationPreview", () => {
  const makeDetailedInvitation = (overrides = {}) => ({
    id: "inv-1",
    email: "convidado@test.com",
    status: "PENDING",
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    workspace: { name: "Workspace X" },
    inviter: { name: "Admin Y" },
    ...overrides,
  });

  it("retorna preview para token válido", async () => {
    mockRepo.findByTokenHashWithDetails.mockResolvedValue(makeDetailedInvitation());

    const result = await service.getInvitationPreview("valid-token");

    expect(result.workspace_name).toBe("Workspace X");
    expect(result.email).toBe("convidado@test.com");
    expect(result.invited_by_name).toBe("Admin Y");
  });

  it("lança BadRequestError INVALID_TOKEN quando token não existe", async () => {
    mockRepo.findByTokenHashWithDetails.mockResolvedValue(null);

    await expect(service.getInvitationPreview("bad-token")).rejects.toMatchObject({
      code: "INVALID_TOKEN",
    });
  });

  it("lança BadRequestError TOKEN_EXPIRED quando convite expirou", async () => {
    mockRepo.findByTokenHashWithDetails.mockResolvedValue(
      makeDetailedInvitation({ expires_at: new Date(Date.now() - 1000) }),
    );

    await expect(service.getInvitationPreview("expired-token")).rejects.toMatchObject({
      code: "TOKEN_EXPIRED",
    });
  });

  it("lança BadRequestError TOKEN_ALREADY_USED quando não está PENDING", async () => {
    mockRepo.findByTokenHashWithDetails.mockResolvedValue(
      makeDetailedInvitation({ status: "ACCEPTED" }),
    );

    await expect(service.getInvitationPreview("used-token")).rejects.toMatchObject({
      code: "TOKEN_ALREADY_USED",
    });
  });

  it("nunca expõe token_hash no resultado", async () => {
    mockRepo.findByTokenHashWithDetails.mockResolvedValue({
      ...makeDetailedInvitation(),
      token_hash: "secret",
    });

    const result = await service.getInvitationPreview("valid-token");

    expect(result).not.toHaveProperty("token_hash");
  });

  it("marca convite como VIEWED quando status é PENDING", async () => {
    mockRepo.findByTokenHashWithDetails.mockResolvedValue(makeDetailedInvitation({ status: "PENDING" }));
    mockRepo.updateStatus.mockResolvedValue(undefined);

    await service.getInvitationPreview("valid-token");

    expect(mockRepo.updateStatus).toHaveBeenCalledWith("inv-1", "VIEWED");
  });

  it("não marca como VIEWED quando status já é VIEWED", async () => {
    mockRepo.findByTokenHashWithDetails.mockResolvedValue(makeDetailedInvitation({ status: "VIEWED" }));
    mockRepo.updateStatus.mockResolvedValue(undefined);

    await service.getInvitationPreview("valid-token");

    expect(mockRepo.updateStatus).not.toHaveBeenCalled();
  });
});
