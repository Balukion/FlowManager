import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGetMe = vi.fn();

vi.mock("@web/hooks/use-api-client", () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock("@web/services/workspace.service", () => ({
  workspaceService: vi.fn(() => ({ getMe: mockGetMe })),
}));

vi.mock("@web/stores/auth.store", () => ({
  useAuthStore: () => ({ accessToken: "token-123", user: { id: "user-owner" } }),
}));

import { useWorkspaceStore } from "@web/stores/workspace.store";
import { useWorkspaceRole } from "./use-workspace-role";

const mockWorkspace = {
  id: "ws-1",
  name: "Minha Startup",
  slug: "minha-startup",
  description: null,
  color: "#2563eb",
  logo_url: null,
  owner_id: "user-owner",
  settings: null,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  deleted_at: null,
};

const makeMember = (overrides: { user_id: string; role: string }) => ({
  id: "member-1",
  workspace_id: "ws-1",
  user_id: overrides.user_id,
  role: overrides.role,
  position: null,
  last_seen_at: null,
  joined_at: new Date("2026-01-01"),
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.setState({ currentWorkspace: mockWorkspace });
});

describe("useWorkspaceRole", () => {
  it("owner sem role ADMIN → isOwner: true, isAdminOrOwner: true, isAdmin: false", async () => {
    mockGetMe.mockResolvedValue({
      data: { member: makeMember({ user_id: "user-owner", role: "MEMBER" }) },
    });

    const { result } = renderHook(() => useWorkspaceRole("ws-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isOwner).toBe(true);
    expect(result.current.isAdminOrOwner).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isMember).toBe(true);
  });

  it("admin sem ser owner → isAdmin: true, isAdminOrOwner: true, isOwner: false", async () => {
    mockGetMe.mockResolvedValue({
      data: { member: makeMember({ user_id: "user-owner", role: "ADMIN" }) },
    });

    useWorkspaceStore.setState({
      currentWorkspace: { ...mockWorkspace, owner_id: "other-user" },
    });

    const { result } = renderHook(() => useWorkspaceRole("ws-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isAdminOrOwner).toBe(true);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isMember).toBe(true);
  });

  it("membro simples → isMember: true, isAdmin: false, isOwner: false, isAdminOrOwner: false", async () => {
    mockGetMe.mockResolvedValue({
      data: { member: makeMember({ user_id: "user-owner", role: "MEMBER" }) },
    });

    useWorkspaceStore.setState({
      currentWorkspace: { ...mockWorkspace, owner_id: "other-user" },
    });

    const { result } = renderHook(() => useWorkspaceRole("ws-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isMember).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdminOrOwner).toBe(false);
  });

  it("usuário não membro → currentMember null, isMember: false", async () => {
    mockGetMe.mockResolvedValue({
      data: { member: null },
    });

    useWorkspaceStore.setState({
      currentWorkspace: { ...mockWorkspace, owner_id: "another-user" },
    });

    const { result } = renderHook(() => useWorkspaceRole("ws-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isMember).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdminOrOwner).toBe(false);
    expect(result.current.currentMember).toBeNull();
  });

  it("isLoading: true enquanto a query ainda não resolveu", () => {
    mockGetMe.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useWorkspaceRole("ws-1"), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
