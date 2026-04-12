import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortableStepItem, type SortableStepItemProps } from "./sortable-step-item";

vi.mock("@dnd-kit/sortable", async () => {
  const actual = await vi.importActual<typeof import("@dnd-kit/sortable")>("@dnd-kit/sortable");
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  };
});

const step = {
  id: "step-1",
  task_id: "task-1",
  title: "Criar wireframe",
  status: "PENDING",
  order: 1,
  assignments: [
    { user_id: "user-1", user: { id: "user-1", name: "João Silva", avatar_url: null } },
  ],
};

const members = [
  { user_id: "user-1", user: { id: "user-1", name: "João Silva", email: "joao@test.com", avatar_url: null } },
  { user_id: "user-2", user: { id: "user-2", name: "Maria Souza", email: "maria@test.com", avatar_url: null } },
];

function makeProps(overrides: Partial<SortableStepItemProps> = {}): SortableStepItemProps {
  return {
    step,
    canDrag: false,
    canManageAssignments: true,
    members,
    openPickerFor: null,
    confirmDeleteFor: null,
    position: 1,
    onStatusChange: vi.fn(),
    onAssign: vi.fn(),
    onUnassign: vi.fn(),
    onDelete: vi.fn(),
    onOpenPicker: vi.fn(),
    onConfirmDelete: vi.fn(),
    ...overrides,
  };
}

