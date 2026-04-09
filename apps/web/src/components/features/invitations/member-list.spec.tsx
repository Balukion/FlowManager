import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberList } from "./member-list";

const members = [
  {
    id: "m-1",
    workspace_id: "ws-1",
    user_id: "user-1",
    role: "ADMIN" as const,
    position: null,
    last_seen_at: null,
    joined_at: new Date("2026-01-01"),
    user: { id: "user-1", name: "João Silva", email: "joao@test.com", avatar_url: null },
  },
  {
    id: "m-2",
    workspace_id: "ws-1",
    user_id: "user-2",
    role: "MEMBER" as const,
    position: null,
    last_seen_at: null,
    joined_at: new Date("2026-01-02"),
    user: { id: "user-2", name: "Maria Souza", email: "maria@test.com", avatar_url: null },
  },
];

describe("MemberList", () => {
  it("renders member names", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="owner-99" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
  });

  it("renders member roles", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="owner-99" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Membro")).toBeInTheDocument();
  });

  it("shows empty state when no members", () => {
    render(<MemberList members={[]} ownerId="owner-99" currentUserId="owner-99" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    expect(screen.getByText("Nenhum membro encontrado")).toBeInTheDocument();
  });

  it("shows remove button only when currentUser is owner", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="owner-99" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    const removeButtons = screen.getAllByRole("button", { name: /remover/i });
    expect(removeButtons).toHaveLength(2);
  });

  it("does not show remove buttons when currentUser is not owner", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="user-1" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
  });

  it("calls onRemove with userId when remove is clicked", async () => {
    const onRemove = vi.fn();
    render(<MemberList members={members} ownerId="owner-99" currentUserId="owner-99" onRemove={onRemove} onChangeRole={vi.fn()} />);
    const [firstRemove] = screen.getAllByRole("button", { name: /remover/i });
    await userEvent.click(firstRemove);
    expect(onRemove).toHaveBeenCalledWith("user-1");
  });

  it("shows role change button for each member when owner is viewing", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="owner-99" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    // Admin member → button "Tornar Membro"
    expect(screen.getByRole("button", { name: /tornar membro/i })).toBeInTheDocument();
    // Member member → button "Tornar Admin"
    expect(screen.getByRole("button", { name: /tornar admin/i })).toBeInTheDocument();
  });

  it("does not show role change buttons when currentUser is not owner or admin", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="user-1" currentUserRole="MEMBER" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /tornar/i })).not.toBeInTheDocument();
  });

  it("calls onChangeRole with userId and new role when role change is clicked", async () => {
    const onChangeRole = vi.fn();
    render(<MemberList members={members} ownerId="owner-99" currentUserId="owner-99" onRemove={vi.fn()} onChangeRole={onChangeRole} />);
    // João é ADMIN → botão "Tornar Membro"
    await userEvent.click(screen.getByRole("button", { name: /tornar membro/i }));
    expect(onChangeRole).toHaveBeenCalledWith("user-1", "MEMBER");
  });

  it("shows role change buttons for admin (not owner)", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="user-1" currentUserRole="ADMIN" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    expect(screen.getByRole("button", { name: /tornar membro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tornar admin/i })).toBeInTheDocument();
  });

  it("does not show remove button for admin (only owner can remove)", () => {
    render(<MemberList members={members} ownerId="owner-99" currentUserId="user-1" currentUserRole="ADMIN" onRemove={vi.fn()} onChangeRole={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
  });
});
