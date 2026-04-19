import type { FastifyBaseLogger } from "fastify";
import { sendEmail } from "../lib/resend.js";
import { env } from "../config/env.js";
import {
  workspacesRepository,
  notificationsRepository,
  tokenRepository,
  invitationsRepository,
  tasksRepository,
  stepsRepository,
} from "../lib/registry.js";
import { JobRunner } from "./job-runner.js";
import { CleanupJob } from "./cleanup.job.js";
import { ExpireInvitationsJob } from "./expire-invitations.job.js";
import { DeadlineRemindersJob } from "./deadline-reminders.job.js";
import { RetryNotificationsJob } from "./retry-notifications.job.js";

export function startJobs(logger: FastifyBaseLogger): JobRunner {
  const jobs = [
    new CleanupJob(workspacesRepository, notificationsRepository, tokenRepository, logger, env.CRON_CLEANUP),
    new ExpireInvitationsJob(invitationsRepository, logger, env.CRON_CLEANUP),
    new DeadlineRemindersJob(tasksRepository, stepsRepository, notificationsRepository, logger, env.CRON_DEADLINE_REMINDERS),
    new RetryNotificationsJob(
      notificationsRepository,
      (to, subject, body) => sendEmail({ to, subject, template: "notification", data: { body } }),
      logger,
      env.CRON_RETRY_NOTIFICATIONS,
    ),
  ];

  const runner = new JobRunner(jobs, logger);
  runner.start();
  return runner;
}
