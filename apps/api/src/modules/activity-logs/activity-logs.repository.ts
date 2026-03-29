import { prisma } from "../../lib/prisma.js";

export class ActivityLogsRepository {
  async findByWorkspace(
    workspaceId: string,
    options: { cursor?: string; limit: number },
  ) {
    const { cursor, limit } = options;

    return prisma.activityLog.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
    });
  }

  async createLog(data: {
    workspace_id: string;
    user_id: string;
    action: string;
    task_id?: string | null;
    metadata?: object;
  }) {
    return prisma.activityLog.create({
      data: {
        workspace_id: data.workspace_id,
        user_id: data.user_id,
        action: data.action as any,
        task_id: data.task_id ?? null,
        metadata: data.metadata ?? {},
      },
    });
  }

  async findByTask(
    workspaceId: string,
    taskId: string,
    options: { cursor?: string; limit: number },
  ) {
    const { cursor, limit } = options;

    return prisma.activityLog.findMany({
      where: { workspace_id: workspaceId, task_id: taskId },
      orderBy: { created_at: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
    });
  }
}
