import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { projectService } from "./project.service.js";

const TOKEN = "bearer-token";
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";

beforeEach(() => vi.clearAllMocks());

describe("projectService.list", () => {
  it("should GET /workspaces/:wsId/projects with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { projects: [] } });
    await projectService.list(WS_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects`, TOKEN);
  });
});

describe("projectService.get", () => {
  it("should GET /workspaces/:wsId/projects/:id with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { project: {} } });
    await projectService.get(WS_ID, PROJ_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects/${PROJ_ID}`, TOKEN);
  });
});

describe("projectService.create", () => {
  it("should POST to /workspaces/:wsId/projects with data and token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { project: {} } });
    await projectService.create(WS_ID, { name: "Novo Projeto" }, TOKEN);
    expect(api.post).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects`, { name: "Novo Projeto" }, TOKEN);
  });
});

describe("projectService.update", () => {
  it("should PATCH /workspaces/:wsId/projects/:id with data and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { project: {} } });
    await projectService.update(WS_ID, PROJ_ID, { name: "Renomeado" }, TOKEN);
    expect(api.patch).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects/${PROJ_ID}`, { name: "Renomeado" }, TOKEN);
  });
});

describe("projectService.delete", () => {
  it("should DELETE /workspaces/:wsId/projects/:id with token", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await projectService.delete(WS_ID, PROJ_ID, TOKEN);
    expect(api.delete).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects/${PROJ_ID}`, TOKEN);
  });
});
