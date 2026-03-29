import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvitationsService } from "./invitations.service.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../../errors/index.js";
import { makeInvitation } from "../../../tests/helpers/factories/invitation.factory.js";
import { makeUser } from "../../../tests/helpers/factories/user.factory.js";
import { makeWorkspace } from "../../../tests/helpers/factories/workspace.factory.js";

// ─── Mock do sendEmail ────────────────────────────────────────────────────────

vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mocks dos repositórios ───────────────────────────────────────────────────

const mockRepo = {
  findMemberByEmail: vi.fn(),
  findPendingByEmail: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findByWorkspace: vi.fn(),
  delete: vi.fn(),
  findByTokenHash: vi.fn(),
  findUserById: vi.fn(),
  createWorkspaceMember: vi.fn(),
  updateStatus: vi.fn(),
};

const mockWorkspacesRepo = {
  findById: vi.fn(),
  findMember: vi.fn(),
};

let service: InvitationsService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new InvitationsService(mockRepo as any, mockWorkspacesRepo as any);
});

// ─── createInvitation ─────────────────────────────────────────────────────────

describe("createInvitation", () => {
  const WORKSPACE_ID = "ws-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockRepo.findMemberByEmail.mockResolvedValue(null);
    mockRepo.findPendingByEmail.mockResolvedValue(null);
  });

  it("deve normalizar o email para lowercase antes de verificar duplicatas", async () => {
    mockRepo.create.mockResolvedValue(makeInvitation({ email: "convidado@test.com" }));

    await service.createInvitation(WORKSPACE_ID, USER_ID, "CONVIDADO@TEST.COM");

    expect(mockRepo.findMemberByEmail).toHaveBeenCalledWith(WORKSPACE_ID, "convidado@test.com");
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
    mockRepo.findMemberByEmail.mockResolvedValue({ id: "membro-existente" });

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
    mockRepo.findMemberByEmail.mockResolvedValue({ id: "membro-existente" });

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
    mockRepo.findUserById.mockResolvedValue(user);

    await expect(
      service.acceptInvitation("token_valido", user.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve criar membro no workspace e marcar convite como ACCEPTED quando tudo está correto", async () => {
    const convite = makeInvitation({ email: "certo@test.com", status: "PENDING", role: "MEMBER" });
    const user = makeUser({ email: "certo@test.com" });
    mockRepo.findByTokenHash.mockResolvedValue(convite);
    mockRepo.findUserById.mockResolvedValue(user);
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
    mockRepo.findUserById.mockResolvedValue(user);

    await expect(
      service.declineInvitation("token_valido", user.id),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve marcar convite como DECLINED quando tudo está correto", async () => {
    const convite = makeInvitation({ email: "certo@test.com", status: "PENDING" });
    const user = makeUser({ email: "certo@test.com" });
    mockRepo.findByTokenHash.mockResolvedValue(convite);
    mockRepo.findUserById.mockResolvedValue(user);
    mockRepo.updateStatus.mockResolvedValue(undefined);

    await service.declineInvitation("token_valido", user.id);

    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      convite.id,
      "DECLINED",
      expect.objectContaining({ declined_at: expect.any(Date) }),
    );
  });
});
