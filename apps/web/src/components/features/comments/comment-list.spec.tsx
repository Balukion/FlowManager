import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentList } from "./comment-list";

const comments = [
  {
    id: "c-1",
    task_id: "task-1",
    parent_id: null,
    user_id: "user-1",
    content: "Precisamos revisar isso",
    edited_at: null,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    deleted_at: null,
    user: { id: "user-1", name: "João Silva", avatar_url: null },
  },
  {
    id: "c-2",
    task_id: "task-1",
    parent_id: null,
    user_id: "user-2",
    content: "Concordo, vou verificar",
    edited_at: null,
    created_at: new Date("2026-01-02"),
    updated_at: new Date("2026-01-02"),
    deleted_at: null,
    user: { id: "user-2", name: "Maria Souza", avatar_url: null },
  },
];

const replyComment = {
  id: "c-5",
  task_id: "task-1",
  parent_id: "c-1",
  user_id: "user-2",
  content: "Essa é uma resposta",
  edited_at: null,
  created_at: new Date("2026-01-03"),
  updated_at: new Date("2026-01-03"),
  deleted_at: null,
  user: { id: "user-2", name: "Maria Souza", avatar_url: null },
};

const editedComment = {
  id: "c-3",
  task_id: "task-1",
  user_id: "user-1",
  content: "Conteúdo atualizado",
  edited_at: new Date("2026-01-03"),
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-03"),
  deleted_at: null,
  user: { id: "user-1", name: "João Silva", avatar_url: null },
};

const deletedComment = {
  id: "c-4",
  task_id: "task-1",
  user_id: "user-2",
  content: "conteúdo original",
  edited_at: null,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-02"),
  deleted_at: new Date("2026-01-02"),
  user: { id: "user-2", name: "Maria Souza", avatar_url: null },
};

describe("CommentList", () => {
  it("renders comment content", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.getByText("Precisamos revisar isso")).toBeInTheDocument();
    expect(screen.getByText("Concordo, vou verificar")).toBeInTheDocument();
  });

  it("renders author names", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
  });

  it("shows empty state when no comments", () => {
    render(<CommentList comments={[]} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.getByText("Nenhum comentário ainda")).toBeInTheDocument();
  });

  it("shows delete button only for own comments", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} />);
    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i });
    expect(deleteButtons).toHaveLength(1);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /excluir/i }));
    expect(onDelete).toHaveBeenCalledWith("c-1");
  });

  it("shows 'editado' indicator when edited_at is set", () => {
    render(<CommentList comments={[editedComment]} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.getByText(/editado/i)).toBeInTheDocument();
    expect(screen.getByText("Conteúdo atualizado")).toBeInTheDocument();
  });

  it("does not show 'editado' indicator when edited_at is null", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.queryByText(/editado/i)).not.toBeInTheDocument();
  });

  it("shows placeholder for deleted comments instead of content", () => {
    render(<CommentList comments={[deletedComment]} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.getByText(/comentário removido/i)).toBeInTheDocument();
    expect(screen.queryByText("conteúdo original")).not.toBeInTheDocument();
  });

  it("does not show delete button for deleted comments", () => {
    render(<CommentList comments={[deletedComment]} currentUserId="user-2" onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
  });
});

