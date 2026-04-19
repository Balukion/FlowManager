"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { activityService } from "@web/services/activity.service";
import { projectService } from "@web/services/project.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useApiClient } from "@web/hooks/use-api-client";
import { ActivityLogList } from "@web/components/features/activity/activity-log-list";
import { BackLink } from "@web/components/layout/back-link";
import type { ApiResponse } from "@flowmanager/types";

interface ActivityLog {
  id: string;
  action: string;
  created_at: Date;
  user: { id: string; name: string };
  metadata: Record<string, unknown>;
}

export default function ProjectActivityPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const { accessToken } = useAuthStore();
  const client = useApiClient();

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService(client).get(workspaceId, projectId),
    enabled: !!accessToken,
  });

  const project = (projectData as { data: { project: { name: string } } } | undefined)?.data?.project;

  const { data, isLoading } = useQuery({
    queryKey: ["activity", "project", projectId],
    queryFn: () => activityService(client).listByProject(workspaceId, projectId),
    enabled: !!accessToken,
  });

  const logs: ActivityLog[] =
    (data as ApiResponse<{ logs: ActivityLog[] }> | undefined)?.data?.logs ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink
        href={`/workspaces/${workspaceId}/projects/${projectId}`}
        label={project?.name ?? "Tarefas"}
      />
      <div>
        <h1 className="text-2xl font-bold">Histórico de atividades</h1>
        {project && (
          <p className="text-sm text-muted-foreground">{project.name}</p>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma atividade registrada.</p>
      ) : (
        <ActivityLogList logs={logs} />
      )}
    </div>
  );
}