describe("SortableStepItem", () => {
  it("renders step title", () => {
    render(<ul><SortableStepItem {...makeProps()} /></ul>);
    expect(screen.getByText("Criar wireframe")).toBeInTheDocument();
  });

  it("renders unchecked checkbox when status is PENDING", () => {
    render(<ul><SortableStepItem {...makeProps()} /></ul>);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders checked checkbox when status is DONE", () => {
    render(<ul><SortableStepItem {...makeProps({ step: { ...step, status: "DONE" } })} /></ul>);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onStatusChange with DONE when checkbox of PENDING step is clicked", async () => {
    const onStatusChange = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ onStatusChange })} /></ul>);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onStatusChange).toHaveBeenCalledWith("step-1", "DONE");
  });

  it("calls onStatusChange with PENDING when checkbox of DONE step is clicked", async () => {
    const onStatusChange = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ step: { ...step, status: "DONE" }, onStatusChange })} /></ul>);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onStatusChange).toHaveBeenCalledWith("step-1", "PENDING");
  });

  it("renders position number", () => {
    render(<ul><SortableStepItem {...makeProps({ position: 3 })} /></ul>);
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("shows drag handle when canDrag is true", () => {
    render(<ul><SortableStepItem {...makeProps({ canDrag: true })} /></ul>);
    expect(screen.getByRole("button", { name: /arrastar passo/i })).toBeInTheDocument();
  });

  it("hides drag handle when canDrag is false", () => {
    render(<ul><SortableStepItem {...makeProps({ canDrag: false })} /></ul>);
    expect(screen.queryByRole("button", { name: /arrastar passo/i })).not.toBeInTheDocument();
  });

  it("shows delete button when canManageAssignments is true", () => {
    render(<ul><SortableStepItem {...makeProps()} /></ul>);
    expect(screen.getByRole("button", { name: /deletar passo/i })).toBeInTheDocument();
  });

  it("hides delete button when canManageAssignments is false", () => {
    render(<ul><SortableStepItem {...makeProps({ canManageAssignments: false })} /></ul>);
    expect(screen.queryByRole("button", { name: /deletar passo/i })).not.toBeInTheDocument();
  });

  it("calls onConfirmDelete with step id when delete button is clicked", async () => {
    const onConfirmDelete = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ onConfirmDelete })} /></ul>);
    await userEvent.click(screen.getByRole("button", { name: /deletar passo/i }));
    expect(onConfirmDelete).toHaveBeenCalledWith("step-1");
  });

  it("shows confirm dialog when confirmDeleteFor matches step id", () => {
    render(<ul><SortableStepItem {...makeProps({ confirmDeleteFor: "step-1" })} /></ul>);
    expect(screen.getByText(/tem certeza/i)).toBeInTheDocument();
  });

  it("does not show confirm dialog when confirmDeleteFor is for another step", () => {
    render(<ul><SortableStepItem {...makeProps({ confirmDeleteFor: "step-99" })} /></ul>);
    expect(screen.queryByText(/tem certeza/i)).not.toBeInTheDocument();
  });

  it("calls onDelete and onConfirmDelete(null) when confirm is clicked", async () => {
    const onDelete = vi.fn();
    const onConfirmDelete = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ confirmDeleteFor: "step-1", onDelete, onConfirmDelete })} /></ul>);
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));
    expect(onDelete).toHaveBeenCalledWith("step-1");
    expect(onConfirmDelete).toHaveBeenCalledWith(null);
  });

  it("calls onConfirmDelete(null) when cancel is clicked", async () => {
    const onDelete = vi.fn();
    const onConfirmDelete = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ confirmDeleteFor: "step-1", onDelete, onConfirmDelete })} /></ul>);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(onConfirmDelete).toHaveBeenCalledWith(null);
  });

  it("renders assignee names", () => {
    render(<ul><SortableStepItem {...makeProps()} /></ul>);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("shows unassign button for each assignee when canManageAssignments is true", () => {
    render(<ul><SortableStepItem {...makeProps()} /></ul>);
    expect(screen.getByRole("button", { name: /remover João Silva/i })).toBeInTheDocument();
  });

  it("hides unassign buttons when canManageAssignments is false", () => {
    render(<ul><SortableStepItem {...makeProps({ canManageAssignments: false })} /></ul>);
    expect(screen.queryByRole("button", { name: /remover João Silva/i })).not.toBeInTheDocument();
  });

  it("calls onUnassign when unassign button is clicked", async () => {
    const onUnassign = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ onUnassign })} /></ul>);
    await userEvent.click(screen.getByRole("button", { name: /remover João Silva/i }));
    expect(onUnassign).toHaveBeenCalledWith("step-1", "user-1");
  });

  it("shows assign button when available members exist and canManageAssignments is true", () => {
    // step has user-1 assigned; user-2 is available
    render(<ul><SortableStepItem {...makeProps()} /></ul>);
    expect(screen.getByRole("button", { name: /atribuir/i })).toBeInTheDocument();
  });

  it("hides assign button when canManageAssignments is false", () => {
    render(<ul><SortableStepItem {...makeProps({ canManageAssignments: false })} /></ul>);
    expect(screen.queryByRole("button", { name: /atribuir/i })).not.toBeInTheDocument();
  });

  it("hides assign button when all members are already assigned", () => {
    const fullyAssigned = {
      ...step,
      assignments: [
        { user_id: "user-1", user: { id: "user-1", name: "João Silva", avatar_url: null } },
        { user_id: "user-2", user: { id: "user-2", name: "Maria Souza", avatar_url: null } },
      ],
    };
    render(<ul><SortableStepItem {...makeProps({ step: fullyAssigned })} /></ul>);
    expect(screen.queryByRole("button", { name: /atribuir/i })).not.toBeInTheDocument();
  });

  it("shows member dropdown when assign button is clicked (openPickerFor matches)", () => {
    render(<ul><SortableStepItem {...makeProps({ openPickerFor: "step-1" })} /></ul>);
    expect(screen.getByRole("button", { name: /Maria Souza/i })).toBeInTheDocument();
  });

  it("calls onOpenPicker to close when assign button is clicked while picker is open", async () => {
    const onOpenPicker = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ openPickerFor: "step-1", onOpenPicker })} /></ul>);
    await userEvent.click(screen.getByRole("button", { name: /atribuir/i }));
    expect(onOpenPicker).toHaveBeenCalledWith(null);
  });

  it("calls onOpenPicker with step id when assign button is clicked while picker is closed", async () => {
    const onOpenPicker = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ openPickerFor: null, onOpenPicker })} /></ul>);
    await userEvent.click(screen.getByRole("button", { name: /atribuir/i }));
    expect(onOpenPicker).toHaveBeenCalledWith("step-1");
  });

  it("calls onAssign and closes picker when member is selected", async () => {
    const onAssign = vi.fn();
    const onOpenPicker = vi.fn();
    render(<ul><SortableStepItem {...makeProps({ openPickerFor: "step-1", onAssign, onOpenPicker })} /></ul>);
    await userEvent.click(screen.getByRole("button", { name: /Maria Souza/i }));
    expect(onAssign).toHaveBeenCalledWith("step-1", "user-2");
    expect(onOpenPicker).toHaveBeenCalledWith(null);
  });
});
