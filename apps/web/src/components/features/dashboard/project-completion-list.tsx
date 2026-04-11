interface ProjectCompletion {
  project_id: string;
  project_name: string;
  total: number;
  done: number;
  rate: number;
}

interface ProjectCompletionListProps {
  projects: ProjectCompletion[];
}

export function ProjectCompletionList({ projects }: ProjectCompletionListProps) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum projeto ativo.</p>;
  }

  return (
    <ul className="space-y-3">
      {projects.map((p) => (
        <li key={p.project_id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{p.project_name}</span>
            <span className="text-muted-foreground">
              <span>{p.done}/{p.total}</span>
              {" · "}
              <span className="font-semibold text-foreground">{p.rate}%</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${p.rate}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
