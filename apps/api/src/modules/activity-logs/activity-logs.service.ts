import { ForbiddenError, NotFoundError } from "../../errors/index.js";
import type { ActivityLogsRepository } from "./activity-logs.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ActivityLogsService {
  constructor(
    private repo: ActivityLogsRepository,
    private workspacesRepo: WorkspacesRepository,
  ) {}

  private async requireMember(workspaceId: string, userId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    const member = await this.workspacesRepo.findMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;
    if (!member && !isOwner) throw new ForbiddenError("Acesso negado ao workspace");
  }

  async listByWorkspace(
    workspaceId: string,
    userId: string,
    options: { cursor?: string; limit?: number },
  ) {
    await this.requireMember(workspaceId, userId);

    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const rows = await this.repo.findByWorkspace(workspaceId, { cursor: options.cursor, limit });

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
    await this.requireMember(workspaceId, userId);

    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const rows = await this.repo.findByTask(workspaceId, taskId, { cursor: options.cursor, limit });

    const hasMore = rows.length > limit;
    const logs = hasMore ? rows.slice(0, limit) : rows;
    const next_cursor = hasMore ? logs[logs.length - 1].id : undefined;

    return { data: { logs }, meta: { next_cursor } };
  }
}
