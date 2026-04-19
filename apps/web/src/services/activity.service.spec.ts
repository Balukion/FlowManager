import { describe, it, expect, vi, beforeEach } from "vitest";
import { activityService } from "./activity.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";

beforeEach(() => vi.clearAllMocks());

describe("activityService.listByWorkspace", () => {
  it("should GET /workspaces/:id/activity-logs", async () => {
    mockClient.get.mockResolvedValue({ data: { logs: [] } });
    await activityService(mockClient).listByWorkspace(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/activity-logs`);
  });

  it("should append user_id filter to query string", async () => {
    mockClient.get.mockResolvedValue({ data: { logs: [] } });
    await activityService(mockClient).listByWorkspace(WS_ID, { user_id: "user-1" });
    expect(mockClient.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/activity-logs?user_id=user-1`,
    );
  });

  it("should append action filter to query string", async () => {
    mockClient.get.mockResolvedValue({ data: { logs: [] } });
    await activityService(mockClient).listByWorkspace(WS_ID, { action: "TASK_CREATED" });
    expect(mockClient.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/activity-logs?action=TASK_CREATED`,
    );
  });

  it("should append from and to filters to query string", async () => {
    mockClient.get.mockResolvedValue({ data: { logs: [] } });
    await activityService(mockClient).listByWorkspace(WS_ID, { from: "2026-01-01", to: "2026-03-31" });
    expect(mockClient.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/activity-logs?from=2026-01-01&to=2026-03-31`,
    );
  });
});

describe("activityService.listByProject", () => {
  it("should GET /workspaces/:id/projects/:projectId/activity-logs", async () => {
    mockClient.get.mockResolvedValue({ data: { logs: [] } });
    await activityService(mockClient).listByProject(WS_ID, PROJ_ID);
    expect(mockClient.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/activity-logs`,
    );
  });
});

describe("activityService.listByTask", () => {
  it("should GET the task activity-logs endpoint", async () => {
    mockClient.get.mockResolvedValue({ data: { logs: [] } });
    await activityService(mockClient).listByTask(WS_ID, PROJ_ID, TASK_ID);
    expect(mockClient.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/activity-logs`,
    );
  });
});
