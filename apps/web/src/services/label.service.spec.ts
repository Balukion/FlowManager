import { describe, it, expect, vi, beforeEach } from "vitest";
import { labelService } from "./label.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";
const LABEL_ID = "label-1";

beforeEach(() => vi.clearAllMocks());

describe("labelService.list", () => {
  it("should GET labels for a workspace", async () => {
    mockClient.get.mockResolvedValue({ data: { labels: [] } });
    await labelService(mockClient).list(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/labels`);
  });
});

describe("labelService.create", () => {
  it("should POST to labels endpoint with name and color", async () => {
    mockClient.post.mockResolvedValue({ data: { label: {} } });
    await labelService(mockClient).create(WS_ID, { name: "Bug", color: "#ef4444" });
    expect(mockClient.post).toHaveBeenCalledWith(`/workspaces/${WS_ID}/labels`, { name: "Bug", color: "#ef4444" });
  });
});

describe("labelService.update", () => {
  it("should PATCH label with new data", async () => {
    mockClient.patch.mockResolvedValue({ data: { label: {} } });
    await labelService(mockClient).update(WS_ID, LABEL_ID, { name: "Bug corrigido" });
    expect(mockClient.patch).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/labels/${LABEL_ID}`,
      { name: "Bug corrigido" },
    );
  });
});

describe("labelService.delete", () => {
  it("should DELETE a label", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await labelService(mockClient).delete(WS_ID, LABEL_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`/workspaces/${WS_ID}/labels/${LABEL_ID}`);
  });
});

describe("labelService.applyToTask", () => {
  it("should POST label_id to task labels endpoint", async () => {
    mockClient.post.mockResolvedValue(undefined);
    await labelService(mockClient).applyToTask(WS_ID, PROJ_ID, TASK_ID, LABEL_ID);
    expect(mockClient.post).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/labels`,
      { label_id: LABEL_ID },
    );
  });
});

describe("labelService.removeFromTask", () => {
  it("should DELETE label from task", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await labelService(mockClient).removeFromTask(WS_ID, PROJ_ID, TASK_ID, LABEL_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/labels/${LABEL_ID}`,
    );
  });
});
