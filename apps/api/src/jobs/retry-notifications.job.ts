import { prisma } from "../lib/prisma.js";
import type { Job } from "./job.interface.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };
type SendEmail = (to: string, subject: string, body: string) => Promise<void>;

export class RetryNotificationsRepository {
  async findPendingRetry(maxAttempts: number) {
    return prisma.notification.findMany({
      where: {
        sent_at: null,
        attempt_count: { lt: maxAttempts },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  async markSent(id: string) {
    await prisma.notification.update({
      where: { id },
      data: { sent_at: new Date() },
    });
  }

  async incrementAttempt(id: string, errorMessage: string) {
    await prisma.notification.update({
      where: { id },
      data: {
        attempt_count: { increment: 1 },
        failed_at: new Date(),
        error_message: errorMessage,
      },
    });
  }
}

const MAX_ATTEMPTS = 3;

export class RetryNotificationsJob implements Job {
  readonly name = "retry-notifications";

  constructor(
    private repo: RetryNotificationsRepository,
    private sendEmail: SendEmail,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const pending = await this.repo.findPendingRetry(MAX_ATTEMPTS);

    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        await this.sendEmail(notification.user.email, notification.title, notification.body);
        await this.repo.markSent(notification.id);
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.repo.incrementAttempt(notification.id, message);
        failed++;
      }
    }

    this.logger.info({ sent, failed }, "Retry notifications completed");
  }
}
