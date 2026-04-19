import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeadlineRemindersJob } from "./deadline-reminders.job.js";

const FIXED_NOW = new Date("2026-03-29T08:00:00.000Z");
const CUTOFF_24H = new Date(FIXED_NOW.getTime() + 24 * 60 * 60 * 1000);

const makeTask = (overrides = {}) => ({
  id: "task-1",
  title: "Tarefa urgente",
  assignee: { id: "user-assignee" },
  task_watchers: [],
  project: { workspace_id: "ws-1" },
  ...overrides,
});

const makeStep = (overrides = {}) => ({
  id: "step-1",
  title: "Passo urgente",
  assignments: [{ user_id: "user-assigned" }],
  task: { id: "task-1", project: { workspace_id: "ws-1" } },
  ...overrides,
});

const makeTasksRepo = () => ({
  findTasksDueForReminder: vi.fn().mockResolvedValue([]),
  markReminderSent: vi.fn().mockResolvedValue(undefined),
});

const makeStepsRepo = () => ({
  findStepsDueForReminder: vi.fn().mockResolvedValue([]),
  markReminderSent: vi.fn().mockResolvedValue(undefined),
});

const makeNotificationsRepo = () => ({
  create: vi.fn().mockResolvedValue(undefined),
});

const makeLogger = () => ({
  info: vi.fn(),
  error: vi.fn(),
});

describe("DeadlineRemindersJob", () => {
  let job: DeadlineRemindersJob;
  let tasksRepo: ReturnType<typeof makeTasksRepo>;
  let stepsRepo: ReturnType<typeof makeStepsRepo>;
  let notificationsRepo: ReturnType<typeof makeNotificationsRepo>;
  let logger: ReturnType<typeof makeLogger>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    tasksRepo = makeTasksRepo();
    stepsRepo = makeStepsRepo();
    notificationsRepo = makeNotificationsRepo();
    logger = makeLogger();
    job = new DeadlineRemindersJob(
      tasksRepo as any,
      stepsRepo as any,
      notificationsRepo as any,
      logger as any,
      "0 8 * * *",
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should have correct name and cron", () => {
    expect(job.name).toBe("deadline-reminders");
    expect(job.cron).toBe("0 8 * * *");
  });

  it("should query tasks with 24h cutoff", async () => {
    await job.run();
    expect(tasksRepo.findTasksDueForReminder).toHaveBeenCalledWith(CUTOFF_24H);
  });

  it("should query steps with 24h cutoff", async () => {
    await job.run();
    expect(stepsRepo.findStepsDueForReminder).toHaveBeenCalledWith(CUTOFF_24H);
  });

  it("should create DEADLINE_APPROACHING notification for task assignee", async () => {
    tasksRepo.findTasksDueForReminder.mockResolvedValue([makeTask()]);

    await job.run();

    expect(notificationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-assignee",
        type: "DEADLINE_APPROACHING",
        entity_type: "task",
        entity_id: "task-1",
      }),
    );
  });

  it("should create notifications for task watchers", async () => {
    tasksRepo.findTasksDueForReminder.mockResolvedValue([
      makeTask({
        assignee: null,
        task_watchers: [{ user_id: "watcher-1" }, { user_id: "watcher-2" }],
      }),
    ]);

    await job.run();

    expect(notificationsRepo.create).toHaveBeenCalledTimes(2);
    expect(notificationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "watcher-1" }),
    );
    expect(notificationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "watcher-2" }),
    );
  });

  it("should not send duplicate notification when assignee is also a watcher", async () => {
    tasksRepo.findTasksDueForReminder.mockResolvedValue([
      makeTask({
        assignee: { id: "user-1" },
        task_watchers: [{ user_id: "user-1" }, { user_id: "user-2" }],
      }),
    ]);

    await job.run();

    const calls = notificationsRepo.create.mock.calls.map((c: any[]) => c[0].user_id);
    expect(calls.filter((id: string) => id === "user-1")).toHaveLength(1);
  });

  it("should mark task reminder sent after notifying", async () => {
    tasksRepo.findTasksDueForReminder.mockResolvedValue([makeTask()]);

    await job.run();

    expect(tasksRepo.markReminderSent).toHaveBeenCalledWith("task-1");
  });

  it("should not mark task reminder sent when no recipients", async () => {
    tasksRepo.findTasksDueForReminder.mockResolvedValue([
      makeTask({ assignee: null, task_watchers: [] }),
    ]);

    await job.run();

    expect(tasksRepo.markReminderSent).not.toHaveBeenCalled();
  });

  it("should create notification for step assignments", async () => {
    stepsRepo.findStepsDueForReminder.mockResolvedValue([makeStep()]);

    await job.run();

    expect(notificationsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-assigned",
        type: "DEADLINE_APPROACHING",
        entity_type: "step",
        entity_id: "step-1",
      }),
    );
  });

  it("should mark step reminder sent after notifying", async () => {
    stepsRepo.findStepsDueForReminder.mockResolvedValue([makeStep()]);

    await job.run();

    expect(stepsRepo.markReminderSent).toHaveBeenCalledWith("step-1");
  });

  it("should not mark step reminder sent when no assignments", async () => {
    stepsRepo.findStepsDueForReminder.mockResolvedValue([
      makeStep({ assignments: [] }),
    ]);

    await job.run();

    expect(stepsRepo.markReminderSent).not.toHaveBeenCalled();
  });

  it("should log counts at the end", async () => {
    tasksRepo.findTasksDueForReminder.mockResolvedValue([makeTask()]);
    stepsRepo.findStepsDueForReminder.mockResolvedValue([makeStep()]);

    await job.run();

    expect(logger.info).toHaveBeenCalledWith(
      { tasks: 1, steps: 1 },
      "Deadline reminders sent",
    );
  });

  it("should not throw when no tasks or steps due", async () => {
    await expect(job.run()).resolves.not.toThrow();
  });
});
