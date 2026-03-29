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

const makeRepo = () => ({
  findTasksDueForReminder: vi.fn().mockResolvedValue([]),
  findStepsDueForReminder: vi.fn().mockResolvedValue([]),
  createNotification: vi.fn().mockResolvedValue(undefined),
  markTaskReminderSent: vi.fn().mockResolvedValue(undefined),
  markStepReminderSent: vi.fn().mockResolvedValue(undefined),
});

const makeLogger = () => ({
  info: vi.fn(),
  error: vi.fn(),
});

describe("DeadlineRemindersJob", () => {
  let job: DeadlineRemindersJob;
  let repo: ReturnType<typeof makeRepo>;
  let logger: ReturnType<typeof makeLogger>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    repo = makeRepo();
    logger = makeLogger();
    job = new DeadlineRemindersJob(repo as any, logger as any, "0 8 * * *");
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
    expect(repo.findTasksDueForReminder).toHaveBeenCalledWith(CUTOFF_24H);
  });

  it("should query steps with 24h cutoff", async () => {
    await job.run();
    expect(repo.findStepsDueForReminder).toHaveBeenCalledWith(CUTOFF_24H);
  });

  it("should create DEADLINE_APPROACHING notification for task assignee", async () => {
    repo.findTasksDueForReminder.mockResolvedValue([makeTask()]);

    await job.run();

    expect(repo.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-assignee",
        type: "DEADLINE_APPROACHING",
        entity_type: "task",
        entity_id: "task-1",
      }),
    );
  });

  it("should create notifications for task watchers", async () => {
    repo.findTasksDueForReminder.mockResolvedValue([
      makeTask({
        assignee: null,
        task_watchers: [{ user_id: "watcher-1" }, { user_id: "watcher-2" }],
      }),
    ]);

    await job.run();

    expect(repo.createNotification).toHaveBeenCalledTimes(2);
    expect(repo.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "watcher-1" }),
    );
    expect(repo.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "watcher-2" }),
    );
  });

  it("should not send duplicate notification when assignee is also a watcher", async () => {
    repo.findTasksDueForReminder.mockResolvedValue([
      makeTask({
        assignee: { id: "user-1" },
        task_watchers: [{ user_id: "user-1" }, { user_id: "user-2" }],
      }),
    ]);

    await job.run();

    const calls = repo.createNotification.mock.calls.map((c) => c[0].user_id);
    expect(calls.filter((id) => id === "user-1")).toHaveLength(1);
  });

  it("should mark task reminder sent after notifying", async () => {
    repo.findTasksDueForReminder.mockResolvedValue([makeTask()]);

    await job.run();

    expect(repo.markTaskReminderSent).toHaveBeenCalledWith("task-1");
  });

  it("should not mark task reminder sent when no recipients", async () => {
    repo.findTasksDueForReminder.mockResolvedValue([
      makeTask({ assignee: null, task_watchers: [] }),
    ]);

    await job.run();

    expect(repo.markTaskReminderSent).not.toHaveBeenCalled();
  });

  it("should create notification for step assignments", async () => {
    repo.findStepsDueForReminder.mockResolvedValue([makeStep()]);

    await job.run();

    expect(repo.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-assigned",
        type: "DEADLINE_APPROACHING",
        entity_type: "step",
        entity_id: "step-1",
      }),
    );
  });

  it("should mark step reminder sent after notifying", async () => {
    repo.findStepsDueForReminder.mockResolvedValue([makeStep()]);

    await job.run();

    expect(repo.markStepReminderSent).toHaveBeenCalledWith("step-1");
  });

  it("should not mark step reminder sent when no assignments", async () => {
    repo.findStepsDueForReminder.mockResolvedValue([
      makeStep({ assignments: [] }),
    ]);

    await job.run();

    expect(repo.markStepReminderSent).not.toHaveBeenCalled();
  });

  it("should log counts at the end", async () => {
    repo.findTasksDueForReminder.mockResolvedValue([makeTask()]);
    repo.findStepsDueForReminder.mockResolvedValue([makeStep()]);

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
