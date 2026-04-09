import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardStats } from "./dashboard-stats";

const stats = {
  tasks: { total: 10, todo: 3, in_progress: 2, done: 5, overdue: 1 },
  members_count: 4,
};

describe("DashboardStats", () => {
  it("renders total tasks count", () => {
    render(<DashboardStats {...stats} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders todo count", () => {
    render(<DashboardStats {...stats} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders in_progress count", () => {
    render(<DashboardStats {...stats} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders done count", () => {
    render(<DashboardStats {...stats} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders overdue count", () => {
    render(<DashboardStats {...stats} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders members count", () => {
    render(<DashboardStats {...stats} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders stat labels", () => {
    render(<DashboardStats {...stats} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("A fazer")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("Concluídas")).toBeInTheDocument();
    expect(screen.getByText("Atrasadas")).toBeInTheDocument();
    expect(screen.getByText("Membros")).toBeInTheDocument();
  });
});
