import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateEntityForm } from "./create-entity-form";

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
  namePlaceholder: "Nome da entidade",
  idPrefix: "entity",
};

beforeEach(() => vi.clearAllMocks());

describe("CreateEntityForm", () => {
  it("renders name input and submit button", () => {
    render(<CreateEntityForm {...defaultProps} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar/i })).toBeInTheDocument();
  });

  it("renders the provided namePlaceholder", () => {
    render(<CreateEntityForm {...defaultProps} namePlaceholder="Nome do widget" />);
    expect(screen.getByPlaceholderText("Nome do widget")).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    render(<CreateEntityForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed name and optional description", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<CreateEntityForm {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "  Minha Entidade  ");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Minha Entidade" }),
      );
    });
  });

  it("omits description from payload when left blank", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<CreateEntityForm {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Entidade");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ name: "Entidade", description: undefined });
    });
  });

  it("disables submit button while loading", async () => {
    mockOnSubmit.mockReturnValue(new Promise(() => {}));
    render(<CreateEntityForm {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Entidade");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /criar/i })).toBeDisabled();
    });
  });

  it("shows error message when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Nome já em uso"));
    render(<CreateEntityForm {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Entidade");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Nome já em uso")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<CreateEntityForm {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
