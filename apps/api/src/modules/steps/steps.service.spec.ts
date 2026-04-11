import { describe, it, expect, vi, beforeEach } from "vitest";
import { StepsService } from "./steps.service.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../../errors/index.js";
import { makeTask } from "../../../tests/helpers/factories/task.factory.js";
import { makeStep } from "../../../tests/helpers/factories/step.factory.js";
import { makeWorkspace } from "../../../tests/helpers/factories/workspace.factory.js";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  findLastOrder: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findByTask: vi.fn(),
  findAssignedToUser: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  softDelete: vi.fn(),
  findActiveAssignment: vi.fn(),
  createAssignment: vi.fn(),
  unassign: vi.fn(),
};

const mockTasksRepo = {
  findById: vi.fn(),
};

const mockWorkspacesRepo = {
  findById: vi.fn(),
  findMember: vi.fn(),
};

const mockTasksService = {
  recalculateStatus: vi.fn(),
};

const mockNotifRepo = {
  create: vi.fn(),
};

let service: StepsService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new StepsService(
    mockRepo as any,
    mockTasksRepo as any,
    mockWorkspacesRepo as any,
    mockTasksService as any,
    undefined, // activityRepo
    mockNotifRepo as any,
  );
});

// ─── createStep — validação de prazo ─────────────────────────────────────────

describe("createStep — validação de prazo", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockRepo.findLastOrder.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(makeStep());
  });

  it("deve lançar BadRequestError STEP_DEADLINE_EXCEEDS_TASK quando prazo do passo > prazo da tarefa", async () => {
    const taskDeadline = new Date("2026-05-01");
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, deadline: taskDeadline });
    mockTasksRepo.findById.mockResolvedValue(task);

    await expect(
      service.createStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
        title: "Passo",
        deadline: "2026-06-01", // depois da tarefa
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(
      service.createStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
        title: "Passo",
        deadline: "2026-06-01",
      }),
    ).rejects.toMatchObject({ code: "STEP_DEADLINE_EXCEEDS_TASK" });
  });

  it("deve aceitar quando prazo do passo é anterior ao prazo da tarefa", async () => {
    const taskDeadline = new Date("2026-05-01");
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, deadline: taskDeadline });
    mockTasksRepo.findById.mockResolvedValue(task);

    await expect(
      service.createStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
        title: "Passo",
        deadline: "2026-04-01", // antes da tarefa
      }),
    ).resolves.not.toThrow();
  });

  it("deve aceitar quando a tarefa não tem prazo definido", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, deadline: null });
    mockTasksRepo.findById.mockResolvedValue(task);

    await expect(
      service.createStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
        title: "Passo",
        deadline: "2026-12-31",
      }),
    ).resolves.not.toThrow();
  });

  it("deve atribuir order = último order + 1", async () => {
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, deadline: null });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findLastOrder.mockResolvedValue({ order: 3 });
    mockRepo.create.mockResolvedValue(makeStep({ order: 4 }));

    await service.createStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { title: "Passo" });

    const criado = mockRepo.create.mock.calls[0][0];
    expect(criado.order).toBe(4);
  });
});

// ─── createStep — recalculate task status ────────────────────────────────────

describe("createStep — recalcula status da tarefa", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  it("deve chamar tasksService.recalculateStatus após criar o passo", async () => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, status: "DONE" });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findLastOrder.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(makeStep({ task_id: TASK_ID, order: 1 }));
    mockTasksService.recalculateStatus.mockResolvedValue(undefined);

    await service.createStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, { title: "Novo passo" });

    expect(mockTasksService.recalculateStatus).toHaveBeenCalledWith(TASK_ID);
  });
});

// ─── updateStep — validação de prazo ─────────────────────────────────────────

describe("updateStep — validação de prazo", () => {
  it("deve lançar BadRequestError quando novo prazo do passo > prazo da tarefa", async () => {
    const USER_ID = "user-1";
    const TASK_ID = "task-1";
    const STEP_ID = "step-1";
    const workspace = makeWorkspace({ owner_id: USER_ID });
    const taskDeadline = new Date("2026-05-01");
    const task = makeTask({ id: TASK_ID, project_id: "proj-1", deadline: taskDeadline });
    const step = makeStep({ id: STEP_ID, task_id: TASK_ID });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findById.mockResolvedValue(step);

    await expect(
      service.updateStep("ws-1", "proj-1", TASK_ID, STEP_ID, USER_ID, {
        deadline: "2026-06-01",
      }),
    ).rejects.toMatchObject({ code: "STEP_DEADLINE_EXCEEDS_TASK" });
  });
});

// ─── updateStatus — recalculate e permissão ──────────────────────────────────

