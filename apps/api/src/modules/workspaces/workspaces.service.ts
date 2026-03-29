import { generateSlug, generateUniqueSlug } from "@flowmanager/shared";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors/index.js";
import type { WorkspacesRepository } from "./workspaces.repository.js";
import type { ActivityLogsRepository } from "../activity-logs/activity-logs.repository.js";

export class WorkspacesService {
  constructor(
    private repo: WorkspacesRepository,
    private activityRepo?: ActivityLogsRepository,
  ) {}

  async createWorkspace(
    userId: string,
    data: { name: string; description?: string | null; color?: string | null },
  ) {
    const base = generateSlug(data.name);
    const existingSlugs = await this.repo.findSlugsByBase(base);
    const slug = generateUniqueSlug(data.name, existingSlugs);

    const workspace = await this.repo.create({
      name: data.name,
      slug,
      description: data.description ?? null,
      color: data.color ?? null,
      owner_id: userId,
    });

    await this.repo.createMember({ workspace_id: workspace.id, user_id: userId, role: "ADMIN" });

    return { workspace };
  }

  async listWorkspaces(userId: string) {
    const workspaces = await this.repo.findByUserId(userId);
    return { workspaces };
  }

  async getWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.repo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    const member = await this.repo.findMember(workspaceId, userId);
    if (!member) throw new ForbiddenError("Acesso negado ao workspace");

    return { workspace };
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: { name?: string; description?: string | null; color?: string | null },
  ) {
    const workspace = await this.repo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    if (workspace.owner_id !== userId) throw new ForbiddenError("Apenas o dono pode editar o workspace");

    const updated = await this.repo.update(workspaceId, data);
    return { workspace: updated };
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.repo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    if (workspace.owner_id !== userId) throw new ForbiddenError("Apenas o dono pode deletar o workspace");

    // Cascade soft delete (projetos → tarefas → passos)
    await this.repo.softDeleteStepsByWorkspace(workspaceId);
    await this.repo.softDeleteTasksByWorkspace(workspaceId);
    await this.repo.softDeleteProjectsByWorkspace(workspaceId);

    // Delete imediato de membros e convites
    await this.repo.deleteAllMembers(workspaceId);
    await this.repo.deleteAllInvitations(workspaceId);

    await this.repo.softDelete(workspaceId);
  }

  async listMembers(workspaceId: string, userId: string) {
    const workspace = await this.repo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    const member = await this.repo.findMember(workspaceId, userId);
    if (!member) throw new ForbiddenError("Acesso negado ao workspace");

    const members = await this.repo.findAllMembers(workspaceId);
    return { members };
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    targetUserId: string,
    role: "ADMIN" | "MEMBER",
  ) {
    const workspace = await this.repo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    if (workspace.owner_id !== userId) throw new ForbiddenError("Apenas o dono pode alterar roles");

    const target = await this.repo.findMember(workspaceId, targetUserId);
    if (!target) throw new NotFoundError("Membro não encontrado");

    const oldRole = target.role;
    await this.repo.updateMember(workspaceId, targetUserId, { role });

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "MEMBER_ROLE_CHANGED",
      metadata: { from: oldRole, to: role },
    });

    return {};
  }

  async removeMember(workspaceId: string, userId: string, targetUserId: string) {
    const workspace = await this.repo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    if (workspace.owner_id !== userId) throw new ForbiddenError("Apenas o dono pode remover membros");

    if (targetUserId === workspace.owner_id) {
      throw new ForbiddenError("O dono não pode ser removido do workspace");
    }

    await this.repo.deleteMember(workspaceId, targetUserId);
  }

  async transferOwnership(workspaceId: string, userId: string, newOwnerId: string) {
    const workspace = await this.repo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    if (workspace.owner_id !== userId) throw new ForbiddenError("Apenas o dono pode transferir o workspace");

    const newOwnerMember = await this.repo.findMember(workspaceId, newOwnerId);
    if (!newOwnerMember) throw new NotFoundError("Novo dono não é membro do workspace");

    if (newOwnerMember.role !== "ADMIN") {
      throw new BadRequestError("O novo dono precisa ser admin do workspace", "NOT_AN_ADMIN");
    }

    const updated = await this.repo.update(workspaceId, { owner_id: newOwnerId });
    return { workspace: updated };
  }
}
