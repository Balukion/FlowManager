import { prisma } from "../lib/prisma.js";
import type { Job } from "./job.interface.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };

type NotificationInput = {
  user_id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
};

export class DeadlineRemindersRepository {
  async findTasksDueForReminder(cutoff: Date) {
    const now = new Date();
    return prisma.task.findMany({
      where: {
        deleted_at: null,
        status: { not: "DONE" },
        due_reminder_sent_at: null,
        deadline: { gte: now, lte: cutoff },
      },
      include: {
        assignee: { select: { id: true } },
        task_watchers: { select: { user_id: true } },
        project: { select: { workspace_id: true } },
      },
    });
  }

  async findStepsDueForReminder(cutoff: Date) {
    const now = new Date();
    return prisma.step.findMany({
      where: {
        deleted_at: null,
        status: { not: "DONE" },
        due_reminder_sent_at: null,
        deadline: { gte: now, lte: cutoff },
      },
      include: {
        assignments: {
          where: { unassigned_at: null },
          select: { user_id: true },
        },
        task: {
          select: {
            id: true,
            project: { select: { workspace_id: true } },
          },
        },
      },
    });
  }

  async createNotification(data: NotificationInput) {
    await prisma.notification.create({ data: data as any });
  }

  async markTaskReminderSent(taskId: string) {
    await prisma.task.update({
      where: { id: taskId },
      data: { due_reminder_sent_at: new Date() },
    });
  }

  async markStepReminderSent(stepId: string) {
    await prisma.step.update({
      where: { id: stepId },
      data: { due_reminder_sent_at: new Date() },
    });
  }
}

export class DeadlineRemindersJob implements Job {
  readonly name = "deadline-reminders";

  constructor(
    private repo: DeadlineRemindersRepository,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.repo.findTasksDueForReminder(cutoff);
    for (const task of tasks) {
      const recipientIds = new Set<string>();
      if (task.assignee?.id) recipientIds.add(task.assignee.id);
      for (const w of task.task_watchers) recipientIds.add(w.user_id);

      for (const userId of recipientIds) {
        await this.repo.createNotification({
          user_id: userId,
          type: "DEADLINE_APPROACHING",
          title: "Prazo se aproximando",
          body: `A tarefa "${task.title}" tem prazo próximo.`,
          entity_type: "task",
          entity_id: task.id,
        });
      }

      if (recipientIds.size > 0) {
        await this.repo.markTaskReminderSent(task.id);
      }
    }

    const steps = await this.repo.findStepsDueForReminder(cutoff);
    for (const step of steps) {
      for (const assignment of step.assignments) {
        await this.repo.createNotification({
          user_id: assignment.user_id,
          type: "DEADLINE_APPROACHING",
          title: "Prazo se aproximando",
          body: `O passo "${step.title}" tem prazo próximo.`,
          entity_type: "step",
          entity_id: step.id,
        });
      }

      if (step.assignments.length > 0) {
        await this.repo.markStepReminderSent(step.id);
      }
    }

    this.logger.info({ tasks: tasks.length, steps: steps.length }, "Deadline reminders sent");
  }
}
