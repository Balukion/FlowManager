import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockListMembers = vi.fn();
const mockListInvitations = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ workspaceId: "ws-1" }),
}));

vi.mock("@web/hooks/use-api-client", () => ({
  useApiClient: () => ({}),
}));

vi.mock("@web/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@web/stores/workspace.store", () => ({
  useWorkspaceStore: () => ({
    currentWorkspace: { id: "ws-1", name: "Workspace Teste", owner_id: "owner-1" },
  }),
}));

const mockUseWorkspaceRole = vi.fn();
vi.mock("@web/hooks/use-workspace-role", () => ({
  useWorkspaceRole: (workspaceId: string) => mockUseWorkspaceRole(workspaceId),
}));

vi.mock("@web/services/workspace.service", () => ({
  workspaceService: () => ({
    listMembers: mockListMembers,
    removeMember: vi.fn(),
    updateMemberRole: vi.fn(),
  }),
}));

vi.mock("@web/services/invitation.service", () => ({
  invitationService: () => ({
    list: mockListInvitations,
    create: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock("@web/components/features/invitations/member-list", () => ({
  MemberList: () => <div>MemberList</div>,
}));

vi.mock("@web/components/features/invitations/invitation-list", () => ({
  InvitationList: () => <div>InvitationList</div>,
}));

vi.mock("@web/components/features/invitations/invite-member-form", () => ({
  InviteMemberForm: () => <div>InviteMemberForm</div>,
}));

import MembersPage from "./page";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MembersPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListMembers.mockResolvedValue({ data: { members: [] } });
  mockListInvitations.mockResolvedValue({ data: { invitations: [] } });
});

describe("MembersPage", () => {
  it("não deve buscar convites quando usuário não pode gerenciá-los", async () => {
    mockUseWorkspaceRole.mockReturnValue({ isAdminOrOwner: false });

    renderPage();

    await waitFor(() => {
      expect(mockListMembers).toHaveBeenCalledWith("ws-1");
    });

    expect(mockListInvitations).not.toHaveBeenCalled();
  });

  it("deve buscar convites quando usuário é admin ou owner", async () => {
    mockUseWorkspaceRole.mockReturnValue({ isAdminOrOwner: true });

    renderPage();

    await waitFor(() => {
      expect(mockListInvitations).toHaveBeenCalledWith("ws-1");
    });
  });
});
