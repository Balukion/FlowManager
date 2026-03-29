import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { workspaceService } from "./workspace.service.js";

const TOKEN = "bearer-token";

beforeEach(() => vi.clearAllMocks());

describe("workspaceService.list", () => {
  it("should GET /workspaces with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { workspaces: [] } });
    await workspaceService.list(TOKEN);
    expect(api.get).toHaveBeenCalledWith("/workspaces", TOKEN);
  });
});

describe("workspaceService.get", () => {
  it("should GET /workspaces/:id with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { workspace: {} } });
    await workspaceService.get("ws-1", TOKEN);
    expect(api.get).toHaveBeenCalledWith("/workspaces/ws-1", TOKEN);
  });
});

describe("workspaceService.create", () => {
  it("should POST /workspaces with data and token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { workspace: {} } });
    await workspaceService.create({ name: "Nova Empresa" }, TOKEN);
    expect(api.post).toHaveBeenCalledWith("/workspaces", { name: "Nova Empresa" }, TOKEN);
  });
});

describe("workspaceService.update", () => {
  it("should PATCH /workspaces/:id with data and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { workspace: {} } });
    await workspaceService.update("ws-1", { name: "Novo Nome" }, TOKEN);
    expect(api.patch).toHaveBeenCalledWith("/workspaces/ws-1", { name: "Novo Nome" }, TOKEN);
  });
});

describe("workspaceService.delete", () => {
  it("should DELETE /workspaces/:id with token", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await workspaceService.delete("ws-1", TOKEN);
    expect(api.delete).toHaveBeenCalledWith("/workspaces/ws-1", TOKEN);
  });
});

describe("workspaceService.updateLogo", () => {
  it("should PATCH /workspaces/:id/logo with logo_url and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { workspace: {} } });
    await workspaceService.updateLogo("ws-1", "https://s3.example.com/logo.png", TOKEN);
    expect(api.patch).toHaveBeenCalledWith(
      "/workspaces/ws-1/logo",
      { logo_url: "https://s3.example.com/logo.png" },
      TOKEN,
    );
  });
});
