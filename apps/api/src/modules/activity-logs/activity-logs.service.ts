import { type ActivityAction } from "@prisma/client";
import { WorkspaceGuard } from "../../lib/workspace-guard.js";
import type { ActivityLogsRepository } from "./activity-logs.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ActivityLogsService {
  private guard: WorkspaceGuard;

  constructor(
    private repo: ActivityLogsRepository,
    private workspacesRepo: WorkspacesRepository,
  ) {
    this.guard = new WorkspaceGuard(workspacesRepo);
  }

  async listByWorkspace(
    workspaceId: string,
    userId: string,
    options: { cursor?: string; limit?: number; user_id?: string; action?: ActivityAction; from?: string; to?: string },
  ) {
    await this.guard.requireMemberOrOwner(workspaceId, userId);

    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const rows = await this.repo.findByWorkspace(workspaceId, {
      cursor: options.cursor,
      limit,
      user_id: options.user_id,
      action: options.action,
      from: options.from,
      to: options.to,
    });

    const hasMore = rows.length > limit;
    const logs = hasMore ? rows.slice(0, limit) : rows;
    const next_cursor = hasMore ? logs[logs.length - 1].id : undefined;

    return { data: { logs }, meta: { next_cursor } };
  }

  async listByProject(
    workspaceId: string,
    projectId: string,
    userId: string,
    options: { cursor?: string; limit?: number },
  ) {
    await this.guard.requireMemberOrOwner(workspaceId, userId);

    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const rows = await this.repo.findByProject(workspaceId, projectId, {
      cursor: options.cursor,
      limit,
    });

    const hasMore = rows.length > limit;
    const logs = hasMore ? rows.slice(0, limit) : rows;
    const next_cursor = hasMore ? logs[logs.length - 1].id : undefined;

    return { data: { logs }, meta: { next_cursor } };
  }

  async listByTask(
    workspaceId: string,
    taskId: string,
    userId: string,
    options: { cursor?: string; limit?: number },
  ) {
    await this.guard.requireMemberOrOwner(workspaceId, userId);

    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const rows = await this.repo.findByTask(workspaceId, taskId, { cursor: options.cursor, limit });

    const hasMore = rows.length > limit;
    const logs = hasMore ? rows.slice(0, limit) : rows;
    const next_cursor = hasMore ? logs[logs.length - 1].id : undefined;

    return { data: { logs }, meta: { next_cursor } };
  }
}
