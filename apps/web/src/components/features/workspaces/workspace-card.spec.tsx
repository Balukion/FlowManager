import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCard } from "./workspace-card";

const mockWorkspace = {
  id: "ws-1",
  name: "Minha Startup",
  slug: "minha-startup",
  description: "Workspace principal",
  color: "#2563eb",
  logo_url: null,
  owner_id: "user-1",
  settings: null,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  deleted_at: null,
};

describe("WorkspaceCard", () => {
  it("renders workspace name", () => {
    render(<WorkspaceCard workspace={mockWorkspace} onClick={vi.fn()} />);
    expect(screen.getByText("Minha Startup")).toBeInTheDocument();
  });

  it("renders workspace description", () => {
    render(<WorkspaceCard workspace={mockWorkspace} onClick={vi.fn()} />);
    expect(screen.getByText("Workspace principal")).toBeInTheDocument();
  });

  it("renders fallback when no description", () => {
    render(<WorkspaceCard workspace={{ ...mockWorkspace, description: null }} onClick={vi.fn()} />);
    expect(screen.getByText("Sem descrição")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<WorkspaceCard workspace={mockWorkspace} onClick={onClick} />);
    await userEvent.click(screen.getByText("Minha Startup"));
    expect(onClick).toHaveBeenCalledWith(mockWorkspace);
  });
});
