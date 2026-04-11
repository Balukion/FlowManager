import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommentsService } from "./comments.service.js";
import { ForbiddenError, NotFoundError } from "../../errors/index.js";
import { makeTask } from "../../../tests/helpers/factories/task.factory.js";
import { makeWorkspace } from "../../../tests/helpers/factories/workspace.factory.js";
import { makeComment } from "../../../tests/helpers/factories/comment.factory.js";

vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { sendEmail } from "../../lib/resend.js";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByTask: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  createMention: vi.fn(),
};

const mockTasksRepo = {
  findById: vi.fn(),
};

const mockWorkspacesRepo = {
  findById: vi.fn(),
  findMember: vi.fn(),
  findMemberWithUser: vi.fn(),
};

const mockNotifRepo = {
  create: vi.fn(),
  markAsSent: vi.fn(),
};

let service: CommentsService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new CommentsService(
    mockRepo as any,
    mockTasksRepo as any,
    mockWorkspacesRepo as any,
    undefined, // activityRepo
    mockNotifRepo as any,
  );
});

// ─── createComment — mencões ──────────────────────────────────────────────────

describe("createComment — mencões", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";
  const MENTIONED_USER_ID = "00000000-0000-0000-0000-000000000002";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValue({ role: "MEMBER", user: { email: null, name: "Membro" } });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.create.mockResolvedValue(makeComment({ id: "comment-1", task_id: TASK_ID, user_id: USER_ID }));
    mockRepo.createMention.mockResolvedValue(undefined);
    mockNotifRepo.create.mockResolvedValue(undefined);
  });

  it("deve criar menção para usuário membro do workspace mencionado no conteúdo", async () => {
    const content = `Olá @${MENTIONED_USER_ID} confere isso`;

    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content });

    expect(mockRepo.createMention).toHaveBeenCalledWith("comment-1", MENTIONED_USER_ID);
  });

  it("não deve criar menção para usuário que não é membro do workspace", async () => {
    const NON_MEMBER_ID = "00000000-0000-0000-0000-000000000099";
    const content = `Olá @${NON_MEMBER_ID}`;

    mockWorkspacesRepo.findMemberWithUser.mockResolvedValueOnce(null);

    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content });

    expect(mockRepo.createMention).not.toHaveBeenCalled();
  });
});

// ─── createComment — notificação COMMENT_MENTION ─────────────────────────────

describe("createComment — notificação COMMENT_MENTION", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";
  const MENTIONED_USER_ID = "00000000-0000-0000-0000-000000000002";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, title: "Tarefa X" });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockWorkspacesRepo.findMemberWithUser.mockResolvedValue({ role: "MEMBER", user: { email: null, name: "Membro" } });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.create.mockResolvedValue(makeComment({ id: "comment-1", task_id: TASK_ID, user_id: USER_ID }));
    mockRepo.createMention.mockResolvedValue(undefined);
    mockNotifRepo.create.mockResolvedValue(undefined);
  });

  it("deve criar notificação COMMENT_MENTION para o usuário mencionado", async () => {
    const content = `Ei @${MENTIONED_USER_ID} olha isso`;

    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content });

    expect(mockNotifRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: MENTIONED_USER_ID,
        type: "COMMENT_MENTION",
      }),
    );
  });

  it("não deve criar notificação para usuário não membro mencionado", async () => {
    const NON_MEMBER_ID = "00000000-0000-0000-0000-000000000099";
    const content = `@${NON_MEMBER_ID}`;

    mockWorkspacesRepo.findMemberWithUser.mockResolvedValueOnce(null);

    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content });

    expect(mockNotifRepo.create).not.toHaveBeenCalled();
  });

  it("não deve criar notificação quando não há menções", async () => {
    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
      content: "Comentário sem menções",
    });

    expect(mockNotifRepo.create).not.toHaveBeenCalled();
  });

  it("não deve falhar se a notificação de menção lançar erro (falha silenciosa)", async () => {
    const content = `@${MENTIONED_USER_ID}`;
    mockNotifRepo.create.mockRejectedValue(new Error("DB error"));

    await expect(
      service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content }),
    ).resolves.not.toThrow();
  });
});

// ─── createComment — log de atividade ────────────────────────────────────────

describe("createComment — log de atividade", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  it("deve criar log COMMENT_ADDED com task_id quando activityRepo está disponível", async () => {
    const mockActivityRepo = { createLog: vi.fn().mockResolvedValue(undefined) };
    const serviceComActivity = new CommentsService(
      mockRepo as any,
      mockTasksRepo as any,
      mockWorkspacesRepo as any,
      mockActivityRepo as any,
      mockNotifRepo as any,
    );

    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.create.mockResolvedValue(makeComment({ id: "comment-1", task_id: TASK_ID, user_id: USER_ID }));

    await serviceComActivity.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
      content: "Comentário novo",
    });

    expect(mockActivityRepo.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: WORKSPACE_ID,
        user_id: USER_ID,
        action: "COMMENT_CREATED",
        task_id: TASK_ID,
      }),
    );
  });

  it("não deve falhar se activityRepo não estiver disponível", async () => {
    const serviceSeActivity = new CommentsService(
      mockRepo as any,
      mockTasksRepo as any,
      mockWorkspacesRepo as any,
      undefined,
      mockNotifRepo as any,
    );

    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.create.mockResolvedValue(makeComment({ id: "comment-1", task_id: TASK_ID, user_id: USER_ID }));

    await expect(
      serviceSeActivity.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
        content: "Comentário",
      }),
    ).resolves.not.toThrow();
  });
});

// ─── deleteComment — log de atividade ────────────────────────────────────────

