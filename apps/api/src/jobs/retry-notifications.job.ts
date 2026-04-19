import type { Job } from "./job.interface.js";
import type { NotificationsRepository } from "../modules/notifications/notifications.repository.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };
type SendEmail = (to: string, subject: string, body: string) => Promise<void>;

const MAX_ATTEMPTS = 3;

export class RetryNotificationsJob implements Job {
  readonly name = "retry-notifications";

  constructor(
    private notificationsRepo: Pick<NotificationsRepository, "findPendingRetry" | "markAsSent" | "incrementAttempt">,
    private sendEmail: SendEmail,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const pending = await this.notificationsRepo.findPendingRetry(MAX_ATTEMPTS);

    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        await this.sendEmail(notification.user.email, notification.title, notification.body);
        await this.notificationsRepo.markAsSent(notification.id);
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.notificationsRepo.incrementAttempt(notification.id, message);
        failed++;
      }
    }

    this.logger.info({ sent, failed }, "Retry notifications completed");
  }
}
