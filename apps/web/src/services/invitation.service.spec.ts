import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { invitationService } from "./invitation.service.js";

const TOKEN = "bearer-token";
const WS_ID = "ws-1";
const INV_ID = "inv-1";

beforeEach(() => vi.clearAllMocks());

describe("invitationService.create", () => {
  it("should POST /workspaces/:id/invitations with email", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    await invitationService.create(WS_ID, "joao@test.com", TOKEN);
    expect(api.post).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/invitations`,
      { email: "joao@test.com" },
      TOKEN,
    );
  });
});

describe("invitationService.list", () => {
  it("should GET /workspaces/:id/invitations with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { invitations: [] } });
    await invitationService.list(WS_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(`/workspaces/${WS_ID}/invitations`, TOKEN);
  });
});

describe("invitationService.cancel", () => {
  it("should DELETE /workspaces/:id/invitations/:invId with token", async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    await invitationService.cancel(WS_ID, INV_ID, TOKEN);
    expect(api.delete).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/invitations/${INV_ID}`,
      TOKEN,
    );
  });
});

describe("invitationService.accept", () => {
  it("should POST /invitations/:token/accept with auth token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    await invitationService.accept("invite-token-abc", TOKEN);
    expect(api.post).toHaveBeenCalledWith(
      `/invitations/invite-token-abc/accept`,
      {},
      TOKEN,
    );
  });
});

describe("invitationService.resend", () => {
  it("should POST /workspaces/:id/invitations/:invId/resend with token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { invitation: {} } });
    await invitationService.resend(WS_ID, INV_ID, TOKEN);
    expect(api.post).toHaveBeenCalledWith(
      `/workspaces/${WS_ID}/invitations/${INV_ID}/resend`,
      {},
      TOKEN,
    );
  });
});

describe("invitationService.preview", () => {
  it("should GET /invitations/preview?token=... without auth", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { workspace_name: "X", email: "a@b.com", invited_by_name: "Y" } });
    await invitationService.preview("my-invite-token");
    expect(api.get).toHaveBeenCalledWith("/invitations/preview?token=my-invite-token");
  });
});
