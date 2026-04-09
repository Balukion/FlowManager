import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepList } from "./step-list";

interface Assignee {
  user_id: string;
  user: { id: string; name: string; avatar_url: string | null };
}

interface StepWithAssignments {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  status: "DONE" | "PENDING" | "IN_PROGRESS";
  order: number;
  deadline: Date | null;
  due_reminder_sent_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  assignments?: Assignee[];
}

const steps: StepWithAssignments[] = [
  {
    id: "step-1",
    task_id: "task-1",
    title: "Criar wireframe",
    description: null,
    status: "DONE",
    order: 1,
    deadline: null,
    due_reminder_sent_at: null,
    created_by: "user-1",
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    assignments: [
      { user_id: "user-1", user: { id: "user-1", name: "João Silva", avatar_url: null } },
    ],
  },
  {
    id: "step-2",
    task_id: "task-1",
    title: "Desenvolver tela",
    description: null,
    status: "PENDING",
    order: 2,
    deadline: null,
    due_reminder_sent_at: null,
    created_by: "user-1",
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    assignments: [],
  },
];

const members = [
  { user_id: "user-1", user: { id: "user-1", name: "João Silva", email: "joao@test.com", avatar_url: null } },
  { user_id: "user-2", user: { id: "user-2", name: "Maria Souza", email: "maria@test.com", avatar_url: null } },
];

describe("StepList", () => {
  it("renders step titles", () => {
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />);
    expect(screen.getByText("Criar wireframe")).toBeInTheDocument();
    expect(screen.getByText("Desenvolver tela")).toBeInTheDocument();
  });

  it("shows empty state when no steps", () => {
    render(<StepList steps={[]} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />);
    expect(screen.getByText("Nenhum passo cadastrado")).toBeInTheDocument();
  });

  it("calls onStatusChange when checkbox is clicked", async () => {
    const onStatusChange = vi.fn();
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={onStatusChange} onAssign={vi.fn()} onUnassign={vi.fn()} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[1]);
    expect(onStatusChange).toHaveBeenCalledWith("step-2", "DONE");
  });

  it("renders done step with checkbox checked", () => {
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("shows assignee names for steps with assignments", () => {
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("shows assign button for steps that have available members to assign", () => {
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} />);
    // Both steps have available members — step-1 has João but not Maria; step-2 has neither
    const buttons = screen.getAllByRole("button", { name: /atribuir/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("calls onAssign when member is selected from dropdown", async () => {
    const onAssign = vi.fn();
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={onAssign} onUnassign={vi.fn()} />);
    // Click the last "Atribuir" button — step-2 (no assignments), both members available
    const atribuirButtons = screen.getAllByRole("button", { name: /atribuir/i });
    await userEvent.click(atribuirButtons[atribuirButtons.length - 1]);
    // Pick member from dropdown
    await userEvent.click(screen.getByRole("button", { name: /Maria Souza/i }));
    expect(onAssign).toHaveBeenCalledWith("step-2", "user-2");
  });

  it("calls onUnassign when remove assignee is clicked", async () => {
    const onUnassign = vi.fn();
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={onUnassign} />);
    await userEvent.click(screen.getByRole("button", { name: /remover João Silva/i }));
    expect(onUnassign).toHaveBeenCalledWith("step-1", "user-1");
  });

  it("não exibe botões de assign/unassign quando canManageAssignments é false", () => {
    render(<StepList steps={steps} members={members} canManageAssignments={false} onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /atribuir/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remover João/i })).not.toBeInTheDocument();
  });

  it("shows delete button per step when canManageAssignments is true", () => {
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} onDelete={vi.fn()} />);
    const deleteButtons = screen.getAllByRole("button", { name: /deletar passo/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it("hides delete buttons when canManageAssignments is false", () => {
    render(<StepList steps={steps} members={members} canManageAssignments={false} onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /deletar passo/i })).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting", async () => {
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} onDelete={vi.fn()} />);
    const [firstDelete] = screen.getAllByRole("button", { name: /deletar passo/i });
    await userEvent.click(firstDelete);
    expect(screen.getByText(/tem certeza/i)).toBeInTheDocument();
  });

  it("calls onDelete when confirm is clicked", async () => {
    const onDelete = vi.fn();
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} onDelete={onDelete} />);
    const [firstDelete] = screen.getAllByRole("button", { name: /deletar passo/i });
    await userEvent.click(firstDelete);
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onDelete).toHaveBeenCalledWith("step-1");
  });

  it("cancels delete when cancel is clicked", async () => {
    const onDelete = vi.fn();
    render(<StepList steps={steps} members={members} canManageAssignments onStatusChange={vi.fn()} onAssign={vi.fn()} onUnassign={vi.fn()} onDelete={onDelete} />);
    const [firstDelete] = screen.getAllByRole("button", { name: /deletar passo/i });
    await userEvent.click(firstDelete);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/tem certeza/i)).not.toBeInTheDocument();
  });
});
