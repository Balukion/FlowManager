import { describe, it, expect, vi, beforeEach } from "vitest";
import { taskService } from "./task.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";
const BASE = `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks`;

beforeEach(() => vi.clearAllMocks());

describe("taskService.list", () => {
  it("should GET tasks for a project", async () => {
    mockClient.get.mockResolvedValue({ data: { tasks: [] } });
    await taskService(mockClient).list(WS_ID, PROJ_ID);
    expect(mockClient.get).toHaveBeenCalledWith(BASE);
  });

  it("should append label_id filter to query string", async () => {
    mockClient.get.mockResolvedValue({ data: { tasks: [] } });
    await taskService(mockClient).list(WS_ID, PROJ_ID, { label_id: "lbl-1" });
    expect(mockClient.get).toHaveBeenCalledWith(`${BASE}?label_id=lbl-1`);
  });
});

describe("taskService.create", () => {
  it("should POST to tasks endpoint with data", async () => {
    mockClient.post.mockResolvedValue({ data: { task: {} } });
    await taskService(mockClient).create(WS_ID, PROJ_ID, { title: "Nova Tarefa", priority: "LOW" });
    expect(mockClient.post).toHaveBeenCalledWith(BASE, { title: "Nova Tarefa", priority: "LOW" });
  });
});

describe("taskService.update", () => {
  it("should PATCH task with data", async () => {
    mockClient.patch.mockResolvedValue({ data: { task: {} } });
    await taskService(mockClient).update(WS_ID, PROJ_ID, TASK_ID, { title: "Atualizada" });
    expect(mockClient.patch).toHaveBeenCalledWith(`${BASE}/${TASK_ID}`, { title: "Atualizada" });
  });
});

describe("taskService.updateStatus", () => {
  it("should PATCH task status endpoint", async () => {
    mockClient.patch.mockResolvedValue({ data: { task: {} } });
    await taskService(mockClient).updateStatus(WS_ID, PROJ_ID, TASK_ID, "DONE");
    expect(mockClient.patch).toHaveBeenCalledWith(`${BASE}/${TASK_ID}/status`, { status: "DONE" });
  });
});

describe("taskService.delete", () => {
  it("should DELETE task", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await taskService(mockClient).delete(WS_ID, PROJ_ID, TASK_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`${BASE}/${TASK_ID}`);
  });
});

describe("taskService.watch", () => {
  it("should POST to watch endpoint", async () => {
    mockClient.post.mockResolvedValue(undefined);
    await taskService(mockClient).watch(WS_ID, PROJ_ID, TASK_ID);
    expect(mockClient.post).toHaveBeenCalledWith(`${BASE}/${TASK_ID}/watch`, {});
  });
});

describe("taskService.unwatch", () => {
  it("should DELETE to watch endpoint", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await taskService(mockClient).unwatch(WS_ID, PROJ_ID, TASK_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`${BASE}/${TASK_ID}/watch`);
  });
});

describe("taskService.reorder", () => {
  it("should PATCH tasks/reorder with order array", async () => {
    mockClient.patch.mockResolvedValue({ data: {} });
    await taskService(mockClient).reorder(WS_ID, PROJ_ID, ["t-2", "t-1", "t-3"]);
    expect(mockClient.patch).toHaveBeenCalledWith(
      `${BASE}/reorder`,
      { order: ["t-2", "t-1", "t-3"] },
    );
  });
});

describe("taskService.assign", () => {
  it("should PATCH task assign with user_id", async () => {
    mockClient.patch.mockResolvedValue({ data: { task: {} } });
    await taskService(mockClient).assign(WS_ID, PROJ_ID, TASK_ID, "user-2");
    expect(mockClient.patch).toHaveBeenCalledWith(`${BASE}/${TASK_ID}/assign`, { user_id: "user-2" });
  });

  it("should PATCH task assign with null to unassign", async () => {
    mockClient.patch.mockResolvedValue({ data: { task: {} } });
    await taskService(mockClient).assign(WS_ID, PROJ_ID, TASK_ID, null);
    expect(mockClient.patch).toHaveBeenCalledWith(`${BASE}/${TASK_ID}/assign`, { user_id: null });
  });
});
