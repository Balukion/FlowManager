import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvitationList } from "./invitation-list";

const invitations = [
  {
    id: "inv-1",
    workspace_id: "ws-1",
    invited_by: "user-1",
    email: "pedro@test.com",
    role: "MEMBER" as const,
    status: "PENDING" as const,
    expires_at: new Date("2026-12-31"),
    viewed_at: null,
    accepted_at: null,
    declined_at: null,
    created_at: new Date("2026-01-01"),
  },
  {
    id: "inv-2",
    workspace_id: "ws-1",
    invited_by: "user-1",
    email: "ana@test.com",
    role: "MEMBER" as const,
    status: "PENDING" as const,
    expires_at: new Date("2026-12-31"),
    viewed_at: null,
    accepted_at: null,
    declined_at: null,
    created_at: new Date("2026-01-02"),
  },
];

const expiredInvitation = {
  id: "inv-3",
  workspace_id: "ws-1",
  invited_by: "user-1",
  email: "carlos@test.com",
  role: "MEMBER" as const,
  status: "EXPIRED" as const,
  expires_at: new Date("2025-01-01"),
  viewed_at: null,
  accepted_at: null,
  declined_at: null,
  created_at: new Date("2024-12-01"),
};

describe("InvitationList", () => {
  it("renders invitation emails", () => {
    render(<InvitationList invitations={invitations} canManage onCancel={vi.fn()} />);
    expect(screen.getByText("pedro@test.com")).toBeInTheDocument();
    expect(screen.getByText("ana@test.com")).toBeInTheDocument();
  });

  it("renders pending status label", () => {
    render(<InvitationList invitations={invitations} canManage onCancel={vi.fn()} />);
    expect(screen.getAllByText("Pendente")).toHaveLength(2);
  });

  it("shows empty state when no invitations", () => {
    render(<InvitationList invitations={[]} canManage onCancel={vi.fn()} />);
    expect(screen.getByText("Nenhum convite pendente")).toBeInTheDocument();
  });

  it("renders cancel button for each invitation when canManage is true", () => {
    render(<InvitationList invitations={invitations} canManage onCancel={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: /cancelar/i })).toHaveLength(2);
  });

  it("calls onCancel with invitationId when cancel is clicked", async () => {
    const onCancel = vi.fn();
    render(<InvitationList invitations={invitations} canManage onCancel={onCancel} />);
    const [firstCancel] = screen.getAllByRole("button", { name: /cancelar/i });
    await userEvent.click(firstCancel);
    expect(onCancel).toHaveBeenCalledWith("inv-1");
  });

  it("hides cancel buttons when canManage is false", () => {
    render(<InvitationList invitations={invitations} canManage={false} onCancel={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /cancelar/i })).not.toBeInTheDocument();
    expect(screen.getByText("pedro@test.com")).toBeInTheDocument();
  });

  it("hides cancel buttons by default (no canManage prop)", () => {
    render(<InvitationList invitations={invitations} onCancel={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /cancelar/i })).not.toBeInTheDocument();
  });
});

describe("InvitationList — reenvio de convites expirados", () => {
  it("renders expired status label", () => {
    render(<InvitationList invitations={[expiredInvitation]} canManage onCancel={vi.fn()} onResend={vi.fn()} />);
    expect(screen.getByText("Expirado")).toBeInTheDocument();
  });

  it("shows Reenviar button for expired invitations when canManage is true", () => {
    render(<InvitationList invitations={[expiredInvitation]} canManage onCancel={vi.fn()} onResend={vi.fn()} />);
    expect(screen.getByRole("button", { name: /reenviar/i })).toBeInTheDocument();
  });

  it("does not show Cancelar button for expired invitations", () => {
    render(<InvitationList invitations={[expiredInvitation]} canManage onCancel={vi.fn()} onResend={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it("calls onResend with invitationId when Reenviar is clicked", async () => {
    const onResend = vi.fn();
    render(<InvitationList invitations={[expiredInvitation]} canManage onCancel={vi.fn()} onResend={onResend} />);
    await userEvent.click(screen.getByRole("button", { name: /reenviar/i }));
    expect(onResend).toHaveBeenCalledWith("inv-3");
  });

  it("shows Cancelar for PENDING and Reenviar for EXPIRED in mixed list", () => {
    render(
      <InvitationList
        invitations={[invitations[0], expiredInvitation]}
        canManage
        onCancel={vi.fn()}
        onResend={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reenviar/i })).toBeInTheDocument();
  });

  it("does not show Reenviar when canManage is false", () => {
    render(<InvitationList invitations={[expiredInvitation]} canManage={false} onCancel={vi.fn()} onResend={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /reenviar/i })).not.toBeInTheDocument();
  });
});