describe("updateStatus", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const STEP_ID = "step-1";
  const USER_ID = "user-1";

  it("deve chamar tasksService.recalculateStatus após alterar o status", async () => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    const step = makeStep({ id: STEP_ID, task_id: TASK_ID });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findById.mockResolvedValue(step);
    mockRepo.findActiveAssignment.mockResolvedValue({ id: "assign-1" });
    mockRepo.updateStatus.mockResolvedValue({ ...step, status: "DONE" });
    mockTasksService.recalculateStatus.mockResolvedValue(undefined);

    await service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, "DONE");

    expect(mockTasksService.recalculateStatus).toHaveBeenCalledWith(TASK_ID);
  });

  it("deve lançar ForbiddenError se membro não está atribuído ao passo e não é admin/owner", async () => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "outro-user" });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    const step = makeStep({ id: STEP_ID, task_id: TASK_ID });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findById.mockResolvedValue(step);
    mockRepo.findActiveAssignment.mockResolvedValue(null); // não atribuído

    await expect(
      service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, "DONE"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve permitir que admin altere status sem estar atribuído", async () => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "outro-user" });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    const step = makeStep({ id: STEP_ID, task_id: TASK_ID });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findById.mockResolvedValue(step);
    mockRepo.updateStatus.mockResolvedValue({ ...step, status: "IN_PROGRESS" });
    mockTasksService.recalculateStatus.mockResolvedValue(undefined);

    await expect(
      service.updateStatus(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, "IN_PROGRESS"),
    ).resolves.not.toThrow();

    // Admin não checa assignment
    expect(mockRepo.findActiveAssignment).not.toHaveBeenCalled();
  });
});

// ─── deleteStep — reordenação ─────────────────────────────────────────────────

describe("deleteStep — reordenação dos passos restantes", () => {
  it("deve reordenar os passos restantes após o soft delete", async () => {
    const USER_ID = "user-1";
    const TASK_ID = "task-1";
    const STEP_ID = "step-2";
    const workspace = makeWorkspace({ owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: "proj-1" });
    const step = makeStep({ id: STEP_ID, task_id: TASK_ID });

    // Passos restantes após deletar step-2
    const restantes = [
      makeStep({ id: "step-1", task_id: TASK_ID, order: 1 }),
      makeStep({ id: "step-3", task_id: TASK_ID, order: 3 }),
      makeStep({ id: "step-4", task_id: TASK_ID, order: 4 }),
    ];

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findById.mockResolvedValue(step);
    mockRepo.softDelete.mockResolvedValue(undefined);
    mockRepo.findByTask.mockResolvedValue(restantes);
    mockRepo.update.mockResolvedValue(undefined);

    await service.deleteStep("ws-1", "proj-1", TASK_ID, STEP_ID, USER_ID);

    // Deve ter chamado update para reordenar os 3 passos restantes
    expect(mockRepo.update).toHaveBeenCalledTimes(3);
    expect(mockRepo.update).toHaveBeenCalledWith("step-1", { order: 1 });
    expect(mockRepo.update).toHaveBeenCalledWith("step-3", { order: 2 });
    expect(mockRepo.update).toHaveBeenCalledWith("step-4", { order: 3 });
  });
});

// ─── assignMember ─────────────────────────────────────────────────────────────

describe("assignMember", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const STEP_ID = "step-1";
  const USER_ID = "user-1";
  const TARGET_USER_ID = "user-2";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    const step = makeStep({ id: STEP_ID, task_id: TASK_ID });

    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findById.mockResolvedValue(step);
  });

  it("deve lançar BadRequestError USER_NOT_MEMBER se o usuário alvo não é membro do workspace", async () => {
    // findMember retorna null para o targetUser
    mockWorkspacesRepo.findMember
      .mockResolvedValueOnce({ role: "ADMIN" }) // chamador (requireAdminOrOwner)
      .mockResolvedValueOnce(null); // targetUser

    await expect(
      service.assignMember(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, TARGET_USER_ID),
    ).rejects.toMatchObject({ code: "USER_NOT_MEMBER" });
  });

  it("deve lançar ConflictError ALREADY_ASSIGNED se o membro já está atribuído", async () => {
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findActiveAssignment.mockResolvedValue({ id: "existing-assign" });

    await expect(
      service.assignMember(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, TARGET_USER_ID),
    ).rejects.toMatchObject({ code: "ALREADY_ASSIGNED" });
  });

  it("deve criar a atribuição quando tudo está correto", async () => {
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findActiveAssignment.mockResolvedValue(null);
    mockRepo.createAssignment.mockResolvedValue(undefined);

    await service.assignMember(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, TARGET_USER_ID);

    expect(mockRepo.createAssignment).toHaveBeenCalledWith({
      step_id: STEP_ID,
      user_id: TARGET_USER_ID,
      assigned_by: USER_ID,
    });
  });

  it("deve criar notificação STEP_ASSIGNED para o usuário atribuído", async () => {
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findActiveAssignment.mockResolvedValue(null);
    mockRepo.createAssignment.mockResolvedValue(undefined);
    mockNotifRepo.create.mockResolvedValue(undefined);

    await service.assignMember(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, TARGET_USER_ID);

    expect(mockNotifRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: TARGET_USER_ID,
        type: "STEP_ASSIGNED",
      }),
    );
  });

  it("não deve falhar se a notificação lançar erro (falha silenciosa)", async () => {
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
    mockRepo.findActiveAssignment.mockResolvedValue(null);
    mockRepo.createAssignment.mockResolvedValue(undefined);
    mockNotifRepo.create.mockRejectedValue(new Error("DB error"));

    await expect(
      service.assignMember(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID, TARGET_USER_ID),
    ).resolves.not.toThrow();
  });
});

