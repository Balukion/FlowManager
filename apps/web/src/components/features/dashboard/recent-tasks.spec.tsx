import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentTasksList } from "./recent-tasks";

const tasks = [
  {
    id: "1",
    title: "Criar landing page",
    status: "TODO",
    priority: "HIGH",
    deadline: null,
    created_at: new Date("2026-01-01"),
  },
  {
    id: "2",
    title: "Revisar PRs",
    status: "IN_PROGRESS",
    priority: "LOW",
    deadline: null,
    created_at: new Date("2026-01-02"),
  },
  {
    id: "3",
    title: "Deploy para produção",
    status: "DONE",
    priority: "MEDIUM",
    deadline: null,
    created_at: new Date("2026-01-03"),
  },
];

describe("RecentTasksList", () => {
  it("renders task titles", () => {
    render(<RecentTasksList tasks={tasks} />);
    expect(screen.getByText("Criar landing page")).toBeInTheDocument();
    expect(screen.getByText("Revisar PRs")).toBeInTheDocument();
    expect(screen.getByText("Deploy para produção")).toBeInTheDocument();
  });

  it("renders status labels in portuguese", () => {
    render(<RecentTasksList tasks={tasks} />);
    expect(screen.getByText("A fazer")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("Concluída")).toBeInTheDocument();
  });

  it("shows empty state when no tasks", () => {
    render(<RecentTasksList tasks={[]} />);
    expect(screen.getByText("Nenhuma tarefa recente")).toBeInTheDocument();
  });
});
