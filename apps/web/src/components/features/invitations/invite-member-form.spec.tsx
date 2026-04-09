import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteMemberForm } from "./invite-member-form";

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("InviteMemberForm", () => {
  it("renders email input and submit button", () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /convidar/i })).toBeInTheDocument();
  });

  it("shows validation error when email is empty", async () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /convidar/i }));
    await waitFor(() => {
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when email is invalid", async () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/email/i), "nao-é-um-email");
    await userEvent.click(screen.getByRole("button", { name: /convidar/i }));
    await waitFor(() => {
      expect(screen.getByText("Email inválido")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with email when valid", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.click(screen.getByRole("button", { name: /convidar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("joao@test.com");
    });
  });

  it("disables button while loading", async () => {
    mockOnSubmit.mockReturnValue(new Promise(() => {}));
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.click(screen.getByRole("button", { name: /convidar/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /convidar/i })).toBeDisabled();
    });
  });

  it("shows error message when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Rate limit exceeded, retry in 50 minutes"));
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.click(screen.getByRole("button", { name: /convidar/i }));
    await waitFor(() => {
      expect(screen.getByText("Rate limit exceeded, retry in 50 minutes")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel is clicked", async () => {
    render(<InviteMemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
