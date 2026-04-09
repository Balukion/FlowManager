import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationItem } from "./notification-item";

const unread = {
  id: "n-1",
  title: "Passo atribuído",
  body: "Você foi atribuído ao passo \"Revisar PR\"",
  read_at: null,
  created_at: new Date("2026-04-08T10:00:00Z"),
};

const read = { ...unread, id: "n-2", read_at: new Date("2026-04-08T11:00:00Z") };

describe("NotificationItem", () => {
  it("renders title and body", () => {
    render(<NotificationItem notification={unread} onMarkAsRead={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Passo atribuído")).toBeInTheDocument();
    expect(screen.getByText(/Revisar PR/)).toBeInTheDocument();
  });

  it("shows unread indicator when not read", () => {
    render(<NotificationItem notification={unread} onMarkAsRead={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does not show unread indicator when already read", () => {
    render(<NotificationItem notification={read} onMarkAsRead={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("calls onMarkAsRead when clicking mark as read", async () => {
    const onMarkAsRead = vi.fn();
    render(<NotificationItem notification={unread} onMarkAsRead={onMarkAsRead} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /marcar como lida/i }));
    expect(onMarkAsRead).toHaveBeenCalledWith("n-1");
  });

  it("does not show mark as read button when already read", () => {
    render(<NotificationItem notification={read} onMarkAsRead={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /marcar como lida/i })).not.toBeInTheDocument();
  });

  it("calls onDelete when clicking delete", async () => {
    const onDelete = vi.fn();
    render(<NotificationItem notification={unread} onMarkAsRead={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /remover/i }));
    expect(onDelete).toHaveBeenCalledWith("n-1");
  });
});
