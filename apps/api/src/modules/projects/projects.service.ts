import { generateSlug, generateUniqueSlug } from "@flowmanager/shared";
import { NotFoundError } from "../../errors/index.js";
import { WorkspaceGuard } from "../../lib/workspace-guard.js";
import type { ProjectsRepository } from "./projects.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

export class ProjectsService {
  private guard: WorkspaceGuard;

  constructor(
    private repo: ProjectsRepository,
    private workspacesRepo: WorkspacesRepository,
  ) {
    this.guard = new WorkspaceGuard(workspacesRepo);
  }

  async createProject(
    workspaceId: string,
    userId: string,
    data: { name: string; description?: string | null; color?: string | null; deadline?: string | null },
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const base = generateSlug(data.name);
    const existingSlugs = await this.repo.findSlugsByBase(workspaceId, base);
    const slug = generateUniqueSlug(data.name, existingSlugs);

    const project = await this.repo.create({
      workspace_id: workspaceId,
      name: data.name,
      slug,
      description: data.description ?? null,
      color: data.color ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      created_by: userId,
    });

    return { project };
  }

  async listProjects(workspaceId: string, userId: string) {
    await this.guard.requireMember(workspaceId, userId);
    const projects = await this.repo.findByWorkspace(workspaceId, "ACTIVE");
    return { projects };
  }

  async listArchivedProjects(workspaceId: string, userId: string) {
    await this.guard.requireMember(workspaceId, userId);
    const projects = await this.repo.findByWorkspace(workspaceId, "ARCHIVED");
    return { projects };
  }

  async getProject(workspaceId: string, projectId: string, userId: string) {
    await this.guard.requireMember(workspaceId, userId);

    const project = await this.repo.findById(projectId);
    if (!project || project.workspace_id !== workspaceId) throw new NotFoundError("Projeto não encontrado");

    return { project };
  }

  async updateProject(
    workspaceId: string,
    projectId: string,
    userId: string,
    data: { name?: string; description?: string | null; color?: string | null; deadline?: string | null },
  ) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const project = await this.repo.findById(projectId);
    if (!project || project.workspace_id !== workspaceId) throw new NotFoundError("Projeto não encontrado");

    const updated = await this.repo.update(projectId, {
      ...data,
      deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
    });

    return { project: updated };
  }

  async archiveProject(workspaceId: string, projectId: string, userId: string) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const project = await this.repo.findById(projectId);
    if (!project || project.workspace_id !== workspaceId) throw new NotFoundError("Projeto não encontrado");

    const updated = await this.repo.update(projectId, { status: "ARCHIVED", archived_at: new Date() });
    return { project: updated };
  }

  async unarchiveProject(workspaceId: string, projectId: string, userId: string) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const project = await this.repo.findById(projectId);
    if (!project || project.workspace_id !== workspaceId) throw new NotFoundError("Projeto não encontrado");

    const updated = await this.repo.update(projectId, { status: "ACTIVE", archived_at: null });
    return { project: updated };
  }

  async deleteProject(workspaceId: string, projectId: string, userId: string) {
    await this.guard.requireOwner(workspaceId, userId);

    const project = await this.repo.findById(projectId);
    if (!project || project.workspace_id !== workspaceId) throw new NotFoundError("Projeto não encontrado");

    await this.repo.softDelete(projectId);
  }
}
