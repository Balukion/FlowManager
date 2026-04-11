import Link from "next/link";

interface AssignedStep {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  task: {
    id: string;
    title: string;
    number: number;
    project_id: string;
    project: { id: string; name: string };
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluído",
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

interface MyStepsListProps {
  steps: AssignedStep[];
  workspaceId: string;
}

export function MyStepsList({ steps, workspaceId }: MyStepsListProps) {
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum passo atribuído a você.</p>;
  }

  return (
    <ul className="space-y-3">
      {steps.map((step) => {
        const taskUrl = `/workspaces/${workspaceId}/projects/${step.task.project_id}/tasks/${step.task.id}`;
        const deadlineDate = step.deadline ? new Date(step.deadline) : null;

        return (
          <li key={step.id} className="rounded-md border bg-card px-4 py-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{step.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[step.status] ?? STATUS_CLASSES.PENDING}`}
              >
                {STATUS_LABELS[step.status] ?? step.status}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href={taskUrl} className="hover:underline">
                <span className="font-medium text-foreground">#{step.task.number}</span>{" "}
                {step.task.title}
              </Link>
              <span>·</span>
              <span>{step.task.project.name}</span>
              {deadlineDate && (
                <>
                  <span>·</span>
                  <span>
                    {deadlineDate.toLocaleDateString("pt-BR")}
                  </span>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
