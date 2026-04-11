import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../errors/index.js";
import type { StepsRepository } from "./steps.repository.js";
import type { TasksRepository } from "../tasks/tasks.repository.js";
import type { TasksService } from "../tasks/tasks.service.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";
import type { ActivityLogsRepository } from "../activity-logs/activity-logs.repository.js";
import type { NotificationsRepository } from "../notifications/notifications.repository.js";

export class StepsService {
  constructor(
    private repo: StepsRepository,
    private tasksRepo: TasksRepository,
    private workspacesRepo: WorkspacesRepository,
    private tasksService: TasksService,
    private activityRepo?: ActivityLogsRepository,
    private notifRepo?: NotificationsRepository,
  ) {}

  private async requireMember(workspaceId: string, userId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    const member = await this.workspacesRepo.findMember(workspaceId, userId);
    if (!member) throw new ForbiddenError("Acesso negado ao workspace");

    return { workspace, member };
  }

  private async requireAdminOrOwner(workspaceId: string, userId: string) {
    const { workspace, member } = await this.requireMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;
    const isAdmin = member.role === "ADMIN";
    if (!isOwner && !isAdmin) throw new ForbiddenError("Apenas admins podem realizar esta ação");
    return { workspace };
  }

  async createStep(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    data: { title: string; deadline?: string | null },
  ) {
    await this.requireAdminOrOwner(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    if (data.deadline && task.deadline) {
      const stepDeadline = new Date(data.deadline);
      if (stepDeadline > task.deadline) {
        throw new BadRequestError("Prazo do passo não pode ser posterior ao da tarefa", "STEP_DEADLINE_EXCEEDS_TASK");
      }
    }

    const lastOrder = await this.repo.findLastOrder(taskId);
    const order = (lastOrder?.order ?? 0) + 1;

    const step = await this.repo.create({
      task_id: taskId,
      title: data.title,
      order,
      deadline: data.deadline ? new Date(data.deadline) : null,
      created_by: userId,
    });

    await this.tasksService.recalculateStatus(taskId);

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "STEP_CREATED",
      task_id: taskId,
    });

    return { step };
  }

  async listSteps(workspaceId: string, projectId: string, taskId: string, userId: string) {
    await this.requireMember(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const steps = await this.repo.findByTask(taskId);
    return { steps };
  }

  async updateStep(
    workspaceId: string,
    projectId: string,
    taskId: string,
    stepId: string,
    userId: string,
    data: { title?: string; description?: string | null; deadline?: string | null },
  ) {
    await this.requireAdminOrOwner(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const step = await this.repo.findById(stepId);
    if (!step || step.task_id !== taskId) throw new NotFoundError("Passo não encontrado");

    if (data.deadline && task.deadline) {
      const stepDeadline = new Date(data.deadline);
      if (stepDeadline > task.deadline) {
        throw new BadRequestError("Prazo do passo não pode ser posterior ao da tarefa", "STEP_DEADLINE_EXCEEDS_TASK");
      }
    }

    const updated = await this.repo.update(stepId, {
      ...data,
      deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
    });

    return { step: updated };
  }

  async updateStatus(
    workspaceId: string,
    projectId: string,
    taskId: string,
    stepId: string,
    userId: string,
    status: string,
  ) {
    const { workspace, member } = await this.requireMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;
    const isAdmin = member.role === "ADMIN";

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const step = await this.repo.findById(stepId);
    if (!step || step.task_id !== taskId) throw new NotFoundError("Passo não encontrado");

    if (!isOwner && !isAdmin) {
      const assignment = await this.repo.findActiveAssignment(stepId, userId);
      if (!assignment) throw new ForbiddenError("Apenas membros atribuídos podem alterar o status");
    }

    const updated = await this.repo.updateStatus(stepId, status);

    await this.tasksService.recalculateStatus(taskId);

    return { step: updated };
  }

  async assignMember(
    workspaceId: string,
    projectId: string,
    taskId: string,
    stepId: string,
    userId: string,
    targetUserId: string,
  ) {
    await this.requireAdminOrOwner(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const step = await this.repo.findById(stepId);
    if (!step || step.task_id !== taskId) throw new NotFoundError("Passo não encontrado");

    const targetMember = await this.workspacesRepo.findMember(workspaceId, targetUserId);
    if (!targetMember) throw new BadRequestError("Usuário não é membro do workspace", "USER_NOT_MEMBER");

    const existing = await this.repo.findActiveAssignment(stepId, targetUserId);
    if (existing) throw new ConflictError("ALREADY_ASSIGNED", "Membro já está atribuído a este passo");

    await this.repo.createAssignment({ step_id: stepId, user_id: targetUserId, assigned_by: userId });

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "STEP_ASSIGNED",
      task_id: taskId,
      metadata: { assigned_to: [targetUserId] },
    });

    this.notifRepo?.create({
      user_id: targetUserId,
      type: "STEP_ASSIGNED",
      title: "Passo atribuído",
      body: `Você foi atribuído ao passo "${step.title}"`,
      entity_type: "step",
      entity_id: stepId,
    })?.catch(() => {});
  }

  async unassignMember(
    workspaceId: string,
    projectId: string,
    taskId: string,
    stepId: string,
    userId: string,
    targetUserId: string,
  ) {
    await this.requireAdminOrOwner(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const step = await this.repo.findById(stepId);
    if (!step || step.task_id !== taskId) throw new NotFoundError("Passo não encontrado");

    await this.repo.unassign(stepId, targetUserId, userId);

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "STEP_UNASSIGNED",
      task_id: taskId,
      metadata: { unassigned_from: targetUserId },
    });
  }

  async reorderSteps(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    order: string[],
  ) {
    await this.requireAdminOrOwner(workspaceId, userId);

    await Promise.all(
      order.map((stepId, index) => this.repo.update(stepId, { order: index + 1 })),
    );
  }

  async listAssignedToMe(workspaceId: string, userId: string) {
    await this.requireMember(workspaceId, userId);
    const steps = await this.repo.findAssignedToUser(workspaceId, userId);
    return { steps };
  }

  async deleteStep(
    workspaceId: string,
    projectId: string,
    taskId: string,
    stepId: string,
    userId: string,
  ) {
    await this.requireAdminOrOwner(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const step = await this.repo.findById(stepId);
    if (!step || step.task_id !== taskId) throw new NotFoundError("Passo não encontrado");

    await this.repo.softDelete(stepId);

    const remaining = await this.repo.findByTask(taskId);
    await Promise.all(
      remaining.map((s, index) => this.repo.update(s.id, { order: index + 1 })),
    );

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "STEP_DELETED",
      task_id: taskId,
    });
  }
}
