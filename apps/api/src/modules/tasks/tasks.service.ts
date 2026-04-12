import { type Priority, type TaskStatus } from "@prisma/client";
import { BadRequestError, ConflictError, NotFoundError } from "../../errors/index.js";
import { sendEmail } from "../../lib/resend.js";
import { env } from "../../config/env.js";
import { WorkspaceGuard } from "../../lib/workspace-guard.js";
import type { TasksRepository } from "./tasks.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";
import type { ActivityLogsRepository } from "../activity-logs/activity-logs.repository.js";
import type { NotificationsRepository } from "../notifications/notifications.repository.js";

export class TasksService {
  private guard: WorkspaceGuard;

  constructor(
    private repo: TasksRepository,
    private workspacesRepo: WorkspacesRepository,
    private activityRepo?: ActivityLogsRepository,
    private notifRepo?: NotificationsRepository,
  ) {
    this.guard = new WorkspaceGuard(workspacesRepo);
  }

  async createTask(
    workspaceId: string,
    projectId: string,
    userId: string,
    data: { title: string; priority: Priority; description?: string | null; deadline?: string | null },
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const last = await this.repo.findLastNumber(projectId);
    const number = (last?.number ?? 0) + 1;

    const lastOrder = await this.repo.findLastOrder(projectId);
    const order = (lastOrder?.order ?? 0) + 1;

    const task = await this.repo.create({
      project_id: projectId,
      title: data.title,
      number,
      order,
      priority: data.priority,
      description: data.description ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      created_by: userId,
    });

    return { task };
  }

  async listTasks(
    workspaceId: string,
    projectId: string,
    userId: string,
    filters: { status?: TaskStatus; priority?: Priority; label_id?: string },
  ) {
    await this.guard.requireMember(workspaceId, userId);
    const tasks = await this.repo.findByProject(projectId, filters);
    return { tasks };
  }

  async getTask(workspaceId: string, projectId: string, taskId: string, userId: string) {
    await this.guard.requireMember(workspaceId, userId);

    const task = await this.repo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const watcher = await this.repo.findWatcher(taskId, userId);
    return { task, is_watching: !!watcher };
  }

  async updateTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    data: { title?: string; description?: string | null; priority?: Priority; deadline?: string | null },
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const task = await this.repo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const updated = await this.repo.update(taskId, {
      ...data,
      deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
    });

    if (data.priority && data.priority !== task.priority) {
      await this.activityRepo?.createLog({
        workspace_id: workspaceId,
        user_id: userId,
        action: "TASK_PRIORITY_CHANGED",
        task_id: taskId,
        metadata: { from: task.priority, to: data.priority },
      });
    }

    if (data.deadline) {
      const newDeadline = new Date(data.deadline);
      const affectedSteps = await this.repo.findStepsExceedingDeadline(taskId, newDeadline);
      if (affectedSteps.length > 0) {
        return { task: updated, warnings: ["STEPS_DEADLINE_EXCEEDED"] as string[] };
      }
    }

    return { task: updated };
  }

  async updateStatus(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    status: TaskStatus,
  ) {
    const { workspace } = await this.guard.requireAdminOrOwner(workspaceId, userId);

    const task = await this.repo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const updated = await this.repo.update(taskId, {
      status,
      status_is_manual: true,
      status_overridden_by: userId,
      status_overridden_at: new Date(),
    });

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "TASK_STATUS_CHANGED",
      task_id: taskId,
      metadata: { from: task.status, to: status, is_manual: true },
    });

    await this.notifyWatchers(task, status, workspace, taskId, projectId, workspaceId);

    return { task: updated };
  }

  async reorderTasks(
    workspaceId: string,
    projectId: string,
    userId: string,
    order: string[],
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    await Promise.all(
      order.map((taskId, index) => this.repo.updateOrder(taskId, index + 1)),
    );

    return {};
  }

  async assignTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    targetUserId: string | null,
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const task = await this.repo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    if (targetUserId !== null) {
      const targetMember = await this.workspacesRepo.findMember(workspaceId, targetUserId);
      if (!targetMember) throw new BadRequestError("Usuário não é membro do workspace", "USER_NOT_MEMBER");
    }

    const updated = await this.repo.update(taskId, { assignee_id: targetUserId });
    return { task: updated };
  }

  async watchTask(workspaceId: string, projectId: string, taskId: string, userId: string) {
    await this.guard.requireMember(workspaceId, userId);

    const task = await this.repo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const existing = await this.repo.findWatcher(taskId, userId);
    if (existing) throw new ConflictError("ALREADY_WATCHING", "Você já está seguindo esta tarefa");

    await this.repo.createWatcher(taskId, userId);
  }

  async unwatchTask(workspaceId: string, projectId: string, taskId: string, userId: string) {
    await this.guard.requireMember(workspaceId, userId);

    const task = await this.repo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    await this.repo.deleteWatcher(taskId, userId);
  }

  async deleteTask(workspaceId: string, projectId: string, taskId: string, userId: string) {
    await this.guard.requireOwner(workspaceId, userId);

    const task = await this.repo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    await this.repo.softDelete(taskId);
  }

  private async notifyWatchers(
    task: { id: string; title: string; status: string },
    newStatus: string,
    workspace: { name: string },
    taskId: string,
    projectId: string,
    workspaceId: string,
  ): Promise<void> {
    const watchers = await this.repo.findWatchers(taskId);
    for (const watcher of watchers) {
      try {
        const notif = await this.notifRepo?.create({
          user_id: watcher.user_id,
          type: "TASK_STATUS_CHANGED",
          title: "Status da tarefa alterado",
          body: `"${task.title}" mudou de ${task.status} para ${newStatus}`,
          entity_type: "task",
          entity_id: taskId,
        });

        if (notif?.id && watcher.user?.email) {
          try {
            await sendEmail({
              to: watcher.user.email,
              subject: `Status da tarefa "${task.title}" foi alterado`,
              template: "task-status-changed",
              data: {
                user_name: watcher.user.name,
                task_title: task.title,
                from_status: task.status,
                to_status: newStatus,
                workspace_name: workspace.name,
                task_url: `${env.FRONTEND_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
              },
            });
            await this.notifRepo?.markAsSent(notif.id);
          } catch {
            // Email falhou — retry job irá tentar novamente (sent_at permanece null)
          }
        }
      } catch {
        // Criação da notificação falhou — continuar silenciosamente
      }
    }
  }

  // Called by steps service after a step status changes
  async recalculateStatus(taskId: string) {
    const task = await this.repo.findById(taskId);
    if (!task || task.status_is_manual) return;

    const steps = await this.repo.findStepsByTask(taskId);
    if (steps.length === 0) return;

    const allDone = steps.every((s) => s.status === "DONE");
    const newStatus = allDone ? "DONE" : "IN_PROGRESS";

    if (task.status !== newStatus) {
      await this.repo.update(taskId, { status: newStatus });
    }
  }
}
