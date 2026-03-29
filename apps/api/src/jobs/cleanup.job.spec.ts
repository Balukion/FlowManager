import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CleanupJob } from "./cleanup.job.js";

const makeRepo = () => ({
  deleteExpiredWorkspaces: vi.fn().mockResolvedValue(5),
  deleteOldNotifications: vi.fn().mockResolvedValue(12),
  deleteExpiredRevokedTokens: vi.fn().mockResolvedValue(3),
});

const makeLogger = () => ({
  info: vi.fn(),
  error: vi.fn(),
});

const FIXED_NOW = new Date("2026-03-29T02:00:00.000Z");

describe("CleanupJob", () => {
  let job: CleanupJob;
  let repo: ReturnType<typeof makeRepo>;
  let logger: ReturnType<typeof makeLogger>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    repo = makeRepo();
    logger = makeLogger();
    job = new CleanupJob(repo as any, logger as any, "0 2 * * *");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should have correct name and cron", () => {
    expect(job.name).toBe("cleanup");
    expect(job.cron).toBe("0 2 * * *");
  });

  it("should call deleteExpiredWorkspaces with 30-day cutoff", async () => {
    await job.run();
    expect(repo.deleteExpiredWorkspaces).toHaveBeenCalledOnce();
    const [cutoff] = repo.deleteExpiredWorkspaces.mock.calls[0];
    const expected = new Date(FIXED_NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(cutoff).toEqual(expected);
  });

  it("should call deleteOldNotifications with 90-day cutoff", async () => {
    await job.run();
    expect(repo.deleteOldNotifications).toHaveBeenCalledOnce();
    const [cutoff] = repo.deleteOldNotifications.mock.calls[0];
    const expected = new Date(FIXED_NOW.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(cutoff).toEqual(expected);
  });

  it("should call deleteExpiredRevokedTokens", async () => {
    await job.run();
    expect(repo.deleteExpiredRevokedTokens).toHaveBeenCalledOnce();
  });

  it("should log results with counts", async () => {
    await job.run();
    expect(logger.info).toHaveBeenCalledWith(
      { workspaces: 5, notifications: 12, revokedTokens: 3 },
      "Cleanup job completed",
    );
  });

  it("should not throw when nothing to delete", async () => {
    repo.deleteExpiredWorkspaces.mockResolvedValue(0);
    repo.deleteOldNotifications.mockResolvedValue(0);
    repo.deleteExpiredRevokedTokens.mockResolvedValue(0);
    await expect(job.run()).resolves.not.toThrow();
  });
});
