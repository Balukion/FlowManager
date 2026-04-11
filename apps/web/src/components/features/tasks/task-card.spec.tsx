import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "./task-card";

const mockTask = {
  id: "task-1",
  project_id: "proj-1",
  assignee_id: null,
  title: "Implementar login",
  number: 1,
  description: null,
  status: "TODO" as const,
  priority: "HIGH" as const,
  order: 1,
  deadline: null,
  due_reminder_sent_at: null,
  status_is_manual: false,
  status_overridden_by: null,
  status_overridden_at: null,
  created_by: "user-1",
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  deleted_at: null,
};

describe("TaskCard", () => {
  it("renders task title", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} />);
    expect(screen.getByText("Implementar login")).toBeInTheDocument();
  });

  it("renders status in portuguese", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} />);
    expect(screen.getByText("A fazer")).toBeInTheDocument();
  });

  it("renders priority in portuguese", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} />);
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={onClick} />);
    await userEvent.click(screen.getByText("Implementar login"));
    expect(onClick).toHaveBeenCalledWith(mockTask);
  });

  it("renders label badges when task has labels", () => {
    const taskWithLabels = {
      ...mockTask,
      task_labels: [
        { label: { id: "l1", name: "Bug", color: "#ef4444" } },
        { label: { id: "l2", name: "Urgente", color: "#f97316" } },
      ],
    };
    render(<TaskCard task={taskWithLabels as any} onClick={vi.fn()} />);
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("renders nothing for labels when task has none", () => {
    render(<TaskCard task={{ ...mockTask, task_labels: [] } as any} onClick={vi.fn()} />);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("renders position as #N when provided", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} position={3} />);
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("does not render position badge when position is not provided", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} />);
    expect(screen.queryByText(/#\d/)).not.toBeInTheDocument();
  });
});
