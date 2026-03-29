import { prisma } from "../../lib/prisma.js";

export class DashboardRepository {
  async getTaskCounts(workspaceId: string) {
    const tasks = await prisma.task.groupBy({
      by: ["status"],
      where: { project: { workspace_id: workspaceId }, deleted_at: null },
      _count: { status: true },
    });

    const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const row of tasks) {
      counts[row.status] = row._count.status;
    }

    return counts;
  }

  async getOverdueCount(workspaceId: string) {
    return prisma.task.count({
      where: {
        project: { workspace_id: workspaceId },
        deleted_at: null,
        deadline: { lt: new Date() },
        status: { not: "DONE" },
      },
    });
  }

  async getMembersCount(workspaceId: string) {
    return prisma.workspaceMember.count({ where: { workspace_id: workspaceId } });
  }

  async getRecentTasks(workspaceId: string, limit = 5) {
    return prisma.task.findMany({
      where: { project: { workspace_id: workspaceId }, deleted_at: null },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        deadline: true,
        created_at: true,
      },
    });
  }
}
