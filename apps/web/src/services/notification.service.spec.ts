import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationService } from "./notification.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const NOTIF_ID = "notif-1";

beforeEach(() => vi.clearAllMocks());

describe("notificationService.list", () => {
  it("should GET /notifications", async () => {
    mockClient.get.mockResolvedValue({ data: { notifications: [] } });
    await notificationService(mockClient).list();
    expect(mockClient.get).toHaveBeenCalledWith("/notifications");
  });
});

describe("notificationService.markAsRead", () => {
  it("should PATCH notification as read", async () => {
    mockClient.patch.mockResolvedValue({ data: {} });
    await notificationService(mockClient).markAsRead(NOTIF_ID);
    expect(mockClient.patch).toHaveBeenCalledWith(`/notifications/${NOTIF_ID}/read`, {});
  });
});

describe("notificationService.markAllAsRead", () => {
  it("should PATCH all notifications as read", async () => {
    mockClient.patch.mockResolvedValue({ data: {} });
    await notificationService(mockClient).markAllAsRead();
    expect(mockClient.patch).toHaveBeenCalledWith("/notifications/read-all", {});
  });
});

describe("notificationService.delete", () => {
  it("should DELETE a notification", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await notificationService(mockClient).delete(NOTIF_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`/notifications/${NOTIF_ID}`);
  });
});
