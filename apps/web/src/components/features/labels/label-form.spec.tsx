import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelForm } from "./label-form";

const defaultProps = {
  name: "Bug",
  color: "#ef4444",
  onNameChange: vi.fn(),
  onColorChange: vi.fn(),
  onSubmit: vi.fn(),
  submitLabel: "Criar",
};

beforeEach(() => vi.clearAllMocks());

describe("LabelForm", () => {
  it("renders name input with current value", () => {
    render(<LabelForm {...defaultProps} />);
    expect(screen.getByDisplayValue("Bug")).toBeInTheDocument();
  });

  it("renders color input with current color value", () => {
    render(<LabelForm {...defaultProps} />);
    const colorInput = screen.getByLabelText(/cor da label/i) as HTMLInputElement;
    expect(colorInput.value).toBe("#ef4444");
  });

  it("renders submit button with submitLabel text", () => {
    render(<LabelForm {...defaultProps} submitLabel="Salvar" />);
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  it("calls onNameChange when typing in the name input", async () => {
    const onNameChange = vi.fn();
    render(<LabelForm {...defaultProps} onNameChange={onNameChange} />);
    await userEvent.type(screen.getByDisplayValue("Bug"), "x");
    expect(onNameChange).toHaveBeenCalled();
  });

  it("calls onSubmit when clicking the submit button", async () => {
    const onSubmit = vi.fn();
    render(<LabelForm {...defaultProps} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when pressing Enter in the name input", async () => {
    const onSubmit = vi.fn();
    render(<LabelForm {...defaultProps} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByDisplayValue("Bug"), "{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not render cancel button when onCancel is not provided", () => {
    render(<LabelForm {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it("renders cancel button when onCancel is provided", () => {
    render(<LabelForm {...defaultProps} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("calls onCancel when clicking the cancel button", async () => {
    const onCancel = vi.fn();
    render(<LabelForm {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders name input with placeholder when name is empty", () => {
    render(<LabelForm {...defaultProps} name="" />);
    expect(screen.getByPlaceholderText(/nome da label/i)).toBeInTheDocument();
  });
});
