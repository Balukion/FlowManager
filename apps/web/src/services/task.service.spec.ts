import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { taskService } from "./task.service.js";

const TOKEN = "bearer-token";
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";
const BASE = `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks`;

beforeEach(() => vi.clearAllMocks());

describe("taskService.list", () => {
  it("should GET tasks for a project with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tasks: [] } });
    await taskService.list(WS_ID, PROJ_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(BASE, TOKEN);
  });
});

describe("taskService.create", () => {
  it("should POST to tasks endpoint with data and token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { task: {} } });
    await taskService.create(WS_ID, PROJ_ID, { title: "Nova Tarefa", priority: "LOW" }, TOKEN);
    expect(api.post).toHaveBeenCalledWith(BASE, { title: "Nova Tarefa", priority: "LOW" }, TOKEN);
  });
});

describe("taskService.update", () => {
  it("should PATCH task with data and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { task: {} } });
    await taskService.update(WS_ID, PROJ_ID, TASK_ID, { title: "Atualizada" }, TOKEN);
    expect(api.patch).toHaveBeenCalledWith(`${BASE}/${TASK_ID}`, { title: "Atualizada" }, TOKEN);
  });
});

describe("taskService.updateStatus", () => {
  it("should PATCH task status endpoint", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { task: {} } });
    await taskService.updateStatus(WS_ID, PROJ_ID, TASK_ID, "DONE", TOKEN);
    expect(api.patch).toHaveBeenCalledWith(`${BASE}/${TASK_ID}/status`, { status: "DONE" }, TOKEN);
  });
});

describe("taskService.delete", () => {
  it("should DELETE task with token", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await taskService.delete(WS_ID, PROJ_ID, TASK_ID, TOKEN);
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/${TASK_ID}`, TOKEN);
  });
});
