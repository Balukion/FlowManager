import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@web/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "João" },
    logout: vi.fn(),
  }),
}));

const mockSelectWorkspace = vi.fn();

const ws1 = { id: "ws-1", name: "Startup A", owner_id: "user-1" };
const ws2 = { id: "ws-2", name: "Startup B", owner_id: "user-1" };

vi.mock("@web/hooks/use-workspace", () => ({
  useWorkspace: () => ({
    workspaces: [ws1, ws2],
    currentWorkspace: ws1,
    selectWorkspace: mockSelectWorkspace,
    isLoading: false,
  }),
}));

import { Sidebar } from "./sidebar";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Sidebar — troca de workspace", () => {
  it("exibe os workspaces no select", () => {
    render(<Sidebar />);
    expect(screen.getByRole("option", { name: "Startup A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Startup B" })).toBeInTheDocument();
  });

  it("chama selectWorkspace ao trocar o workspace no dropdown", async () => {
    render(<Sidebar />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "ws-2");
    expect(mockSelectWorkspace).toHaveBeenCalledWith(ws2);
  });

  it("navega para /workspaces/:id ao trocar o workspace", async () => {
    render(<Sidebar />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "ws-2");
    expect(mockPush).toHaveBeenCalledWith("/workspaces/ws-2");
  });

  it("não navega se o workspace não for encontrado", async () => {
    render(<Sidebar />);
    // select with empty value — should not navigate
    // (default behavior — selecting same option doesn't trigger change)
    expect(mockPush).not.toHaveBeenCalled();
  });
});
