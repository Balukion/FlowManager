import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { stepService } from "./step.service.js";

const TOKEN = "bearer-token";
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";
const STEP_ID = "step-1";
const BASE = `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/steps`;

beforeEach(() => vi.clearAllMocks());

describe("stepService.list", () => {
  it("should GET steps for a task with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { steps: [] } });
    await stepService.list(WS_ID, PROJ_ID, TASK_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(BASE, TOKEN);
  });
});

describe("stepService.create", () => {
  it("should POST to steps endpoint with data and token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { step: {} } });
    await stepService.create(WS_ID, PROJ_ID, TASK_ID, { title: "Novo Passo" }, TOKEN);
    expect(api.post).toHaveBeenCalledWith(BASE, { title: "Novo Passo" }, TOKEN);
  });
});

describe("stepService.updateStatus", () => {
  it("should PATCH step status endpoint", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { step: {} } });
    await stepService.updateStatus(WS_ID, PROJ_ID, TASK_ID, STEP_ID, "DONE", TOKEN);
    expect(api.patch).toHaveBeenCalledWith(`${BASE}/${STEP_ID}/status`, { status: "DONE" }, TOKEN);
  });
});

describe("stepService.delete", () => {
  it("should DELETE step with token", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await stepService.delete(WS_ID, PROJ_ID, TASK_ID, STEP_ID, TOKEN);
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/${STEP_ID}`, TOKEN);
  });
});

describe("stepService.assign", () => {
  it("should PATCH to step assign endpoint", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });
    await stepService.assign(WS_ID, PROJ_ID, TASK_ID, STEP_ID, "user-2", TOKEN);
    expect(api.patch).toHaveBeenCalledWith(
      `${BASE}/${STEP_ID}/assign`,
      { user_id: "user-2" },
      TOKEN,
    );
  });
});

describe("stepService.unassign", () => {
  it("should DELETE to step assign/:userId endpoint", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await stepService.unassign(WS_ID, PROJ_ID, TASK_ID, STEP_ID, "user-2", TOKEN);
    expect(api.delete).toHaveBeenCalledWith(
      `${BASE}/${STEP_ID}/assign/user-2`,
      TOKEN,
    );
  });
});

describe("stepService.reorder", () => {
  it("should PATCH steps/reorder with order array and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });
    await stepService.reorder(WS_ID, PROJ_ID, TASK_ID, ["s-2", "s-1"], TOKEN);
    expect(api.patch).toHaveBeenCalledWith(
      `${BASE}/reorder`,
      { order: ["s-2", "s-1"] },
      TOKEN,
    );
  });
});

describe("stepService.listAssigned", () => {
  it("should GET /workspaces/:id/steps/assigned with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { steps: [] } });
    await stepService.listAssigned(WS_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/steps/assigned`, TOKEN);
  });
});
