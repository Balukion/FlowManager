import cron from "node-cron";
import type { FastifyBaseLogger } from "fastify";
import type { Job } from "./job.interface.js";

export class JobRunner {
  private tasks: cron.ScheduledTask[] = [];

  constructor(
    private jobs: Job[],
    private logger: FastifyBaseLogger,
  ) {}

  start(): void {
    for (const job of this.jobs) {
      const task = cron.schedule(job.cron, async () => {
        this.logger.info(`[${job.name}] starting`);
        try {
          await job.run();
          this.logger.info(`[${job.name}] completed`);
        } catch (err) {
          this.logger.error(err, `[${job.name}] failed`);
        }
      });
      this.tasks.push(task);
    }
    this.logger.info(`Started ${this.jobs.length} scheduled jobs`);
  }

  stop(): void {
    this.tasks.forEach((t) => t.stop());
    this.tasks = [];
  }
}
