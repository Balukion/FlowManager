import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationPanel } from "./notification-panel";

const mockList = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockDelete = vi.fn();

vi.mock("@web/services/notification.service", () => ({
  notificationService: {
    list: (...args: unknown[]) => mockList(...args),
    markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
    markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

const notifications = [
  {
    id: "n-1",
    title: "Passo atribuído",
    body: "Você foi atribuído ao passo \"Revisar PR\"",
    read_at: null,
    created_at: new Date("2026-04-08T10:00:00Z"),
  },
  {
    id: "n-2",
    title: "Prazo próximo",
    body: "A tarefa \"Deploy\" vence amanhã",
    read_at: new Date("2026-04-08T09:00:00Z"),
    created_at: new Date("2026-04-07T10:00:00Z"),
  },
];

const defaultProps = { token: "fake-token" };

beforeEach(() => {
  vi.clearAllMocks();
  mockList.mockResolvedValue({
    data: { notifications },
    meta: { unread_count: 1 },
  });
});

describe("NotificationPanel", () => {
  it("renders bell button", () => {
    render(<NotificationPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /notificações/i })).toBeInTheDocument();
  });

  it("shows unread badge when there are unread notifications", async () => {
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("does not show badge when unread count is 0", async () => {
    mockList.mockResolvedValue({
      data: { notifications: [] },
      meta: { unread_count: 0 },
    });
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => {
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });
  });

  it("opens panel and lists notifications on click", async () => {
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => {
      expect(screen.getByText("Passo atribuído")).toBeInTheDocument();
      expect(screen.getByText("Prazo próximo")).toBeInTheDocument();
    });
  });

  it("shows empty state when there are no notifications", async () => {
    mockList.mockResolvedValue({ data: { notifications: [] }, meta: { unread_count: 0 } });
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => {
      expect(screen.getByText(/nenhuma notificação/i)).toBeInTheDocument();
    });
  });

  it("calls markAsRead and refreshes when clicking mark as read", async () => {
    mockMarkAsRead.mockResolvedValue(undefined);
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => screen.getByText("Passo atribuído"));

    await userEvent.click(screen.getByRole("button", { name: /marcar como lida/i }));
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith("n-1", "fake-token");
    });
  });

  it("calls markAllAsRead when clicking mark all as read", async () => {
    mockMarkAllAsRead.mockResolvedValue(undefined);
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => screen.getByText("Passo atribuído"));

    await userEvent.click(screen.getByRole("button", { name: /marcar todas/i }));
    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalledWith("fake-token");
    });
  });

  it("calls delete and refreshes when deleting a notification", async () => {
    mockDelete.mockResolvedValue(undefined);
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => screen.getByText("Passo atribuído"));

    const deleteButtons = screen.getAllByRole("button", { name: /remover/i });
    await userEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("n-1", "fake-token");
    });
  });

  it("closes panel when pressing Escape", async () => {
    render(<NotificationPanel {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /notificações/i }));
    await waitFor(() => screen.getByText("Passo atribuído"));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("Passo atribuído")).not.toBeInTheDocument();
    });
  });
});
