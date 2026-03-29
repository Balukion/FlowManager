import { prisma } from "../lib/prisma.js";
import type { Job } from "./job.interface.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };

export class CleanupRepository {
  async deleteExpiredWorkspaces(cutoff: Date): Promise<number> {
    const result = await prisma.workspace.deleteMany({
      where: { deleted_at: { not: null, lt: cutoff } },
    });
    return result.count;
  }

  async deleteOldNotifications(cutoff: Date): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { created_at: { lt: cutoff } },
    });
    return result.count;
  }

  async deleteExpiredRevokedTokens(): Promise<number> {
    const result = await prisma.revokedToken.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
    return result.count;
  }
}

export class CleanupJob implements Job {
  readonly name = "cleanup";

  constructor(
    private repo: CleanupRepository,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const now = new Date();
    const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoff90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const workspaces = await this.repo.deleteExpiredWorkspaces(cutoff30d);
    const notifications = await this.repo.deleteOldNotifications(cutoff90d);
    const revokedTokens = await this.repo.deleteExpiredRevokedTokens();

    this.logger.info({ workspaces, notifications, revokedTokens }, "Cleanup job completed");
  }
}
