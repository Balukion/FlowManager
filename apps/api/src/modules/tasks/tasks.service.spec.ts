import { describe, it, expect, vi, beforeEach } from "vitest";
import { TasksService } from "./tasks.service.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors/index.js";
import { makeTask } from "../../../tests/helpers/factories/task.factory.js";
import { makeWorkspace } from "../../../tests/helpers/factories/workspace.factory.js";

vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { sendEmail } from "../../lib/resend.js";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  findLastNumber: vi.fn(),
  findLastOrder: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findByProject: vi.fn(),
  update: vi.fn(),
  updateOrder: vi.fn(),
  findStepsByTask: vi.fn(),
  findStepsExceedingDeadline: vi.fn(),
  softDelete: vi.fn(),
  findWatcher: vi.fn(),
  findWatchers: vi.fn(),
  createWatcher: vi.fn(),
  deleteWatcher: vi.fn(),
};

const mockWorkspacesRepo = {
  findById: vi.fn(),
  findMember: vi.fn(),
};

const mockNotifRepo = {
  create: vi.fn(),
  markAsSent: vi.fn(),
};

let service: TasksService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new TasksService(mockRepo as any, mockWorkspacesRepo as any, undefined, mockNotifRepo as any);
});

// ─── createTask — numeração sequencial ───────────────────────────────────────

describe("createTask — numeração sequencial", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockRepo.create.mockResolvedValue(makeTask());
  });

  it("deve usar number = último number + 1", async () => {
    mockRepo.findLastNumber.mockResolvedValue({ number: 5 });
    mockRepo.findLastOrder.mockResolvedValue({ order: 3 });

    await service.createTask(WORKSPACE_ID, PROJECT_ID, USER_ID, {
      title: "Nova tarefa",
      priority: "LOW",
    });

    const criado = mockRepo.create.mock.calls[0][0];
    expect(criado.number).toBe(6);
  });

  it("deve usar number = 1 quando o projeto não tem nenhuma tarefa", async () => {
    mockRepo.findLastNumber.mockResolvedValue(null);
    mockRepo.findLastOrder.mockResolvedValue(null);

    await service.createTask(WORKSPACE_ID, PROJECT_ID, USER_ID, {
      title: "Primeira tarefa",
      priority: "LOW",
    });

    const criado = mockRepo.create.mock.calls[0][0];
    expect(criado.number).toBe(1);
  });

  it("deve usar order = último order + 1", async () => {
    mockRepo.findLastNumber.mockResolvedValue({ number: 2 });
    mockRepo.findLastOrder.mockResolvedValue({ order: 4 });

    await service.createTask(WORKSPACE_ID, PROJECT_ID, USER_ID, {
      title: "Tarefa",
      priority: "LOW",
    });

    const criado = mockRepo.create.mock.calls[0][0];
    expect(criado.order).toBe(5);
  });
});

// ─── updateTask — warnings de prazo ──────────────────────────────────────────

describe("updateTask — warnings de prazo", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
  });

  it("deve retornar warnings quando passos têm prazo além do novo prazo da tarefa", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue(task);
    // Simula 2 passos afetados
    mockRepo.findStepsExceedingDeadline.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);

    const novoDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const result = await service.updateTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
      deadline: novoDeadline,
    });

    expect(result.warnings).toEqual(["STEPS_DEADLINE_EXCEEDED"]);
  });

  it("não deve retornar warnings quando nenhum passo é afetado", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue(task);
    mockRepo.findStepsExceedingDeadline.mockResolvedValue([]);

    const novoDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const result = await service.updateTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
      deadline: novoDeadline,
    });

    expect(result.warnings).toBeUndefined();
  });
});

// ─── recalculateStatus ────────────────────────────────────────────────────────

