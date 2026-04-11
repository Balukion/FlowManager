interface MemberWorkload {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  open_tasks: number;
}

interface MemberWorkloadListProps {
  members: MemberWorkload[];
}

export function MemberWorkloadList({ members }: MemberWorkloadListProps) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>;
  }

  return (
    <ul className="space-y-2">
      {members.map((m) => (
        <li key={m.user_id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
          <span className="text-sm font-medium">{m.user_name}</span>
          <span className="text-sm text-muted-foreground">
            {m.open_tasks} {m.open_tasks === 1 ? "tarefa" : "tarefas"}
          </span>
        </li>
      ))}
    </ul>
  );
}
