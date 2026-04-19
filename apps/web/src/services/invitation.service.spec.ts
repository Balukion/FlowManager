import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { invitationService, previewInvitation } from "./invitation.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";
const INV_ID = "inv-1";

beforeEach(() => vi.clearAllMocks());

describe("invitationService.create", () => {
  it("should POST /workspaces/:id/invitations with email", async () => {
    mockClient.post.mockResolvedValue({ data: {} });
    await invitationService(mockClient).create(WS_ID, "joao@test.com");
    expect(mockClient.post).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/invitations`,
      { email: "joao@test.com" },
    );
  });
});

describe("invitationService.list", () => {
  it("should GET /workspaces/:id/invitations", async () => {
    mockClient.get.mockResolvedValue({ data: { invitations: [] } });
    await invitationService(mockClient).list(WS_ID);
    expect(mockClient.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/invitations`);
  });
});

describe("invitationService.cancel", () => {
  it("should DELETE /workspaces/:id/invitations/:invId", async () => {
    mockClient.delete.mockResolvedValue({});
    await invitationService(mockClient).cancel(WS_ID, INV_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/invitations/${INV_ID}`,
    );
  });
});

describe("invitationService.accept", () => {
  it("should POST /invitations/:token/accept", async () => {
    mockClient.post.mockResolvedValue({ data: {} });
    await invitationService(mockClient).accept("invite-token-abc");
    expect(mockClient.post).toHaveBeenCalledWith(
      `/invitations/invite-token-abc/accept`,
      {},
    );
  });
});

describe("invitationService.resend", () => {
  it("should POST /workspaces/:id/invitations/:invId/resend", async () => {
    mockClient.post.mockResolvedValue({ data: { invitation: {} } });
    await invitationService(mockClient).resend(WS_ID, INV_ID);
    expect(mockClient.post).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/invitations/${INV_ID}/resend`,
      {},
    );
  });
});

describe("previewInvitation", () => {
  it("should GET /invitations/preview?token=... without auth", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { workspace_name: "X", email: "a@b.com", invited_by_name: "Y" } });
    await previewInvitation("my-invite-token");
    expect(api.get).toHaveBeenCalledWith("/invitations/preview?token=my-invite-token");
  });
});
