const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  VIEWED: "Visualizado",
  ACCEPTED: "Aceito",
  EXPIRED: "Expirado",
  DECLINED: "Recusado",
};

interface Invitation {
  id: string;
  workspace_id: string;
  invited_by: string;
  email: string;
  role: string;
  status: string;
  expires_at: Date;
  viewed_at: Date | null;
  accepted_at: Date | null;
  declined_at: Date | null;
  created_at: Date;
}

interface InvitationListProps {
  invitations: Invitation[];
  canManage?: boolean;
  onCancel: (invitationId: string) => void;
  onResend?: (invitationId: string) => void;
}

export function InvitationList({ invitations, canManage = false, onCancel, onResend }: InvitationListProps) {
  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum convite pendente</p>;
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {invitations.map((inv) => (
        <li key={inv.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium">{inv.email}</p>
            <p className="text-xs text-muted-foreground">
              {STATUS_LABELS[inv.status] ?? inv.status}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {inv.status === "EXPIRED" && onResend && (
                <button
                  onClick={() => onResend(inv.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Reenviar"
                >
                  Reenviar
                </button>
              )}
              {inv.status !== "EXPIRED" && (
                <button
                  onClick={() => onCancel(inv.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label="Cancelar"
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
