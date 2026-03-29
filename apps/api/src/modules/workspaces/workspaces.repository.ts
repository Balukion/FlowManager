import { prisma } from "../../lib/prisma.js";

export class WorkspacesRepository {
  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    color?: string | null;
    owner_id: string;
  }) {
    return prisma.workspace.create({ data });
  }

  async findById(id: string) {
    return prisma.workspace.findFirst({ where: { id, deleted_at: null } });
  }

  async findByUserId(userId: string) {
    return prisma.workspace.findMany({
      where: {
        deleted_at: null,
        members: { some: { user_id: userId } },
      },
      orderBy: { created_at: "asc" },
    });
  }

  async findSlugsByBase(base: string) {
    const workspaces = await prisma.workspace.findMany({
      where: { slug: { startsWith: base }, deleted_at: null },
      select: { slug: true },
    });
    return workspaces.map((w) => w.slug);
  }

  async update(id: string, data: { name?: string; description?: string | null; color?: string | null; slug?: string; owner_id?: string }) {
    return prisma.workspace.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.workspace.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  // Members

  async findMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
    });
  }

  async findMemberWithUser(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
      include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });
  }

  async findAllMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
      orderBy: { joined_at: "asc" },
    });
  }

  async createMember(data: { workspace_id: string; user_id: string; role: "ADMIN" | "MEMBER" }) {
    return prisma.workspaceMember.create({ data: { ...data, joined_at: new Date() } });
  }

  async updateMember(workspaceId: string, userId: string, data: { role: "ADMIN" | "MEMBER" }) {
    return prisma.workspaceMember.update({
      where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
      data,
    });
  }

  async deleteMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.delete({
      where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
    });
  }

  async deleteAllMembers(workspaceId: string) {
    return prisma.workspaceMember.deleteMany({ where: { workspace_id: workspaceId } });
  }

  async deleteAllInvitations(workspaceId: string) {
    return prisma.invitation.deleteMany({ where: { workspace_id: workspaceId } });
  }

  // Cascade soft delete

  async softDeleteProjectsByWorkspace(workspaceId: string) {
    return prisma.project.updateMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }

  async softDeleteTasksByWorkspace(workspaceId: string) {
    return prisma.task.updateMany({
      where: { project: { workspace_id: workspaceId }, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }

  async softDeleteStepsByWorkspace(workspaceId: string) {
    return prisma.step.updateMany({
      where: { task: { project: { workspace_id: workspaceId } }, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }
}
