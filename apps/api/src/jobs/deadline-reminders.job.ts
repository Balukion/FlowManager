import type { Job } from "./job.interface.js";
import type { TasksRepository } from "../modules/tasks/tasks.repository.js";
import type { StepsRepository } from "../modules/steps/steps.repository.js";
import type { NotificationsRepository } from "../modules/notifications/notifications.repository.js";

type Logger = { info: (data: object, msg: string) => void; error: (err: unknown, msg: string) => void };

export class DeadlineRemindersJob implements Job {
  readonly name = "deadline-reminders";

  constructor(
    private tasksRepo: Pick<TasksRepository, "findTasksDueForReminder" | "markReminderSent">,
    private stepsRepo: Pick<StepsRepository, "findStepsDueForReminder" | "markReminderSent">,
    private notificationsRepo: Pick<NotificationsRepository, "create">,
    private logger: Logger,
    readonly cron: string,
  ) {}

  async run(): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.tasksRepo.findTasksDueForReminder(cutoff);
    for (const task of tasks) {
      const recipientIds = new Set<string>();
      if (task.assignee?.id) recipientIds.add(task.assignee.id);
      for (const w of task.task_watchers) recipientIds.add(w.user_id);

      for (const userId of recipientIds) {
        await this.notificationsRepo.create({
          user_id: userId,
          type: "DEADLINE_APPROACHING",
          title: "Prazo se aproximando",
          body: `A tarefa "${task.title}" tem prazo próximo.`,
          entity_type: "task",
          entity_id: task.id,
        } as Parameters<NotificationsRepository["create"]>[0]);
      }

      if (recipientIds.size > 0) {
        await this.tasksRepo.markReminderSent(task.id);
      }
    }

    const steps = await this.stepsRepo.findStepsDueForReminder(cutoff);
    for (const step of steps) {
      for (const assignment of step.assignments) {
        await this.notificationsRepo.create({
          user_id: assignment.user_id,
          type: "DEADLINE_APPROACHING",
          title: "Prazo se aproximando",
          body: `O passo "${step.title}" tem prazo próximo.`,
          entity_type: "step",
          entity_id: step.id,
        } as Parameters<NotificationsRepository["create"]>[0]);
      }

      if (step.assignments.length > 0) {
        await this.stepsRepo.markReminderSent(step.id);
      }
    }

    this.logger.info({ tasks: tasks.length, steps: steps.length }, "Deadline reminders sent");
  }
}
