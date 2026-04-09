import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentList } from "./comment-list";

const comments = [
  {
    id: "c-1",
    task_id: "task-1",
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
    user_id: "user-2",
    content: "Concordo, vou verificar",
    edited_at: null,
    created_at: new Date("2026-01-02"),
    updated_at: new Date("2026-01-02"),
    deleted_at: null,
    user: { id: "user-2", name: "Maria Souza", avatar_url: null },
  },
];

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
});
