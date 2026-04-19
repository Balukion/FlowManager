import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskLabels } from "./task-labels";

const mockApplyToTask = vi.fn();
const mockRemoveFromTask = vi.fn();

vi.mock("@web/hooks/use-api-client", () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock("@web/services/label.service", () => ({
  labelService: vi.fn(() => ({
    applyToTask: mockApplyToTask,
    removeFromTask: mockRemoveFromTask,
  })),
}));

const workspaceLabels = [
  { id: "label-1", name: "Bug", color: "#ef4444" },
  { id: "label-2", name: "Feature", color: "#22c55e" },
  { id: "label-3", name: "Urgente", color: "#f97316" },
];

const defaultProps = {
  workspaceId: "ws-1",
  projectId: "proj-1",
  taskId: "task-1",
  workspaceLabels,
  taskLabels: [] as typeof workspaceLabels,
  canManage: true,
  onUpdate: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe("TaskLabels", () => {
  it("renders applied labels as badges", () => {
    render(
      <TaskLabels
        {...defaultProps}
        taskLabels={[{ id: "label-1", name: "Bug", color: "#ef4444" }]}
      />,
    );
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("shows empty state when no labels applied", () => {
    render(<TaskLabels {...defaultProps} taskLabels={[]} />);
    expect(screen.getByText(/nenhuma label/i)).toBeInTheDocument();
  });

  it("opens dropdown with available workspace labels when clicking add", async () => {
    render(<TaskLabels {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /adicionar label/i }));
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("hides already applied labels from the dropdown", async () => {
    render(
      <TaskLabels
        {...defaultProps}
        taskLabels={[{ id: "label-1", name: "Bug", color: "#ef4444" }]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /adicionar label/i }));
    const items = screen.getAllByText("Bug");
    // Bug aparece como badge aplicado, mas NÃO aparece no dropdown
    expect(items).toHaveLength(1);
    expect(screen.getByText("Feature")).toBeInTheDocument();
  });

  it("calls applyToTask and onUpdate when selecting a label from dropdown", async () => {
    mockApplyToTask.mockResolvedValue(undefined);
    const onUpdate = vi.fn();
    render(<TaskLabels {...defaultProps} onUpdate={onUpdate} />);

    await userEvent.click(screen.getByRole("button", { name: /adicionar label/i }));
    await userEvent.click(screen.getByRole("button", { name: "Bug" }));

    await waitFor(() => {
      expect(mockApplyToTask).toHaveBeenCalledWith(
        "ws-1", "proj-1", "task-1", "label-1",
      );
    });
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("calls removeFromTask and onUpdate when clicking remove on a badge", async () => {
    mockRemoveFromTask.mockResolvedValue(undefined);
    const onUpdate = vi.fn();
    render(
      <TaskLabels
        {...defaultProps}
        taskLabels={[{ id: "label-1", name: "Bug", color: "#ef4444" }]}
        onUpdate={onUpdate}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /remover label Bug/i }));

    await waitFor(() => {
      expect(mockRemoveFromTask).toHaveBeenCalledWith(
        "ws-1", "proj-1", "task-1", "label-1",
      );
    });
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it("shows message when all workspace labels are already applied", async () => {
    render(<TaskLabels {...defaultProps} taskLabels={workspaceLabels} />);
    await userEvent.click(screen.getByRole("button", { name: /adicionar label/i }));
    expect(screen.getByText(/todas as labels já foram aplicadas/i)).toBeInTheDocument();
  });

  it("não exibe botão de adicionar label quando canManage é false", () => {
    render(<TaskLabels {...defaultProps} canManage={false} />);
    expect(screen.queryByRole("button", { name: /adicionar label/i })).not.toBeInTheDocument();
  });

  it("não exibe botão de remover label quando canManage é false", () => {
    render(
      <TaskLabels
        {...defaultProps}
        canManage={false}
        taskLabels={[{ id: "label-1", name: "Bug", color: "#ef4444" }]}
      />,
    );
    expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", async () => {
    render(<TaskLabels {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /adicionar label/i }));
    expect(screen.getByText("Feature")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("Feature")).not.toBeInTheDocument();
    });
  });
});
