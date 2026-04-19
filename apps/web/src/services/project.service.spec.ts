import { describe, it, expect, vi, beforeEach } from "vitest";
import { projectService } from "./project.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";

beforeEach(() => vi.clearAllMocks());

describe("projectService.list", () => {
  it("should GET /workspaces/:wsId/projects", async () => {
    mockClient.get.mockResolvedValue({ data: { projects: [] } });
    await projectService(mockClient).list(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects`);
  });
});

describe("projectService.get", () => {
  it("should GET /workspaces/:wsId/projects/:id", async () => {
    mockClient.get.mockResolvedValue({ data: { project: {} } });
    await projectService(mockClient).get(WS_ID, PROJ_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects/${PROJ_ID}`);
  });
});

describe("projectService.create", () => {
  it("should POST to /workspaces/:wsId/projects with data", async () => {
    mockClient.post.mockResolvedValue({ data: { project: {} } });
    await projectService(mockClient).create(WS_ID, { name: "Novo Projeto" });
    expect(mockClient.post).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects`, { name: "Novo Projeto" });
  });
});

describe("projectService.update", () => {
  it("should PATCH /workspaces/:wsId/projects/:id with data", async () => {
    mockClient.patch.mockResolvedValue({ data: { project: {} } });
    await projectService(mockClient).update(WS_ID, PROJ_ID, { name: "Renomeado" });
    expect(mockClient.patch).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects/${PROJ_ID}`, { name: "Renomeado" });
  });
});

describe("projectService.delete", () => {
  it("should DELETE /workspaces/:wsId/projects/:id", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await projectService(mockClient).delete(WS_ID, PROJ_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects/${PROJ_ID}`);
  });
});

describe("projectService.archive", () => {
  it("should PATCH /workspaces/:wsId/projects/:id/archive", async () => {
    mockClient.patch.mockResolvedValue({ data: { project: {} } });
    await projectService(mockClient).archive(WS_ID, PROJ_ID);
    expect(mockClient.patch).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/archive`, {},
    );
  });
});

describe("projectService.unarchive", () => {
  it("should PATCH /workspaces/:wsId/projects/:id/unarchive", async () => {
    mockClient.patch.mockResolvedValue({ data: { project: {} } });
    await projectService(mockClient).unarchive(WS_ID, PROJ_ID);
    expect(mockClient.patch).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/projects/${PROJ_ID}/unarchive`, {},
    );
  });
});

describe("projectService.listArchived", () => {
  it("should GET /workspaces/:wsId/projects/archived", async () => {
    mockClient.get.mockResolvedValue({ data: { projects: [] } });
    await projectService(mockClient).listArchived(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/projects/archived`);
  });
});
