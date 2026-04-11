import { ForbiddenError, NotFoundError } from "../../errors/index.js";
import type { DashboardRepository } from "./dashboard.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

export class DashboardService {
  constructor(
    private repo: DashboardRepository,
    private workspacesRepo: WorkspacesRepository,
  ) {}

  async getDashboard(workspaceId: string, userId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    const member = await this.workspacesRepo.findMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;
    if (!member && !isOwner) throw new ForbiddenError("Acesso negado ao workspace");

    const [counts, overdue, members_count, recent_tasks, project_completion, member_workload] =
      await Promise.all([
        this.repo.getTaskCounts(workspaceId),
        this.repo.getOverdueCount(workspaceId),
        this.repo.getMembersCount(workspaceId),
        this.repo.getRecentTasks(workspaceId),
        this.repo.getProjectCompletion(workspaceId),
        this.repo.getMemberWorkload(workspaceId),
      ]);

    return {
      tasks: {
        total: counts.TODO + counts.IN_PROGRESS + counts.DONE,
        todo: counts.TODO,
        in_progress: counts.IN_PROGRESS,
        done: counts.DONE,
        overdue,
      },
      members_count,
      recent_tasks,
      project_completion,
      member_workload,
    };
  }
}
