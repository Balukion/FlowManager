import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelManager } from "./label-manager";

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@web/hooks/use-api-client", () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock("@web/services/label.service", () => ({
  labelService: vi.fn(() => ({
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
  })),
}));

const existingLabels = [
  { id: "label-1", name: "Bug", color: "#ef4444" },
  { id: "label-2", name: "Feature", color: "#22c55e" },
];

const defaultProps = {
  workspaceId: "ws-1",
  labels: existingLabels,
  canManage: true,
  onUpdate: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe("LabelManager", () => {
  it("renders existing labels", () => {
    render(<LabelManager {...defaultProps} />);
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
  });

  it("shows empty state when there are no labels", () => {
    render(<LabelManager {...defaultProps} labels={[]} />);
    expect(screen.getByText(/nenhuma label/i)).toBeInTheDocument();
  });

  it("creates a new label with name and color", async () => {
    mockCreate.mockResolvedValue({ data: { label: { id: "label-3", name: "Urgente", color: "#f97316" } } });
    const onUpdate = vi.fn();
    render(<LabelManager {...defaultProps} onUpdate={onUpdate} />);

    await userEvent.type(screen.getByPlaceholderText(/nome da label/i), "Urgente");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        "ws-1",
        expect.objectContaining({ name: "Urgente" }),
      );
    });
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
  });

  it("does not create label when name is empty", async () => {
    render(<LabelManager {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("enters edit mode when clicking edit button", async () => {
    render(<LabelManager {...defaultProps} />);
    const editButtons = screen.getAllByRole("button", { name: /editar/i });
    await userEvent.click(editButtons[0]);
    expect(screen.getByDisplayValue("Bug")).toBeInTheDocument();
  });

  it("saves edit and calls onUpdate", async () => {
    mockUpdate.mockResolvedValue(undefined);
    const onUpdate = vi.fn();
    render(<LabelManager {...defaultProps} onUpdate={onUpdate} />);

    await userEvent.click(screen.getAllByRole("button", { name: /editar/i })[0]);
    const input = screen.getByDisplayValue("Bug");
    await userEvent.clear(input);
    await userEvent.type(input, "Bug corrigido");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        "ws-1", "label-1", expect.objectContaining({ name: "Bug corrigido" }),
      );
    });
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
  });

  it("cancels edit without saving", async () => {
    render(<LabelManager {...defaultProps} />);
    await userEvent.click(screen.getAllByRole("button", { name: /editar/i })[0]);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByDisplayValue("Bug")).not.toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("deletes a label and calls onUpdate", async () => {
    mockDelete.mockResolvedValue(undefined);
    const onUpdate = vi.fn();
    render(<LabelManager {...defaultProps} onUpdate={onUpdate} />);

    await userEvent.click(screen.getAllByRole("button", { name: /excluir/i })[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("ws-1", "label-1");
    });
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
  });

  it("hides create form when canManage is false", () => {
    render(<LabelManager {...defaultProps} canManage={false} />);
    expect(screen.queryByRole("button", { name: /criar/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/nome da label/i)).not.toBeInTheDocument();
  });

  it("hides edit and delete buttons when canManage is false", () => {
    render(<LabelManager {...defaultProps} canManage={false} />);
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("hides create form by default (no canManage prop)", () => {
    render(<LabelManager workspaceId="ws-1" labels={existingLabels} onUpdate={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /criar/i })).not.toBeInTheDocument();
  });
});
