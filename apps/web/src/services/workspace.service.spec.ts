import { describe, it, expect, vi, beforeEach } from "vitest";
import { workspaceService } from "./workspace.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";

beforeEach(() => vi.clearAllMocks());

describe("workspaceService.list", () => {
  it("should GET /workspaces", async () => {
    mockClient.get.mockResolvedValue({ data: { workspaces: [] } });
    await workspaceService(mockClient).list();
    expect(mockClient.get).toHaveBeenCalledWith("/workspaces");
  });
});

describe("workspaceService.get", () => {
  it("should GET /workspaces/:id", async () => {
    mockClient.get.mockResolvedValue({ data: { workspace: {} } });
    await workspaceService(mockClient).get(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}`);
  });
});

describe("workspaceService.create", () => {
  it("should POST /workspaces with data", async () => {
    mockClient.post.mockResolvedValue({ data: { workspace: {} } });
    await workspaceService(mockClient).create({ name: "Nova Empresa" });
    expect(mockClient.post).toHaveBeenCalledWith("/workspaces", { name: "Nova Empresa" });
  });
});

describe("workspaceService.update", () => {
  it("should PATCH /workspaces/:id with data", async () => {
    mockClient.patch.mockResolvedValue({ data: { workspace: {} } });
    await workspaceService(mockClient).update(WS_ID, { name: "Novo Nome" });
    expect(mockClient.patch).toHaveBeenCalledWith(`/workspaces/${WS_ID}`, { name: "Novo Nome" });
  });
});

describe("workspaceService.delete", () => {
  it("should DELETE /workspaces/:id", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await workspaceService(mockClient).delete(WS_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`/workspaces/${WS_ID}`);
  });
});

describe("workspaceService.updateLogo", () => {
  it("should PATCH /workspaces/:id/logo with logo_url", async () => {
    mockClient.patch.mockResolvedValue({ data: { workspace: {} } });
    await workspaceService(mockClient).updateLogo(WS_ID, "https://s3.example.com/logo.png");
    expect(mockClient.patch).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/logo`,
      { logo_url: "https://s3.example.com/logo.png" },
    );
  });
});

describe("workspaceService.listMembers", () => {
  it("should GET /workspaces/:id/members", async () => {
    mockClient.get.mockResolvedValue({ data: { members: [] } });
    await workspaceService(mockClient).listMembers(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/members`);
  });
});

describe("workspaceService.getMe", () => {
  it("should GET /workspaces/:id/me", async () => {
    mockClient.get.mockResolvedValue({ data: { member: {} } });
    await workspaceService(mockClient).getMe(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/me`);
  });
});
