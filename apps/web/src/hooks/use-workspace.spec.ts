import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockList = vi.fn();

vi.mock("@web/hooks/use-api-client", () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock("@web/services/workspace.service", () => ({
  workspaceService: vi.fn(() => ({ list: mockList })),
}));

vi.mock("@web/stores/auth.store", () => ({
  useAuthStore: () => ({ accessToken: "token-123" }),
}));

import { useWorkspace } from "./use-workspace";
import { useWorkspaceStore } from "@web/stores/workspace.store";

const mockWorkspace = {
  id: "ws-1",
  name: "Minha Startup",
  slug: "minha-startup",
  description: null,
  color: "#2563eb",
  logo_url: null,
  owner_id: "user-1",
  settings: null,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  deleted_at: null,
};

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  useWorkspaceStore.setState({ currentWorkspace: null });
});

describe("useWorkspace", () => {
  it("should return workspaces from api", async () => {
    mockList.mockResolvedValue({ data: { workspaces: [mockWorkspace] } });
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.workspaces).toEqual([mockWorkspace]);
  });

  it("should return isLoading true while fetching", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it("selectWorkspace should update currentWorkspace in store", async () => {
    mockList.mockResolvedValue({ data: { workspaces: [] } });
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    act(() => { result.current.selectWorkspace(mockWorkspace); });
    await waitFor(() => {
      expect(result.current.currentWorkspace).toEqual(mockWorkspace);
    });
  });

  it("should return currentWorkspace already set in store", () => {
    mockList.mockResolvedValue({ data: { workspaces: [] } });
    useWorkspaceStore.setState({ currentWorkspace: mockWorkspace });
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    expect(result.current.currentWorkspace).toEqual(mockWorkspace);
  });

  it("should return empty array when no workspaces", async () => {
    mockList.mockResolvedValue({ data: { workspaces: [] } });
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.workspaces).toEqual([]);
  });

  it("should auto-select first workspace when currentWorkspace is null", async () => {
    mockList.mockResolvedValue({ data: { workspaces: [mockWorkspace] } });
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await waitFor(() => {
      expect(result.current.currentWorkspace).toEqual(mockWorkspace);
    });
  });

  it("should not override currentWorkspace if one is already selected", async () => {
    const otherWorkspace = { ...mockWorkspace, id: "ws-2", name: "Outro" };
    mockList.mockResolvedValue({
      data: { workspaces: [mockWorkspace, otherWorkspace] },
    });
    useWorkspaceStore.setState({ currentWorkspace: otherWorkspace });
    const { result } = renderHook(() => useWorkspace(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentWorkspace).toEqual(otherWorkspace);
  });
});
