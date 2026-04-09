const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MEMBER: "Membro",
};

interface MemberWithUser {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  position: number | null;
  last_seen_at: Date | null;
  joined_at: Date;
  user: { id: string; name: string; email: string; avatar_url: string | null };
}

interface MemberListProps {
  members: MemberWithUser[];
  ownerId: string;
  currentUserId: string;
  currentUserRole?: string;
  onRemove: (userId: string) => void;
  onChangeRole: (userId: string, role: string) => void;
}

export function MemberList({ members, ownerId, currentUserId, currentUserRole, onRemove, onChangeRole }: MemberListProps) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>;
  }

  const isOwner = currentUserId === ownerId;
  const canChangeRole = isOwner || currentUserRole === "ADMIN";

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {members.map((member) => {
        const isAdmin = member.role === "ADMIN";
        return (
          <li key={member.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{member.user.name}</p>
              <p className="text-xs text-muted-foreground">{member.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {ROLE_LABELS[member.role] ?? member.role}
              </span>
              {canChangeRole && (
                <button
                  onClick={() => onChangeRole(member.user_id, isAdmin ? "MEMBER" : "ADMIN")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {isAdmin ? "Tornar Membro" : "Tornar Admin"}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => onRemove(member.user_id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label="Remover"
                >
                  Remover
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