describe("deleteComment — log de atividade", () => {
  const WORKSPACE_ID = "ws-1";
  const TASK_ID = "task-1";
  const COMMENT_ID = "comment-1";
  const USER_ID = "user-1";

  it("deve criar log COMMENT_DELETED com task_id quando activityRepo está disponível", async () => {
    const mockActivityRepo = { createLog: vi.fn().mockResolvedValue(undefined) };
    const serviceComActivity = new CommentsService(
      mockRepo as any,
      mockTasksRepo as any,
      mockWorkspacesRepo as any,
      mockActivityRepo as any,
      mockNotifRepo as any,
    );

    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const comment = makeComment({ id: COMMENT_ID, task_id: TASK_ID, user_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findById.mockResolvedValue(comment);
    mockRepo.softDelete.mockResolvedValue(undefined);

    await serviceComActivity.deleteComment(WORKSPACE_ID, "proj-1", TASK_ID, COMMENT_ID, USER_ID);

    expect(mockActivityRepo.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: WORKSPACE_ID,
        user_id: USER_ID,
        action: "COMMENT_DELETED",
        task_id: TASK_ID,
      }),
    );
  });
});

// ─── updateComment — permissões ───────────────────────────────────────────────

describe("updateComment — permissões", () => {
  const WORKSPACE_ID = "ws-1";
  const TASK_ID = "task-1";
  const COMMENT_ID = "comment-1";
  const USER_ID = "user-1";

  it("deve lançar ForbiddenError se outro usuário tenta editar o comentário", async () => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "owner" });
    const comment = makeComment({ id: COMMENT_ID, task_id: TASK_ID, user_id: "outro-user" });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findById.mockResolvedValue(comment);

    await expect(
      service.updateComment(WORKSPACE_ID, "proj-1", TASK_ID, COMMENT_ID, USER_ID, "novo conteúdo"),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ─── deleteComment — permissões ───────────────────────────────────────────────

describe("deleteComment — permissões", () => {
  const WORKSPACE_ID = "ws-1";
  const TASK_ID = "task-1";
  const COMMENT_ID = "comment-1";

  it("deve permitir que o autor delete o próprio comentário", async () => {
    const USER_ID = "user-1";
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "owner" });
    const comment = makeComment({ id: COMMENT_ID, task_id: TASK_ID, user_id: USER_ID });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findById.mockResolvedValue(comment);
    mockRepo.softDelete.mockResolvedValue(undefined);

    await expect(
      service.deleteComment(WORKSPACE_ID, "proj-1", TASK_ID, COMMENT_ID, USER_ID),
    ).resolves.not.toThrow();
  });

  it("deve lançar ForbiddenError se membro comum tenta deletar comentário de outro", async () => {
    const USER_ID = "user-1";
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "owner" });
    const comment = makeComment({ id: COMMENT_ID, task_id: TASK_ID, user_id: "outro-user" });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findById.mockResolvedValue(comment);

    await expect(
      service.deleteComment(WORKSPACE_ID, "proj-1", TASK_ID, COMMENT_ID, USER_ID),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve permitir que admin delete comentário de outro usuário", async () => {
    const USER_ID = "admin-user";
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "owner" });
    const comment = makeComment({ id: COMMENT_ID, task_id: TASK_ID, user_id: "outro-user" });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockRepo.findById.mockResolvedValue(comment);
    mockRepo.softDelete.mockResolvedValue(undefined);

    await expect(
      service.deleteComment(WORKSPACE_ID, "proj-1", TASK_ID, COMMENT_ID, USER_ID),
    ).resolves.not.toThrow();
  });
});

// ─── createComment — email de menção ─────────────────────────────────────────

describe("createComment — email de menção", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";
  const MENTIONED_USER_ID = "00000000-0000-0000-0000-000000000002";

  beforeEach(() => {
    vi.clearAllMocks();
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID, name: "WS Alpha" });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, title: "Tarefa X" });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.create.mockResolvedValue(makeComment({ id: "comment-1", task_id: TASK_ID, user_id: USER_ID }));
    mockRepo.createMention.mockResolvedValue(undefined);
    mockNotifRepo.create.mockResolvedValue({ id: "notif-1", user_id: MENTIONED_USER_ID });
    mockNotifRepo.markAsSent.mockResolvedValue(undefined);
  });

  it("envia email para o usuário mencionado quando notificação é criada", async () => {
    mockWorkspacesRepo.findMemberWithUser
      .mockResolvedValueOnce({ role: "MEMBER", user: { email: "mentioned@test.com", name: "João" } });

    const content = `Ei @${MENTIONED_USER_ID} olha isso`;
    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: "comment-mention" }),
    );
  });

  it("chama markAsSent após email enviado com sucesso", async () => {
    mockWorkspacesRepo.findMemberWithUser
      .mockResolvedValueOnce({ role: "MEMBER", user: { email: "mentioned@test.com", name: "João" } });

    const content = `@${MENTIONED_USER_ID}`;
    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content });

    expect(mockNotifRepo.markAsSent).toHaveBeenCalledWith("notif-1");
  });

  it("não chama markAsSent se email falhar (silencioso)", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend error"));
    mockWorkspacesRepo.findMemberWithUser
      .mockResolvedValueOnce({ role: "MEMBER", user: { email: "mentioned@test.com", name: "João" } });

    const content = `@${MENTIONED_USER_ID}`;
    await expect(
      service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content }),
    ).resolves.not.toThrow();

    expect(mockNotifRepo.markAsSent).not.toHaveBeenCalled();
  });

  it("não envia email quando membro mencionado não tem email", async () => {
    mockWorkspacesRepo.findMemberWithUser
      .mockResolvedValueOnce({ role: "MEMBER", user: { email: null, name: "João" } });

    const content = `@${MENTIONED_USER_ID}`;
    await service.createComment(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { content });

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
