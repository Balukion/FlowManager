import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddStepInput } from "./add-step-input";

describe("AddStepInput", () => {
  it("renderiza input e botão Adicionar", () => {
    render(<AddStepInput onAdd={vi.fn()} />);

    expect(screen.getByPlaceholderText("Novo passo...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeInTheDocument();
  });

  it("botão fica desabilitado quando o input está vazio", () => {
    render(<AddStepInput onAdd={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled();
  });

  it("botão fica habilitado ao digitar texto", async () => {
    render(<AddStepInput onAdd={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Novo passo..."), "Meu passo");

    expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled();
  });

  it("chama onAdd com o valor (trimado) ao clicar no botão", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddStepInput onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("Novo passo..."), "  Meu passo  ");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onAdd).toHaveBeenCalledWith("Meu passo");
  });

  it("chama onAdd ao pressionar Enter no input", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddStepInput onAdd={onAdd} />);

    await userEvent.type(screen.getByPlaceholderText("Novo passo..."), "Passo Enter");
    await userEvent.keyboard("{Enter}");

    expect(onAdd).toHaveBeenCalledWith("Passo Enter");
  });

  it("limpa o input após onAdd resolver com sucesso", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddStepInput onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("Novo passo...");
    await userEvent.type(input, "Novo passo");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(input).toHaveValue("");
  });

  it("não limpa o input se onAdd rejeitar", async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error("falhou"));
    render(<AddStepInput onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("Novo passo...");
    await userEvent.type(input, "Passo que falha");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(input).toHaveValue("Passo que falha");
  });
});
