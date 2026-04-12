import { type ActivityAction } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export class ActivityLogsRepository {
  async findByWorkspace(
    workspaceId: string,
    options: {
      cursor?: string;
      limit: number;
      user_id?: string;
      action?: ActivityAction;
      from?: string;
      to?: string;
    },
  ) {
    const { cursor, limit, user_id, action, from, to } = options;

    return prisma.activityLog.findMany({
      where: {
        workspace_id: workspaceId,
        ...(user_id ? { user_id } : {}),
        ...(action ? { action } : {}),
        ...(from || to
          ? {
              created_at: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
    });
  }

  async findByProject(
    workspaceId: string,
    projectId: string,
    options: { cursor?: string; limit: number },
  ) {
    const { cursor, limit } = options;

    return prisma.activityLog.findMany({
      where: {
        workspace_id: workspaceId,
        task: { project_id: projectId },
      },
      orderBy: { created_at: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
    });
  }

  async createLog(data: {
    workspace_id?: string | null;
    user_id: string;
    action: ActivityAction;
    task_id?: string | null;
    metadata?: object;
  }) {
    return prisma.activityLog.create({
      data: {
        workspace_id: data.workspace_id ?? null,
        user_id: data.user_id,
        action: data.action,
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