describe("recalculateStatus", () => {
  it("não deve alterar o status se status_is_manual = true", async () => {
    const task = makeTask({ status_is_manual: true, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);

    await service.recalculateStatus(task.id);

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("não deve alterar o status se a tarefa não tem passos", async () => {
    const task = makeTask({ status_is_manual: false });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.findStepsByTask.mockResolvedValue([]);

    await service.recalculateStatus(task.id);

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("deve mudar para DONE quando todos os passos estão DONE", async () => {
    const task = makeTask({ status_is_manual: false, status: "IN_PROGRESS" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.findStepsByTask.mockResolvedValue([
      { status: "DONE" },
      { status: "DONE" },
    ]);
    mockRepo.update.mockResolvedValue(task);

    await service.recalculateStatus(task.id);

    expect(mockRepo.update).toHaveBeenCalledWith(task.id, { status: "DONE" });
  });

  it("deve mudar para IN_PROGRESS quando nem todos os passos estão DONE", async () => {
    const task = makeTask({ status_is_manual: false, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.findStepsByTask.mockResolvedValue([
      { status: "DONE" },
      { status: "PENDING" },
    ]);
    mockRepo.update.mockResolvedValue(task);

    await service.recalculateStatus(task.id);

    expect(mockRepo.update).toHaveBeenCalledWith(task.id, { status: "IN_PROGRESS" });
  });

  it("não deve chamar update se o status já é o correto", async () => {
    const task = makeTask({ status_is_manual: false, status: "DONE" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.findStepsByTask.mockResolvedValue([
      { status: "DONE" },
      { status: "DONE" },
    ]);

    await service.recalculateStatus(task.id);

    expect(mockRepo.update).not.toHaveBeenCalled();
  });
});

// ─── updateStatus — notificações para watchers ───────────────────────────────

describe("updateStatus — notificações TASK_STATUS_CHANGED", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
  });

  it("deve criar notificação TASK_STATUS_CHANGED para cada watcher", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "DONE" });
    mockRepo.findWatchers.mockResolvedValue([
      { user_id: "watcher-1" },
      { user_id: "watcher-2" },
    ]);
    mockNotifRepo.create.mockResolvedValue(undefined);

    await service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "DONE");

    expect(mockNotifRepo.create).toHaveBeenCalledTimes(2);
    expect(mockNotifRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "watcher-1", type: "TASK_STATUS_CHANGED" }),
    );
    expect(mockNotifRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "watcher-2", type: "TASK_STATUS_CHANGED" }),
    );
  });

  it("não deve criar notificações quando não há watchers", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "IN_PROGRESS" });
    mockRepo.findWatchers.mockResolvedValue([]);

    await service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "IN_PROGRESS");

    expect(mockNotifRepo.create).not.toHaveBeenCalled();
  });

  it("não deve falhar se a notificação de watcher lançar erro (falha silenciosa)", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "DONE" });
    mockRepo.findWatchers.mockResolvedValue([{ user_id: "watcher-1" }]);
    mockNotifRepo.create.mockRejectedValue(new Error("DB error"));

    await expect(
      service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "DONE"),
    ).resolves.not.toThrow();
  });
});

// ─── Permissões ───────────────────────────────────────────────────────────────

