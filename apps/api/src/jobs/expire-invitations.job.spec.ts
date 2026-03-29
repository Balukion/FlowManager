import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExpireInvitationsJob } from "./expire-invitations.job.js";

const makeRepo = () => ({
  expireOverdue: vi.fn().mockResolvedValue(7),
});

const makeLogger = () => ({
  info: vi.fn(),
  error: vi.fn(),
});

describe("ExpireInvitationsJob", () => {
  let job: ExpireInvitationsJob;
  let repo: ReturnType<typeof makeRepo>;
  let logger: ReturnType<typeof makeLogger>;

  beforeEach(() => {
    repo = makeRepo();
    logger = makeLogger();
    job = new ExpireInvitationsJob(repo as any, logger as any, "0 2 * * *");
  });

  it("should have correct name and cron", () => {
    expect(job.name).toBe("expire-invitations");
    expect(job.cron).toBe("0 2 * * *");
  });

  it("should call expireOverdue on the repository", async () => {
    await job.run();
    expect(repo.expireOverdue).toHaveBeenCalledOnce();
  });

  it("should log the count of expired invitations", async () => {
    await job.run();
    expect(logger.info).toHaveBeenCalledWith(
      { count: 7 },
      "Expired overdue invitations",
    );
  });

  it("should not throw when no invitations to expire", async () => {
    repo.expireOverdue.mockResolvedValue(0);
    await expect(job.run()).resolves.not.toThrow();
  });
});
