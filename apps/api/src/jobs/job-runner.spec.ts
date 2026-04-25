import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobRunner } from "./job-runner.js";
import type { Job } from "./job.interface.js";

vi.mock("node-cron", () => ({
  default: {
    schedule: vi.fn(),
  },
}));

import cron from "node-cron";

const makeLogger = () => ({
  info: vi.fn(),
  error: vi.fn(),
});

const makeJob = (name: string, cronExpr = "* * * * *"): Job => ({
  name,
  cron: cronExpr,
  run: vi.fn().mockResolvedValue(undefined),
});

const makeTask = () => ({ stop: vi.fn() });

describe("JobRunner", () => {
  let logger: ReturnType<typeof makeLogger>;

  beforeEach(() => {
    logger = makeLogger();
    vi.mocked(cron.schedule).mockReset();
  });

  describe("start()", () => {
    it("schedules each job with its cron expression", () => {
      const task = makeTask();
      vi.mocked(cron.schedule).mockReturnValue(task as any);

      const job1 = makeJob("job-a", "0 2 * * *");
      const job2 = makeJob("job-b", "0 8 * * *");
      const runner = new JobRunner([job1, job2], logger as any);

      runner.start();

      expect(cron.schedule).toHaveBeenCalledTimes(2);
      expect(cron.schedule).toHaveBeenCalledWith("0 2 * * *", expect.any(Function));
      expect(cron.schedule).toHaveBeenCalledWith("0 8 * * *", expect.any(Function));
    });

    it("logs how many jobs were started", () => {
      vi.mocked(cron.schedule).mockReturnValue(makeTask() as any);

      const runner = new JobRunner([makeJob("a"), makeJob("b")], logger as any);
      runner.start();

      expect(logger.info).toHaveBeenCalledWith("Started 2 scheduled jobs");
    });

    it("calls job.run() when the cron fires", async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      vi.mocked(cron.schedule).mockImplementation((_expr, cb) => {
        capturedCallback = cb as () => Promise<void>;
        return makeTask() as any;
      });

      const job = makeJob("job-a");
      const runner = new JobRunner([job], logger as any);
      runner.start();

      await capturedCallback!();

      expect(job.run).toHaveBeenCalledOnce();
    });

    it("logs start and completion around job.run()", async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      vi.mocked(cron.schedule).mockImplementation((_expr, cb) => {
        capturedCallback = cb as () => Promise<void>;
        return makeTask() as any;
      });

      const runner = new JobRunner([makeJob("my-job")], logger as any);
      runner.start();
      await capturedCallback!();

      expect(logger.info).toHaveBeenCalledWith("[my-job] starting");
      expect(logger.info).toHaveBeenCalledWith("[my-job] completed");
    });

    it("logs error and does not throw when job.run() fails", async () => {
      const error = new Error("db connection lost");
      let capturedCallback: (() => Promise<void>) | null = null;
      vi.mocked(cron.schedule).mockImplementation((_expr, cb) => {
        capturedCallback = cb as () => Promise<void>;
        return makeTask() as any;
      });

      const job = makeJob("job-a");
      (job.run as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const runner = new JobRunner([job], logger as any);
      runner.start();

      await expect(capturedCallback!()).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(error, "[job-a] failed");
    });
  });

  describe("stop()", () => {
    it("calls stop on every scheduled task", () => {
      const task1 = makeTask();
      const task2 = makeTask();
      vi.mocked(cron.schedule)
        .mockReturnValueOnce(task1 as any)
        .mockReturnValueOnce(task2 as any);

      const runner = new JobRunner([makeJob("a"), makeJob("b")], logger as any);
      runner.start();
      runner.stop();

      expect(task1.stop).toHaveBeenCalledOnce();
      expect(task2.stop).toHaveBeenCalledOnce();
    });

    it("clears tasks so a second stop() is a no-op", () => {
      const task = makeTask();
      vi.mocked(cron.schedule).mockReturnValue(task as any);

      const runner = new JobRunner([makeJob("a")], logger as any);
      runner.start();
      runner.stop();
      runner.stop();

      expect(task.stop).toHaveBeenCalledTimes(1);
    });
  });
});
