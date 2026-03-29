import { prisma } from "../lib/prisma.js";
import type { Job } from "./job.interface.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };

export class ExpireInvitationsRepository {
  async expireOverdue(): Promise<number> {
    const result = await prisma.invitation.updateMany({
      where: {
        status: "PENDING",
        expires_at: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });
    return result.count;
  }
}

export class ExpireInvitationsJob implements Job {
  readonly name = "expire-invitations";

  constructor(
    private repo: ExpireInvitationsRepository,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const count = await this.repo.expireOverdue();
    this.logger.info({ count }, "Expired overdue invitations");
  }
}
