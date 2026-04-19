import { prisma } from "../../lib/prisma.js";

export class ProjectsRepository {
  async create(data: {
    workspace_id: string;
    name: string;
    slug: string;
    description?: string | null;
    color?: string | null;
    deadline?: Date | null;
    created_by: string;
  }) {
    return prisma.project.create({ data });
  }

  async findById(id: string) {
    return prisma.project.findFirst({ where: { id, deleted_at: null } });
  }

  async findByWorkspace(workspaceId: string, status: "ACTIVE" | "ARCHIVED") {
    return prisma.project.findMany({
      where: { workspace_id: workspaceId, status, deleted_at: null },
      orderBy: { created_at: "asc" },
    });
  }

  async findSlugsByBase(workspaceId: string, base: string) {
    const projects = await prisma.project.findMany({
      where: { workspace_id: workspaceId, slug: { startsWith: base }, deleted_at: null },
      select: { slug: true },
    });
    return projects.map((p) => p.slug);
  }

  async update(id: string, data: {
    name?: string;
    description?: string | null;
    color?: string | null;
    deadline?: Date | null;
    status?: "ACTIVE" | "ARCHIVED";
    archived_at?: Date | null;
  }) {
    return prisma.project.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.project.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async softDeleteByWorkspace(workspaceId: string) {
    return prisma.project.updateMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }
}
