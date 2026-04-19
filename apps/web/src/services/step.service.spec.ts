import { describe, it, expect, vi, beforeEach } from "vitest";
import { stepService } from "./step.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";
const STEP_ID = "step-1";
const BASE = `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/steps`;

beforeEach(() => vi.clearAllMocks());

describe("stepService.list", () => {
  it("should GET steps for a task", async () => {
    mockClient.get.mockResolvedValue({ data: { steps: [] } });
    await stepService(mockClient).list(WS_ID, PROJ_ID, TASK_ID);
    expect(mockClient.get).toHaveBeenCalledWith(BASE);
  });
});

describe("stepService.create", () => {
  it("should POST to steps endpoint with data", async () => {
    mockClient.post.mockResolvedValue({ data: { step: {} } });
    await stepService(mockClient).create(WS_ID, PROJ_ID, TASK_ID, { title: "Novo Passo" });
    expect(mockClient.post).toHaveBeenCalledWith(BASE, { title: "Novo Passo" });
  });
});

describe("stepService.updateStatus", () => {
  it("should PATCH step status endpoint", async () => {
    mockClient.patch.mockResolvedValue({ data: { step: {} } });
    await stepService(mockClient).updateStatus(WS_ID, PROJ_ID, TASK_ID, STEP_ID, "DONE");
    expect(mockClient.patch).toHaveBeenCalledWith(`${BASE}/${STEP_ID}/status`, { status: "DONE" });
  });
});

describe("stepService.delete", () => {
  it("should DELETE step", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await stepService(mockClient).delete(WS_ID, PROJ_ID, TASK_ID, STEP_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`${BASE}/${STEP_ID}`);
  });
});

describe("stepService.assign", () => {
  it("should PATCH to step assign endpoint", async () => {
    mockClient.patch.mockResolvedValue({ data: {} });
    await stepService(mockClient).assign(WS_ID, PROJ_ID, TASK_ID, STEP_ID, "user-2");
    expect(mockClient.patch).toHaveBeenCalledWith(
      `${BASE}/${STEP_ID}/assign`,
      { user_id: "user-2" },
    );
  });
});

describe("stepService.unassign", () => {
  it("should DELETE to step assign/:userId endpoint", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await stepService(mockClient).unassign(WS_ID, PROJ_ID, TASK_ID, STEP_ID, "user-2");
    expect(mockClient.delete).toHaveBeenCalledWith(`${BASE}/${STEP_ID}/assign/user-2`);
  });
});

describe("stepService.reorder", () => {
  it("should PATCH steps/reorder with order array", async () => {
    mockClient.patch.mockResolvedValue({ data: {} });
    await stepService(mockClient).reorder(WS_ID, PROJ_ID, TASK_ID, ["s-2", "s-1"]);
    expect(mockClient.patch).toHaveBeenCalledWith(
      `${BASE}/reorder`,
      { order: ["s-2", "s-1"] },
    );
  });
});

describe("stepService.listAssigned", () => {
  it("should GET /workspaces/:id/steps/assigned", async () => {
    mockClient.get.mockResolvedValue({ data: { steps: [] } });
    await stepService(mockClient).listAssigned(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/steps/assigned`);
  });
});
