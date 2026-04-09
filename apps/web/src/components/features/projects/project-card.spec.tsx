import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "./project-card";

const mockProject = {
  id: "proj-1",
  workspace_id: "ws-1",
  owner_id: "user-1",
  name: "App Mobile",
  slug: "app-mobile",
  description: "Aplicativo iOS e Android",
  color: "#16a34a",
  status: "ACTIVE" as const,
  deadline: null,
  created_by: "user-1",
  archived_at: null,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  deleted_at: null,
};

describe("ProjectCard", () => {
  it("renders project name", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} />);
    expect(screen.getByText("App Mobile")).toBeInTheDocument();
  });

  it("renders project description", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} />);
    expect(screen.getByText("Aplicativo iOS e Android")).toBeInTheDocument();
  });

  it("renders fallback when no description", () => {
    render(<ProjectCard project={{ ...mockProject, description: null }} onClick={vi.fn()} />);
    expect(screen.getByText("Sem descrição")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<ProjectCard project={mockProject} onClick={onClick} />);
    await userEvent.click(screen.getByText("App Mobile"));
    expect(onClick).toHaveBeenCalledWith(mockProject);
  });
});
