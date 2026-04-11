import type { Task } from "@flowmanager/types";
import { LabelBadge } from "@web/components/features/labels/label-badge";

const STATUS_LABELS: Record<string, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

interface TaskLabel {
  label: { id: string; name: string; color: string };
}

interface TaskCardProps {
  task: Task & { task_labels?: TaskLabel[] };
  onClick: (task: Task) => void;
  position?: number;
}

export function TaskCard({ task, onClick, position }: TaskCardProps) {
  const labels = task.task_labels ?? [];

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            {position !== undefined && (
              <span className="text-xs font-mono text-muted-foreground">#{position}</span>
            )}
            <p className="font-medium">{task.title}</p>
          </div>
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labels.map(({ label }) => (
                <LabelBadge key={label.id} name={label.name} color={label.color} />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
          <span className="text-xs text-muted-foreground">
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>
        </div>
      </div>
    </button>
  );
}
