import type { FastifyBaseLogger } from "fastify";
import { sendEmail } from "../lib/resend.js";
import { env } from "../config/env.js";
import { JobRunner } from "./job-runner.js";
import { CleanupJob, CleanupRepository } from "./cleanup.job.js";
import { ExpireInvitationsJob, ExpireInvitationsRepository } from "./expire-invitations.job.js";
import { DeadlineRemindersJob, DeadlineRemindersRepository } from "./deadline-reminders.job.js";
import { RetryNotificationsJob, RetryNotificationsRepository } from "./retry-notifications.job.js";

export function startJobs(logger: FastifyBaseLogger): JobRunner {
  const jobs = [
    new CleanupJob(new CleanupRepository(), logger, env.CRON_CLEANUP),
    new ExpireInvitationsJob(new ExpireInvitationsRepository(), logger, env.CRON_CLEANUP),
    new DeadlineRemindersJob(new DeadlineRemindersRepository(), logger, env.CRON_DEADLINE_REMINDERS),
    new RetryNotificationsJob(
      new RetryNotificationsRepository(),
      (to, subject, body) => sendEmail({ to, subject, template: "notification", data: { body } }),
      logger,
      env.CRON_RETRY_NOTIFICATIONS,
    ),
  ];

  const runner = new JobRunner(jobs, logger);
  runner.start();
  return runner;
}
