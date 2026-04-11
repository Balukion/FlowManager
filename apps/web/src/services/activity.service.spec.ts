import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { activityService } from "./activity.service.js";

const TOKEN = "bearer-token";
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";

beforeEach(() => vi.clearAllMocks());

describe("activityService.listByWorkspace", () => {
  it("should GET /workspaces/:id/activity-logs with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { logs: [] } });
    await activityService.listByWorkspace(WS_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/activity-logs`, TOKEN);
  });

  it("should append user_id filter to query string", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { logs: [] } });
    await activityService.listByWorkspace(WS_ID, TOKEN, { user_id: "user-1" });
    expect(api.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/activity-logs?user_id=user-1`,
      TOKEN,
    );
  });

  it("should append action filter to query string", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { logs: [] } });
    await activityService.listByWorkspace(WS_ID, TOKEN, { action: "TASK_CREATED" });
    expect(api.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/activity-logs?action=TASK_CREATED`,
      TOKEN,
    );
  });

  it("should append from and to filters to query string", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { logs: [] } });
    await activityService.listByWorkspace(WS_ID, TOKEN, { from: "2026-01-01", to: "2026-03-31" });
    expect(api.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/activity-logs?from=2026-01-01&to=2026-03-31`,
      TOKEN,
    );
  });
});

describe("activityService.listByProject", () => {
  it("should GET /workspaces/:id/projects/:projectId/activity-logs with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { logs: [] } });
    await activityService.listByProject(WS_ID, PROJ_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/activity-logs`,
      TOKEN,
    );
  });
});

describe("activityService.listByTask", () => {
  it("should GET the task activity-logs endpoint with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { logs: [] } });
    await activityService.listByTask(WS_ID, PROJ_ID, TASK_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/activity-logs`,
      TOKEN,
    );
  });
});
