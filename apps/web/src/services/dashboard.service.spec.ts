import { describe, it, expect, vi, beforeEach } from "vitest";
import { dashboardService } from "./dashboard.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";

beforeEach(() => vi.clearAllMocks());

describe("dashboardService.get", () => {
  it("should GET /workspaces/:wsId/dashboard", async () => {
    mockClient.get.mockResolvedValue({ data: { task_counts: {}, overdue_count: 0 } });
    await dashboardService(mockClient).get(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/dashboard`);
  });

  it("should return dashboard data", async () => {
    const mockData = { data: { task_counts: { TODO: 3, IN_PROGRESS: 1, DONE: 5 }, overdue_count: 2 } };
    mockClient.get.mockResolvedValue(mockData);
    const result = await dashboardService(mockClient).get(WS_ID);
    expect(result).toEqual(mockData);
  });
});
