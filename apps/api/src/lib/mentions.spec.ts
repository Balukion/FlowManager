import { describe, it, expect, vi, beforeEach } from "vitest";
import { processMentions } from "./mentions.js";

vi.mock("./resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { sendEmail } from "./resend.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WORKSPACE_ID = "ws-1";
const TASK_ID = "task-1";
const COMMENT_ID = "comment-1";
const COMMENTER_ID = "user-1";
const MENTIONED_UUID = "00000000-0000-0000-0000-000000000002";
const TASK = { title: "Tarefa X", project_id: "proj-1" };

const mockWorkspacesRepo = { findMemberWithUser: vi.fn() };
const mockCommentsRepo = { createMention: vi.fn() };
const mockNotifRepo = { create: vi.fn(), markAsSent: vi.fn() };

function makeDeps(overrides?: Partial<typeof mockNotifRepo | undefined>) {
  return {
    workspacesRepo: mockWorkspacesRepo,
    commentsRepo: mockCommentsRepo,
    notifRepo: mockNotifRepo,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockWorkspacesRepo.findMemberWithUser.mockResolvedValue({
    role: "MEMBER",
    user: { email: null, name: "João" },
  });
  mockCommentsRepo.createMention.mockResolvedValue(undefined);
  mockNotifRepo.create.mockResolvedValue(undefined);
  mockNotifRepo.markAsSent.mockResolvedValue(undefined);
});

// ─── Menções — registro ───────────────────────────────────────────────────────

describe("processMentions — registro de menção", () => {
  it("cria menção para UUID de membro do workspace", async () => {
    const content = `Olá @${MENTIONED_UUID} confere isso`;

    await processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(mockCommentsRepo.createMention).toHaveBeenCalledWith(COMMENT_ID, MENTIONED_UUID);
  });

  it("não cria menção para UUID de não-membro", async () => {
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValueOnce(null);
    const content = `Olá @${MENTIONED_UUID}`;

    await processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(mockCommentsRepo.createMention).not.toHaveBeenCalled();
  });

  it("não cria menção quando o conteúdo não tem UUIDs", async () => {
    await processMentions("Comentário sem menções", WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(mockCommentsRepo.createMention).not.toHaveBeenCalled();
    expect(mockWorkspacesRepo.findMemberWithUser).not.toHaveBeenCalled();
  });

  it("cria menção para múltiplos UUIDs membros no mesmo conteúdo", async () => {
    const SECOND_UUID = "00000000-0000-0000-0000-000000000003";
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValue({ role: "MEMBER", user: { email: null, name: "X" } });
    const content = `@${MENTIONED_UUID} e @${SECOND_UUID}`;

    await processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(mockCommentsRepo.createMention).toHaveBeenCalledTimes(2);
    expect(mockCommentsRepo.createMention).toHaveBeenCalledWith(COMMENT_ID, MENTIONED_UUID);
    expect(mockCommentsRepo.createMention).toHaveBeenCalledWith(COMMENT_ID, SECOND_UUID);
  });
});

// ─── Menções — notificação ────────────────────────────────────────────────────

describe("processMentions — notificação", () => {
  it("cria notificação COMMENT_MENTION para o membro mencionado", async () => {
    const content = `@${MENTIONED_UUID}`;

    await processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(mockNotifRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: MENTIONED_UUID,
        type: "COMMENT_MENTION",
      }),
    );
  });

  it("não cria notificação quando não há menções", async () => {
    await processMentions("sem menções", WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(mockNotifRepo.create).not.toHaveBeenCalled();
  });

  it("não falha se notifRepo.create lançar erro (silencioso)", async () => {
    mockNotifRepo.create.mockRejectedValue(new Error("DB error"));
    const content = `@${MENTIONED_UUID}`;

    await expect(
      processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps()),
    ).resolves.not.toThrow();
  });

  it("funciona sem notifRepo (deps.notifRepo undefined)", async () => {
    const content = `@${MENTIONED_UUID}`;
    const deps = { workspacesRepo: mockWorkspacesRepo, commentsRepo: mockCommentsRepo };

    await expect(
      processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, deps),
    ).resolves.not.toThrow();

    expect(mockCommentsRepo.createMention).toHaveBeenCalledWith(COMMENT_ID, MENTIONED_UUID);
  });
});

// ─── Menções — email ──────────────────────────────────────────────────────────

describe("processMentions — email", () => {
  beforeEach(() => {
    mockNotifRepo.create.mockResolvedValue({ id: "notif-1", user_id: MENTIONED_UUID });
  });

  it("envia email quando membro tem email e notificação foi criada", async () => {
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValueOnce({
      role: "MEMBER",
      user: { email: "mentioned@test.com", name: "João" },
    });
    const content = `@${MENTIONED_UUID}`;

    await processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: "comment-mention" }),
    );
  });

  it("chama markAsSent após email enviado com sucesso", async () => {
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValueOnce({
      role: "MEMBER",
      user: { email: "mentioned@test.com", name: "João" },
    });
    const content = `@${MENTIONED_UUID}`;

    await processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(mockNotifRepo.markAsSent).toHaveBeenCalledWith("notif-1");
  });

  it("não chama markAsSent se email falhar (silencioso)", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend error"));
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValueOnce({
      role: "MEMBER",
      user: { email: "mentioned@test.com", name: "João" },
    });
    const content = `@${MENTIONED_UUID}`;

    await expect(
      processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps()),
    ).resolves.not.toThrow();

    expect(mockNotifRepo.markAsSent).not.toHaveBeenCalled();
  });

  it("não envia email quando membro não tem email", async () => {
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValueOnce({
      role: "MEMBER",
      user: { email: null, name: "João" },
    });
    const content = `@${MENTIONED_UUID}`;

    await processMentions(content, WORKSPACE_ID, TASK_ID, COMMENT_ID, COMMENTER_ID, TASK, makeDeps());

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
