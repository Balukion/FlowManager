"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@web/services/project.service";
import { workspaceService } from "@web/services/workspace.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { useWorkspaceRole } from "@web/hooks/use-workspace-role";
import { ProjectCard } from "@web/components/features/projects/project-card";
import { CreateProjectForm } from "@web/components/features/projects/create-project-form";
import { ConfirmDialog } from "@web/components/ui/confirm-dialog";
import { Button } from "@web/components/ui/button";
import { BackLink } from "@web/components/layout/back-link";
import type { Project } from "@flowmanager/types";

export default function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDeleteWorkspace, setConfirmDeleteWorkspace] = useState(false);

  const { isAdminOrOwner, isOwner } = useWorkspaceRole(workspaceId);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => projectService.list(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const { data: archivedData } = useQuery({
    queryKey: ["projects", workspaceId, "archived"],
    queryFn: () => projectService.listArchived(workspaceId, accessToken!),
    enabled: !!accessToken && showArchived,
  });

  const projects: Project[] =
    (data as { data: { projects: Project[] } } | undefined)?.data?.projects ?? [];

  const archivedProjects: Project[] =
    (archivedData as { data: { projects: Project[] } } | undefined)?.data?.projects ?? [];

  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => workspaceService.delete(workspaceId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push("/workspaces");
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData: { name: string; description?: string }) =>
      projectService.create(workspaceId, formData, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      setShowForm(false);
    },
  });

  function handleClick(project: Project) {
    router.push(`/workspaces/${workspaceId}/projects/${project.id}`);
  }

  return (
    <div className="space-y-6">
      <BackLink href="/workspaces" label="Workspaces" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentWorkspace?.name ?? "Workspace"}</h1>
          <p className="text-sm text-muted-foreground">Projetos ativos</p>
        </div>
        <div className="flex gap-2">
          {isAdminOrOwner && (
            <Button onClick={() => setShowForm(true)}>Novo projeto</Button>
          )}
          {isOwner && (
            <Button variant="outline" onClick={() => setConfirmDeleteWorkspace(true)}>
              Deletar workspace
            </Button>
          )}
        </div>
      </div>

      {confirmDeleteWorkspace && (
        <ConfirmDialog
          message={`Tem certeza que deseja deletar o workspace "${currentWorkspace?.name}"? Todos os projetos e tarefas serão removidos.`}
          onConfirm={() => deleteWorkspaceMutation.mutate()}
          onCancel={() => setConfirmDeleteWorkspace(false)}
        />
      )}

      {showForm && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Criar projeto</h2>
          <CreateProjectForm
            onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      {!isLoading && projects.length === 0 && !showForm && (
        <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((proj) => (
          <ProjectCard key={proj.id} project={proj} onClick={handleClick} />
        ))}
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {showArchived ? "▲ Ocultar arquivados" : "▼ Ver projetos arquivados"}
        </button>
        {showArchived && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">Nenhum projeto arquivado.</p>
            ) : (
              archivedProjects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} onClick={handleClick} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
