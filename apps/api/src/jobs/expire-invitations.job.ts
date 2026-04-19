import type { Job } from "./job.interface.js";
import type { InvitationsRepository } from "../modules/invitations/invitations.repository.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };

export class ExpireInvitationsJob implements Job {
  readonly name = "expire-invitations";

  constructor(
    private invitationsRepo: Pick<InvitationsRepository, "expireOverdue">,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const count = await this.invitationsRepo.expireOverdue();
    this.logger.info({ count }, "Expired overdue invitations");
  }
}
