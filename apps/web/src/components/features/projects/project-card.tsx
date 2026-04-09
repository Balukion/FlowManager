import type { Project } from "@flowmanager/types";

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <button
      onClick={() => onClick(project)}
      className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 flex-shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? "#6366f1" }}
        />
        <div className="min-w-0">
          <p className="font-semibold">{project.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {project.description ?? "Sem descrição"}
          </p>
        </div>
      </div>
    </button>
  );
}