describe("CommentList — edição inline", () => {
  it("shows edit button for own non-deleted comments", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("does not show edit button for other users' comments", () => {
    render(<CommentList comments={comments} currentUserId="user-2" onDelete={vi.fn()} onEdit={vi.fn()} />);
    // user-2 owns only c-2; c-1 belongs to user-1
    const editButtons = screen.queryAllByRole("button", { name: /editar/i });
    // only one edit button, for c-2
    expect(editButtons).toHaveLength(1);
  });

  it("does not show edit button for deleted comments", () => {
    render(<CommentList comments={[deletedComment]} currentUserId="user-2" onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });

  it("shows inline textarea with current content when edit button is clicked", async () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onEdit={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Precisamos revisar isso");
  });

  it("calls onEdit with commentId and updated content when saved", async () => {
    const onEdit = vi.fn();
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Conteúdo atualizado");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(onEdit).toHaveBeenCalledWith("c-1", "Conteúdo atualizado");
  });

  it("returns to normal view and does not call onEdit when cancelled", async () => {
    const onEdit = vi.fn();
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: /editar/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("does not show edit button when onEdit prop is not provided", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });
});

const members = [
  { user_id: "u-1", user: { id: "u-1", name: "João Silva", email: "joao@test.com", avatar_url: null } },
  { user_id: "u-2", user: { id: "u-2", name: "Maria Souza", email: "maria@test.com", avatar_url: null } },
];

describe("CommentList — respostas", () => {
  it("shows Responder button on top-level non-deleted comments when onReply is provided", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onReply={vi.fn()} />);
    const replyButtons = screen.getAllByRole("button", { name: /responder/i });
    expect(replyButtons).toHaveLength(2);
  });

  it("does not show Responder button on reply comments (parent_id set)", () => {
    render(
      <CommentList
        comments={[...comments, replyComment]}
        currentUserId="user-1"
        onDelete={vi.fn()}
        onReply={vi.fn()}
      />,
    );
    // 2 top-level comments → 2 Responder buttons (replyComment has parent_id so no button)
    expect(screen.getAllByRole("button", { name: /responder/i })).toHaveLength(2);
  });

  it("does not show Responder button on deleted comments", () => {
    render(
      <CommentList comments={[deletedComment]} currentUserId="user-1" onDelete={vi.fn()} onReply={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /responder/i })).not.toBeInTheDocument();
  });

  it("does not show Responder button when onReply prop is not provided", () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /responder/i })).not.toBeInTheDocument();
  });

  it("shows inline reply form when Responder is clicked", async () => {
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onReply={vi.fn()} />);
    const [firstReply] = screen.getAllByRole("button", { name: /responder/i });
    await userEvent.click(firstReply);
    expect(screen.getByPlaceholderText(/escreva sua resposta/i)).toBeInTheDocument();
  });

  it("calls onReply with parentId and content when form is submitted", async () => {
    const onReply = vi.fn();
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onReply={onReply} />);
    const [firstReply] = screen.getAllByRole("button", { name: /responder/i });
    await userEvent.click(firstReply);
    await userEvent.type(screen.getByPlaceholderText(/escreva sua resposta/i), "Boa ideia!");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    expect(onReply).toHaveBeenCalledWith("c-1", "Boa ideia!", []);
  });

  it("hides reply form when cancel is clicked without calling onReply", async () => {
    const onReply = vi.fn();
    render(<CommentList comments={comments} currentUserId="user-1" onDelete={vi.fn()} onReply={onReply} />);
    const [firstReply] = screen.getAllByRole("button", { name: /responder/i });
    await userEvent.click(firstReply);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByPlaceholderText(/escreva sua resposta/i)).not.toBeInTheDocument();
    expect(onReply).not.toHaveBeenCalled();
  });

  it("renders reply comments indented under the parent comment", () => {
    render(
      <CommentList
        comments={[...comments, replyComment]}
        currentUserId="user-1"
        onDelete={vi.fn()}
        onReply={vi.fn()}
      />,
    );
    expect(screen.getByText("Essa é uma resposta")).toBeInTheDocument();
  });
});

describe("CommentList — @mention em respostas", () => {
  it("calls onReply with mentions array when reply contains @member", async () => {
    const onReply = vi.fn();
    render(
      <CommentList
        comments={comments}
        currentUserId="user-1"
        onDelete={vi.fn()}
        onReply={onReply}
        members={members}
      />,
    );
    const [firstReply] = screen.getAllByRole("button", { name: /responder/i });
    await userEvent.click(firstReply);
    await userEvent.type(screen.getByPlaceholderText(/escreva sua resposta/i), "@Maria Souza olha isso");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    expect(onReply).toHaveBeenCalledWith("c-1", "@Maria Souza olha isso", ["u-2"]);
  });

  it("calls onReply with empty mentions when reply has no @mention", async () => {
    const onReply = vi.fn();
    render(
      <CommentList
        comments={comments}
        currentUserId="user-1"
        onDelete={vi.fn()}
        onReply={onReply}
        members={members}
      />,
    );
    const [firstReply] = screen.getAllByRole("button", { name: /responder/i });
    await userEvent.click(firstReply);
    await userEvent.type(screen.getByPlaceholderText(/escreva sua resposta/i), "sem mencao");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    expect(onReply).toHaveBeenCalledWith("c-1", "sem mencao", []);
  });
});
