import { BadRequestError, ConflictError, NotFoundError } from "../../errors/index.js";
import { WorkspaceGuard } from "../../lib/workspace-guard.js";
import type { LabelsRepository } from "./labels.repository.js";
import type { TasksRepository } from "../tasks/tasks.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

export class LabelsService {
  private guard: WorkspaceGuard;

  constructor(
    private repo: LabelsRepository,
    private tasksRepo: TasksRepository,
    private workspacesRepo: WorkspacesRepository,
  ) {
    this.guard = new WorkspaceGuard(workspacesRepo);
  }

  async createLabel(workspaceId: string, userId: string, data: { name: string; color: string }) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const existing = await this.repo.findByNameInWorkspace(workspaceId, data.name);
    if (existing) throw new ConflictError("LABEL_ALREADY_EXISTS", "Label com esse nome já existe no workspace");

    const label = await this.repo.create({ workspace_id: workspaceId, ...data, created_by: userId });
    return { label };
  }

  async listLabels(workspaceId: string, userId: string) {
    await this.guard.requireMember(workspaceId, userId);

    const labels = await this.repo.findByWorkspace(workspaceId);
    return { labels };
  }

  async updateLabel(
    workspaceId: string,
    labelId: string,
    userId: string,
    data: { name?: string; color?: string },
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const label = await this.repo.findById(labelId);
    if (!label || label.workspace_id !== workspaceId) throw new NotFoundError("Label não encontrada");

    if (data.name) {
      const existing = await this.repo.findByNameInWorkspace(workspaceId, data.name);
      if (existing && existing.id !== labelId) {
        throw new ConflictError("LABEL_ALREADY_EXISTS", "Label com esse nome já existe no workspace");
      }
    }

    const updated = await this.repo.update(labelId, data);
    return { label: updated };
  }

  async deleteLabel(workspaceId: string, labelId: string, userId: string) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const label = await this.repo.findById(labelId);
    if (!label || label.workspace_id !== workspaceId) throw new NotFoundError("Label não encontrada");

    await this.repo.softDelete(labelId);
  }

  async applyLabel(
    workspaceId: string,
    projectId: string,
    taskId: string,
    labelId: string,
    userId: string,
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const label = await this.repo.findById(labelId);
    if (!label || label.workspace_id !== workspaceId) {
      throw new BadRequestError("Label não pertence a este workspace", "LABEL_WRONG_WORKSPACE");
    }

    const existing = await this.repo.findTaskLabel(taskId, labelId);
    if (existing) throw new ConflictError("LABEL_ALREADY_APPLIED", "Label já aplicada a esta tarefa");

    await this.repo.createTaskLabel(taskId, labelId);
  }

  async removeLabel(
    workspaceId: string,
    projectId: string,
    taskId: string,
    labelId: string,
    userId: string,
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const existing = await this.repo.findTaskLabel(taskId, labelId);
    if (!existing) throw new NotFoundError("Label não estava aplicada a esta tarefa");

    await this.repo.deleteTaskLabel(taskId, labelId);
  }
}
