const STATUS_LABELS: Record<string, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: Date | string | null;
  created_at: Date | string;
}

interface RecentTasksListProps {
  tasks: RecentTask[];
}

export function RecentTasksList({ tasks }: RecentTasksListProps) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma tarefa recente</p>;
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">{task.title}</span>
          <span className="text-xs text-muted-foreground">
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
