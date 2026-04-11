import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SortableTaskList } from "./sortable-task-list";
import type { Task } from "@flowmanager/types";

const tasks: (Task & { task_labels?: [] })[] = [
  {
    id: "t-1",
    project_id: "proj-1",
    number: 1,
    title: "Tarefa A",
    description: null,
    status: "TODO",
    priority: "LOW",
    status_is_manual: false,
    deadline: null,
    due_reminder_sent_at: null,
    order: 1,
    assignee_id: null,
    created_by: "user-1",
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    task_labels: [],
  },
  {
    id: "t-2",
    project_id: "proj-1",
    number: 2,
    title: "Tarefa B",
    description: null,
    status: "IN_PROGRESS",
    priority: "HIGH",
    status_is_manual: false,
    deadline: null,
    due_reminder_sent_at: null,
    order: 2,
    assignee_id: null,
    created_by: "user-1",
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    task_labels: [],
  },
];

describe("SortableTaskList", () => {
  it("renders all task titles", () => {
    render(<SortableTaskList tasks={tasks} onTaskClick={vi.fn()} />);
    expect(screen.getByText("Tarefa A")).toBeInTheDocument();
    expect(screen.getByText("Tarefa B")).toBeInTheDocument();
  });

  it("shows drag handle for each task when canReorder and onReorder are provided", () => {
    render(
      <SortableTaskList tasks={tasks} onTaskClick={vi.fn()} canReorder onReorder={vi.fn()} />,
    );
    const handles = screen.getAllByRole("button", { name: /arrastar tarefa/i });
    expect(handles).toHaveLength(2);
  });

  it("does not show drag handles when canReorder is false", () => {
    render(
      <SortableTaskList tasks={tasks} onTaskClick={vi.fn()} canReorder={false} onReorder={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /arrastar tarefa/i })).not.toBeInTheDocument();
  });

  it("does not show drag handles when onReorder is not provided", () => {
    render(<SortableTaskList tasks={tasks} onTaskClick={vi.fn()} canReorder />);
    expect(screen.queryByRole("button", { name: /arrastar tarefa/i })).not.toBeInTheDocument();
  });

  it("calls onTaskClick when a task is clicked", async () => {
    const onTaskClick = vi.fn();
    const { getByText } = render(
      <SortableTaskList tasks={tasks} onTaskClick={onTaskClick} />,
    );
    getByText("Tarefa A").closest("button")?.click();
    expect(onTaskClick).toHaveBeenCalledWith(tasks[0]);
  });

  it("renders #1 for first task and #2 for second task", () => {
    render(<SortableTaskList tasks={tasks} onTaskClick={vi.fn()} />);
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("numbers reflect array order regardless of task.number field", () => {
    const reversed = [tasks[1], tasks[0]]; // task B first, task A second
    render(<SortableTaskList tasks={reversed} onTaskClick={vi.fn()} />);
    // #1 must be associated with "Tarefa B" (first in array)
    const card1 = screen.getByText("#1").closest("button");
    expect(card1).toHaveTextContent("Tarefa B");
    const card2 = screen.getByText("#2").closest("button");
    expect(card2).toHaveTextContent("Tarefa A");
  });
});