// ─── createStep — log de atividade ───────────────────────────────────────────

describe("createStep — log de atividade", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const USER_ID = "user-1";

  it("deve criar log STEP_CREATED com task_id quando activityRepo está disponível", async () => {
    const mockActivityRepo = { createLog: vi.fn().mockResolvedValue(undefined) };
    const serviceComActivity = new StepsService(
      mockRepo as any,
      mockTasksRepo as any,
      mockWorkspacesRepo as any,
      mockTasksService as any,
      mockActivityRepo as any,
      mockNotifRepo as any,
    );

    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID, deadline: null });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findLastOrder.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(makeStep({ task_id: TASK_ID }));
    mockTasksService.recalculateStatus.mockResolvedValue(undefined);

    await serviceComActivity.createStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, USER_ID, {
      title: "Novo passo",
    });

    expect(mockActivityRepo.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: WORKSPACE_ID,
        user_id: USER_ID,
        action: "STEP_CREATED",
        task_id: TASK_ID,
      }),
    );
  });
});

// ─── deleteStep — log de atividade ───────────────────────────────────────────

describe("deleteStep — log de atividade", () => {
  const WORKSPACE_ID = "ws-1";
  const PROJECT_ID = "proj-1";
  const TASK_ID = "task-1";
  const STEP_ID = "step-1";
  const USER_ID = "user-1";

  it("deve criar log STEP_DELETED com task_id quando activityRepo está disponível", async () => {
    const mockActivityRepo = { createLog: vi.fn().mockResolvedValue(undefined) };
    const serviceComActivity = new StepsService(
      mockRepo as any,
      mockTasksRepo as any,
      mockWorkspacesRepo as any,
      mockTasksService as any,
      mockActivityRepo as any,
      mockNotifRepo as any,
    );

    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: USER_ID });
    const task = makeTask({ id: TASK_ID, project_id: PROJECT_ID });
    const step = makeStep({ id: STEP_ID, task_id: TASK_ID });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "ADMIN" });
    mockTasksRepo.findById.mockResolvedValue(task);
    mockRepo.findById.mockResolvedValue(step);
    mockRepo.softDelete.mockResolvedValue(undefined);
    mockRepo.findByTask.mockResolvedValue([]);

    await serviceComActivity.deleteStep(WORKSPACE_ID, PROJECT_ID, TASK_ID, STEP_ID, USER_ID);

    expect(mockActivityRepo.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: WORKSPACE_ID,
        user_id: USER_ID,
        action: "STEP_DELETED",
        task_id: TASK_ID,
      }),
    );
  });
});

// ─── listAssignedToMe ─────────────────────────────────────────────────────────

describe("listAssignedToMe", () => {
  const WORKSPACE_ID = "ws-1";
  const USER_ID = "user-1";

  beforeEach(() => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "owner-1" });
    mockWorkspacesRepo.findById.mockResolvedValue(workspace);
    mockWorkspacesRepo.findMember.mockResolvedValue({ role: "MEMBER" });
  });

  it("deve lançar ForbiddenError quando usuário não é membro", async () => {
    mockWorkspacesRepo.findMember.mockResolvedValue(null);

    await expect(service.listAssignedToMe(WORKSPACE_ID, USER_ID)).rejects.toThrow(ForbiddenError);
  });

  it("retorna passos atribuídos ao usuário no workspace", async () => {
    const steps = [makeStep({ id: "s-1" }), makeStep({ id: "s-2" })];
    mockRepo.findAssignedToUser.mockResolvedValue(steps);

    const result = await service.listAssignedToMe(WORKSPACE_ID, USER_ID);

    expect(mockRepo.findAssignedToUser).toHaveBeenCalledWith(WORKSPACE_ID, USER_ID);
    expect(result.steps).toEqual(steps);
  });

  it("retorna lista vazia quando não há passos atribuídos", async () => {
    mockRepo.findAssignedToUser.mockResolvedValue([]);

    const result = await service.listAssignedToMe(WORKSPACE_ID, USER_ID);

    expect(result.steps).toEqual([]);
  });
});
