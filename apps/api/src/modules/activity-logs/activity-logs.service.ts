import { type ActivityAction } from "@prisma/client";
import { getSafeLimit, paginateResult } from "@flowmanager/shared";
import { WorkspaceGuard } from "../../lib/workspace-guard.js";
import type { ActivityLogsRepository } from "./activity-logs.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

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

    const limit = getSafeLimit(options.limit);
    const rows = await this.repo.findByWorkspace(workspaceId, {
      cursor: options.cursor,
      limit,
      user_id: options.user_id,
      action: options.action,
      from: options.from,
      to: options.to,
    });

    const { items: logs, next_cursor } = paginateResult(rows, limit);

    return { data: { logs }, meta: { next_cursor } };
  }

  async listByProject(
    workspaceId: string,
    projectId: string,
    userId: string,
    options: { cursor?: string; limit?: number },
  ) {
    await this.guard.requireMemberOrOwner(workspaceId, userId);

    const limit = getSafeLimit(options.limit);
    const rows = await this.repo.findByProject(workspaceId, projectId, {
      cursor: options.cursor,
      limit,
    });

    const { items: logs, next_cursor } = paginateResult(rows, limit);

    return { data: { logs }, meta: { next_cursor } };
  }

  async listByTask(
    workspaceId: string,
    taskId: string,
    userId: string,
    options: { cursor?: string; limit?: number },
  ) {
    await this.guard.requireMemberOrOwner(workspaceId, userId);

    const limit = getSafeLimit(options.limit);
    const rows = await this.repo.findByTask(workspaceId, taskId, { cursor: options.cursor, limit });

    const { items: logs, next_cursor } = paginateResult(rows, limit);

    return { data: { logs }, meta: { next_cursor } };
  }
}
