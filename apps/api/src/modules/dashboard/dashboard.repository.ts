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

  async getProjectCompletion(workspaceId: string) {
    const projects = await prisma.project.findMany({
      where: { workspace_id: workspaceId, deleted_at: null, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        tasks: {
          where: { deleted_at: null },
          select: { status: true },
        },
      },
    });

    return projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      return {
        project_id: p.id,
        project_name: p.name,
        total,
        done,
        rate: total === 0 ? 0 : Math.round((done / total) * 100),
      };
    });
  }

  async getMemberWorkload(workspaceId: string) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
    });

    // Contagem de tarefas abertas por assignee
    const taskCounts = await prisma.task.groupBy({
      by: ["assignee_id"],
      where: {
        project: { workspace_id: workspaceId },
        deleted_at: null,
        status: { not: "DONE" },
        assignee_id: { not: null },
      },
      _count: { id: true },
    });

    const taskCountMap = new Map(
      taskCounts.map((r) => [r.assignee_id as string, r._count.id]),
    );

    return members
      .map((m) => ({
        user_id: m.user_id,
        user_name: m.user.name,
        avatar_url: m.user.avatar_url,
        open_tasks: taskCountMap.get(m.user_id) ?? 0,
      }))
      .sort((a, b) => b.open_tasks - a.open_tasks);
  }
}
