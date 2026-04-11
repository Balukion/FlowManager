interface ActivityLog {
  id: string;
  action: string;
  created_at: Date;
  user: { id: string; name: string };
  metadata: Record<string, unknown>;
}

interface ActivityLogListProps {
  logs: ActivityLog[];
}

function describeAction(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case "TASK_CREATED":       return "criou a tarefa";
    case "TASK_UPDATED":       return "editou a tarefa";
    case "TASK_DELETED":       return "deletou a tarefa";
    case "TASK_STATUS_CHANGED": {
      const from = String(metadata.from ?? "").toUpperCase();
      const to   = String(metadata.to   ?? "").toUpperCase();
      return `alterou o status: ${from} → ${to}`;
    }
    case "TASK_PRIORITY_CHANGED": {
      const from = String(metadata.from ?? "");
      const to   = String(metadata.to   ?? "");
      return `alterou a prioridade: ${from} → ${to}`;
    }
    case "STEP_CREATED":    return "criou um passo";
    case "STEP_UPDATED":    return "editou um passo";
    case "STEP_DELETED":    return "deletou um passo";
    case "STEP_ASSIGNED":   return "atribuiu um passo";
    case "STEP_UNASSIGNED": return "removeu atribuição de passo";
    case "COMMENT_CREATED": return "adicionou um comentário";
    case "COMMENT_EDITED":  return "editou um comentário";
    case "COMMENT_DELETED": return "removeu um comentário";
    case "MEMBER_ADDED":    return "adicionou um membro";
    case "MEMBER_REMOVED":  return "removeu um membro";
    case "MEMBER_ROLE_CHANGED": {
      const from = String(metadata.from ?? "");
      const to   = String(metadata.to   ?? "");
      return `alterou o papel: ${from} → ${to}`;
    }
    default: return action.toLowerCase().replace(/_/g, " ");
  }
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

export function ActivityLogList({ logs }: ActivityLogListProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>;
  }

  return (
    <ul className="space-y-3">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start gap-3 text-sm">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
          <div className="flex-1 space-y-0.5">
            <p>
              <span className="font-medium">{log.user.name}</span>
              {" "}
              <span className="text-muted-foreground">{describeAction(log.action, log.metadata)}</span>
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
