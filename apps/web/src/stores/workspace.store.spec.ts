import { describe, it, expect, beforeEach } from "vitest";
import { useWorkspaceStore } from "./workspace.store.js";
import type { Workspace } from "@flowmanager/types";

const mockWorkspace: Workspace = {
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

beforeEach(() => {
  useWorkspaceStore.setState({ currentWorkspace: null });
});

describe("useWorkspaceStore", () => {
  it("should start with null currentWorkspace", () => {
    expect(useWorkspaceStore.getState().currentWorkspace).toBeNull();
  });

  it("setCurrentWorkspace should update the current workspace", () => {
    useWorkspaceStore.getState().setCurrentWorkspace(mockWorkspace);
    expect(useWorkspaceStore.getState().currentWorkspace).toEqual(mockWorkspace);
  });

  it("setCurrentWorkspace(null) should clear the workspace", () => {
    useWorkspaceStore.getState().setCurrentWorkspace(mockWorkspace);
    useWorkspaceStore.getState().setCurrentWorkspace(null);
    expect(useWorkspaceStore.getState().currentWorkspace).toBeNull();
  });
});
