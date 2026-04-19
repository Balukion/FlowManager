import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetryNotificationsJob } from "./retry-notifications.job.js";

const makeNotification = (overrides = {}) => ({
  id: "notif-1",
  title: "Prazo se aproximando",
  body: "A tarefa X tem prazo próximo.",
  user: { email: "user@example.com", name: "User" },
  attempt_count: 0,
  ...overrides,
});

const makeNotificationsRepo = () => ({
  findPendingRetry: vi.fn().mockResolvedValue([]),
  markAsSent: vi.fn().mockResolvedValue(undefined),
  incrementAttempt: vi.fn().mockResolvedValue(undefined),
});

const makeLogger = () => ({
  info: vi.fn(),
  error: vi.fn(),
});

describe("RetryNotificationsJob", () => {
  let job: RetryNotificationsJob;
  let notificationsRepo: ReturnType<typeof makeNotificationsRepo>;
  let sendEmail: ReturnType<typeof vi.fn>;
  let logger: ReturnType<typeof makeLogger>;

  beforeEach(() => {
    notificationsRepo = makeNotificationsRepo();
    sendEmail = vi.fn().mockResolvedValue(undefined);
    logger = makeLogger();
    job = new RetryNotificationsJob(
      notificationsRepo as any,
      sendEmail,
      logger as any,
      "0 * * * *",
    );
  });

  it("should have correct name and cron", () => {
    expect(job.name).toBe("retry-notifications");
    expect(job.cron).toBe("0 * * * *");
  });

  it("should query pending notifications with max 3 attempts", async () => {
    await job.run();
    expect(notificationsRepo.findPendingRetry).toHaveBeenCalledWith(3);
  });

  it("should send email for each pending notification", async () => {
    notificationsRepo.findPendingRetry.mockResolvedValue([makeNotification()]);

    await job.run();

    expect(sendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Prazo se aproximando",
      "A tarefa X tem prazo próximo.",
    );
  });

  it("should mark notification as sent on success", async () => {
    notificationsRepo.findPendingRetry.mockResolvedValue([makeNotification()]);

    await job.run();

    expect(notificationsRepo.markAsSent).toHaveBeenCalledWith("notif-1");
    expect(notificationsRepo.incrementAttempt).not.toHaveBeenCalled();
  });

  it("should increment attempt and not mark sent on send failure", async () => {
    sendEmail.mockRejectedValue(new Error("SMTP timeout"));
    notificationsRepo.findPendingRetry.mockResolvedValue([makeNotification()]);

    await job.run();

    expect(notificationsRepo.incrementAttempt).toHaveBeenCalledWith("notif-1", "SMTP timeout");
    expect(notificationsRepo.markAsSent).not.toHaveBeenCalled();
  });

  it("should log sent and failed counts", async () => {
    sendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("fail"));
    notificationsRepo.findPendingRetry.mockResolvedValue([
      makeNotification({ id: "n1" }),
      makeNotification({ id: "n2" }),
    ]);

    await job.run();

    expect(logger.info).toHaveBeenCalledWith(
      { sent: 1, failed: 1 },
      "Retry notifications completed",
    );
  });

  it("should not throw when no pending notifications", async () => {
    await expect(job.run()).resolves.not.toThrow();
  });
});
