import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCommentInput } from "./add-comment-input";

vi.mock("@web/components/features/comments/mention-textarea", () => ({
  MentionTextarea: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    onMentionsChange: (m: string[]) => void;
    members: unknown[];
    placeholder?: string;
    rows?: number;
  }) => (
    <textarea
      data-testid="mention-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

const members = [
  { user_id: "user-1", role: "MEMBER", user: { id: "user-1", name: "Alice", email: "alice@test.com", avatar_url: null } },
];

describe("AddCommentInput", () => {
  it("renderiza textarea e botão Enviar", () => {
    render(<AddCommentInput members={members} onSubmit={vi.fn()} />);

    expect(screen.getByTestId("mention-textarea")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("botão fica desabilitado quando o textarea está vazio", () => {
    render(<AddCommentInput members={members} onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
  });

  it("botão fica habilitado ao digitar texto", async () => {
    render(<AddCommentInput members={members} onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByTestId("mention-textarea"), "Ótimo trabalho");

    expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
  });

  it("chama onSubmit com conteúdo trimado ao clicar em Enviar", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddCommentInput members={members} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByTestId("mention-textarea"), "  Bom trabalho  ");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(onSubmit).toHaveBeenCalledWith("Bom trabalho", []);
  });

  it("limpa o textarea após onSubmit resolver com sucesso", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddCommentInput members={members} onSubmit={onSubmit} />);

    const textarea = screen.getByTestId("mention-textarea");
    await userEvent.type(textarea, "Comentário teste");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(textarea).toHaveValue("");
  });

  it("não limpa o textarea se onSubmit rejeitar", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("falhou"));
    render(<AddCommentInput members={members} onSubmit={onSubmit} />);

    const textarea = screen.getByTestId("mention-textarea");
    await userEvent.type(textarea, "Comentário que falha");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(textarea).toHaveValue("Comentário que falha");
  });
});
