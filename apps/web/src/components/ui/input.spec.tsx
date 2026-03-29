import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input.js";

describe("Input", () => {
  it("should render an input element", () => {
    render(<Input placeholder="Digite aqui" />);
    expect(screen.getByPlaceholderText("Digite aqui")).toBeInTheDocument();
  });

  it("should accept typed text", async () => {
    render(<Input placeholder="email" />);
    const input = screen.getByPlaceholderText("email");
    await userEvent.type(input, "joao@test.com");
    expect(input).toHaveValue("joao@test.com");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Input disabled placeholder="bloqueado" />);
    expect(screen.getByPlaceholderText("bloqueado")).toBeDisabled();
  });

  it("should forward additional props like type and id", () => {
    render(<Input type="password" id="pwd" placeholder="senha" />);
    const input = screen.getByPlaceholderText("senha");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("id", "pwd");
  });
});
