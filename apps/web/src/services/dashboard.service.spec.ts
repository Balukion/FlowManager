import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { dashboardService } from "./dashboard.service.js";

const TOKEN = "bearer-token";
const WS_ID = "ws-1";

beforeEach(() => vi.clearAllMocks());

describe("dashboardService.get", () => {
  it("should GET /workspaces/:wsId/dashboard with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { task_counts: {}, overdue_count: 0 } });
    await dashboardService.get(WS_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/dashboard`, TOKEN);
  });

  it("should return dashboard data", async () => {
    const mockData = { data: { task_counts: { TODO: 3, IN_PROGRESS: 1, DONE: 5 }, overdue_count: 2 } };
    vi.mocked(api.get).mockResolvedValue(mockData);
    const result = await dashboardService.get(WS_ID, TOKEN);
    expect(result).toEqual(mockData);
  });
});