describe("permissões", () => {
  it("deve lançar NotFoundError se workspace não existe", async () => {
    mockWorkspacesRepo.findById.mockResolvedValue(null);

    await expect(
      service.createTask("ws-inexistente", "proj-1", "user-1", { title: "T", priority: "LOW" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lançar ForbiddenError se usuário não é membro do workspace", async () => {
    mockWorkspacesRepo.findById.mockResolvedValue(makeWorkspace());
    mockWorkspacesRepo.findMember.mockResolvedValue(null);

    await expect(
      service.createTask("ws-1", "proj-1", "user-1", { title: "T", priority: "LOW" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve lançar ForbiddenError se usuário é membro comum (não admin/owner)", async () => {
    const workspace = makeWorkspace({ owner_id: "outro-user" });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });

    await expect(
      service.createTask("ws-1", "proj-1", "user-1", { title: "T", priority: "LOW" }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ─── getTask — is_watching ────────────────────────────────────────────────────

describe("getTask — is_watching", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findById.mockResolvedValue(makeTask({ id: TASK_ID, project_id: PROJECT_ID }));
  });

  it("deve retornar is_watching=true quando o usuário está seguindo a tarefa", async () => {
    mockRepo.findWatcher.mockResolvedValue({ task_id: TASK_ID, user_id: USER_ID });

    const result = await service.getTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID);

    expect(result.is_watching).toBe(true);
  });

  it("deve retornar is_watching=false quando o usuário não está seguindo a tarefa", async () => {
    mockRepo.findWatcher.mockResolvedValue(null);

    const result = await service.getTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID);

    expect(result.is_watching).toBe(false);
  });
});

// ─── updateStatus — email para watchers ──────────────────────────────────────

describe("updateStatus — email para watchers", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID, name: "Meu WS" });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    vi.mocked(sendEmail).mockResolvedValue(undefined);
  });

  it("deve enviar email para cada watcher quando status muda", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, title: "Minha Tarefa", status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "DONE" });
    mockRepo.findWatchers.mockResolvedValue([
      { user_id: "w-1", user: { id: "w-1", name: "Alice", email: "alice@test.com" } },
    ]);
    mockNotifRepo.create.mockResolvedValue({ id: "notif-1" });

    await service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "DONE");

    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ to: "alice@test.com", template: "task-status-changed" }),
    );
  });

  it("deve marcar notificação como enviada após email bem-sucedido", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "DONE" });
    mockRepo.findWatchers.mockResolvedValue([
      { user_id: "w-1", user: { id: "w-1", name: "Alice", email: "alice@test.com" } },
    ]);
    mockNotifRepo.create.mockResolvedValue({ id: "notif-1" });

    await service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "DONE");

    expect(mockNotifRepo.markAsSent).toHaveBeenCalledWith("notif-1");
  });

  it("não deve enviar email quando não há watchers", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "IN_PROGRESS" });
    mockRepo.findWatchers.mockResolvedValue([]);

    await service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "IN_PROGRESS");

    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  it("não deve falhar quando o envio de email falha (falha silenciosa)", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "DONE" });
    mockRepo.findWatchers.mockResolvedValue([
      { user_id: "w-1", user: { id: "w-1", name: "Bob", email: "bob@test.com" } },
    ]);
    mockNotifRepo.create.mockResolvedValue({ id: "notif-2" });
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend error"));

    await expect(
      service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "DONE"),
    ).resolves.not.toThrow();
  });

  it("não deve chamar markAsSent se o email falhar", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "TODO" });
    mockRepo.findById.mockResolvedValue(task);
    mockRepo.update.mockResolvedValue({ ...task, status: "DONE" });
    mockRepo.findWatchers.mockResolvedValue([
      { user_id: "w-1", user: { id: "w-1", name: "Bob", email: "bob@test.com" } },
    ]);
    mockNotifRepo.create.mockResolvedValue({ id: "notif-2" });
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend error"));

    await service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, "DONE");

    expect(mockNotifRepo.markAsSent).not.toHaveBeenCalled();
  });
});

// ─── assignTask ───────────────────────────────────────────────────────────────

describe("assignTask", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-admin";
  const TARGET_USER_ID = "user-member";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockRepo.findById.mockResolvedValue(makeTask({ id: TASK_ID, project_id: PROJECT_ID }));
    mockRepo.update.mockResolvedValue(makeTask({ id: TASK_ID, project_id: PROJECT_ID, assignee_id: TARGET_USER_ID }));
  });

  it("lança ForbiddenError quando não é admin nem owner", async () => {
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "outro" });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);

    await expect(
      service.assignTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, TARGET_USER_ID),
    ).rejects.toThrow(ForbiddenError);
  });

  it("lança NotFoundError quando tarefa não existe", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      service.assignTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, TARGET_USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança BadRequestError quando target não é membro do workspace", async () => {
    mockWorkspacesRepo.findMember
      .mockResolvedValueOnce({ role: "ADMIN" }) // admin check passa
      .mockResolvedValueOnce(null);             // target não é membro

    await expect(
      service.assignTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, TARGET_USER_ID),
    ).rejects.toMatchObject({ code: "USER_NOT_MEMBER" });
  });

  it("chama repo.update com assignee_id correto", async () => {
    mockWorkspacesRepo.findMember
      .mockResolvedValueOnce({ role: "ADMIN" })
      .mockResolvedValueOnce({ role: "MEMBER" });

    await service.assignTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, TARGET_USER_ID);

    expect(mockRepo.update).toHaveBeenCalledWith(TASK_ID, { assignee_id: TARGET_USER_ID });
  });

  it("chama repo.update com assignee_id null para desatribuir", async () => {
    await service.assignTask(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, null);

    expect(mockRepo.update).toHaveBeenCalledWith(TASK_ID, { assignee_id: null });
  });
});
