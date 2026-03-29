import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button.js";

describe("Button", () => {
  it("should render with text", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clique</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("should be disabled when disabled prop is true", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Desabilitado</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should apply variant class", () => {
    render(<Button variant="destructive">Deletar</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("destructive");
  });
});
