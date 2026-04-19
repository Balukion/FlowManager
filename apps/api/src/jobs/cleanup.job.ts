import type { Job } from "./job.interface.js";
import type { WorkspacesRepository } from "../modules/workspaces/workspaces.repository.js";
import type { NotificationsRepository } from "../modules/notifications/notifications.repository.js";
import type { TokenRepository } from "../modules/auth/auth.repository.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };

export class CleanupJob implements Job {
  readonly name = "cleanup";

  constructor(
    private workspacesRepo: Pick<WorkspacesRepository, "deleteExpiredWorkspaces">,
    private notificationsRepo: Pick<NotificationsRepository, "deleteOldNotifications">,
    private tokenRepo: Pick<TokenRepository, "deleteExpiredRevokedTokens">,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const now = new Date();
    const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoff90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const workspaces = await this.workspacesRepo.deleteExpiredWorkspaces(cutoff30d);
    const notifications = await this.notificationsRepo.deleteOldNotifications(cutoff90d);
    const revokedTokens = await this.tokenRepo.deleteExpiredRevokedTokens();

    this.logger.info({ workspaces, notifications, revokedTokens }, "Cleanup job completed");
  }
}
