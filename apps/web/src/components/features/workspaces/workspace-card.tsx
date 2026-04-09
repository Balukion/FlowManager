import type { Workspace } from "@flowmanager/types";

interface WorkspaceCardProps {
  workspace: Workspace;
  onClick: (workspace: Workspace) => void;
}

export function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  return (
    <button
      onClick={() => onClick(workspace)}
      className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 flex-shrink-0 rounded-full"
          style={{ backgroundColor: workspace.color ?? "#6366f1" }}
        />
        <div className="min-w-0">
          <p className="font-semibold">{workspace.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {workspace.description ?? "Sem descrição"}
          </p>
        </div>
      </div>
    </button>
  );
}
