"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@web/services/task.service";
import { projectService } from "@web/services/project.service";
import { labelService } from "@web/services/label.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceRole } from "@web/hooks/use-workspace-role";
import { useApiClient } from "@web/hooks/use-api-client";
import Link from "next/link";
import { SortableTaskList } from "@web/components/features/tasks/sortable-task-list";
import { LabelBadge } from "@web/components/features/labels/label-badge";
import { CreateTaskForm } from "@web/components/features/tasks/create-task-form";
import { ConfirmDialog } from "@web/components/ui/confirm-dialog";
import { Button } from "@web/components/ui/button";
import { BackLink } from "@web/components/layout/back-link";
import type { Task, ApiResponse } from "@flowmanager/types";

interface TaskLabel {
  label: { id: string; name: string; color: string };
}

interface Label {
  id: string;
  name: string;
  color: string;
}

export default function ProjectPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const client = useApiClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  const { isAdminOrOwner } = useWorkspaceRole(workspaceId);

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService(client).get(workspaceId, projectId),
    enabled: !!accessToken,
  });

  const project = (projectData as { data: { project: { name: string; status: string } } } | undefined)?.data?.project;
  const isArchived = project?.status === "ARCHIVED";

  const { data: labelsData } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => labelService(client).list(workspaceId),
    enabled: !!accessToken,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", workspaceId, projectId, selectedLabel],
    queryFn: () =>
      taskService(client).list(workspaceId, projectId, {
        label_id: selectedLabel ?? undefined,
      }),
    enabled: !!accessToken,
  });

  const workspaceLabels: Label[] =
    (labelsData as ApiResponse<{ labels: Label[] }> | undefined)?.data?.labels ?? [];

  const tasks: (Task & { task_labels?: TaskLabel[] })[] =
    (data as ApiResponse<{ tasks: (Task & { task_labels?: TaskLabel[] })[] }> | undefined)?.data
      ?.tasks ?? [];

  const createMutation = useMutation({
    mutationFn: (formData: { title: string; priority: string }) =>
      taskService(client).create(workspaceId, projectId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      setShowForm(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => isArchived
      ? projectService(client).unarchive(workspaceId, projectId)
      : projectService(client).archive(workspaceId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: (order: string[]) =>
      taskService(client).reorder(workspaceId, projectId, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectService(client).delete(workspaceId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      router.push(`/workspaces/${workspaceId}`);
    },
    onError: (err: { message?: string }) => {
      setConfirmDeleteProject(false);
      alert(err.message ?? "Erro ao deletar projeto");
    },
  });

  function handleTaskClick(task: Task) {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`);
  }

  return (
    <div className="space-y-6">
      <BackLink href={`/workspaces/${workspaceId}`} label="Projetos" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project?.name ?? "Tarefas"}</h1>
          {isArchived && (
            <span className="text-xs text-muted-foreground">Projeto arquivado</span>
          )}
        </div>
        <div className="flex gap-2">
          {isAdminOrOwner && !isArchived && (
            <Button onClick={() => setShowForm(true)}>Nova tarefa</Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/workspaces/${workspaceId}/projects/${projectId}/activity`}>
              Histórico
            </Link>
          </Button>
          {isAdminOrOwner && (
            <Button variant="outline" onClick={() => archiveMutation.mutate()}>
              {isArchived ? "Desarquivar" : "Arquivar"}
            </Button>
          )}
          {isAdminOrOwner && (
            <Button variant="outline" onClick={() => setConfirmDeleteProject(true)}>
              Deletar
            </Button>
          )}
        </div>
      </div>

      {confirmDeleteProject && (
        <ConfirmDialog
          message="Tem certeza que deseja deletar este projeto? Todas as tarefas serão removidas."
          onConfirm={() => deleteProjectMutation.mutate()}
          onCancel={() => setConfirmDeleteProject(false)}
        />
      )}

      {workspaceLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtrar:</span>
          {workspaceLabels.map((label) => (
            <button
              key={label.id}
              onClick={() =>
                setSelectedLabel(selectedLabel === label.id ? null : label.id)
              }
              className={`rounded-full transition-opacity ${
                selectedLabel && selectedLabel !== label.id ? "opacity-40" : "opacity-100"
              }`}
            >
              <LabelBadge name={label.name} color={label.color} />
            </button>
          ))}
          {selectedLabel && (
            <button
              onClick={() => setSelectedLabel(null)}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              limpar
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Criar tarefa</h2>
          <CreateTaskForm
            onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      {!isLoading && tasks.length === 0 && !showForm && (
        <p className="text-muted-foreground">
          {selectedLabel ? "Nenhuma tarefa com essa label." : "Nenhuma tarefa encontrada."}
        </p>
      )}

      <SortableTaskList
        tasks={tasks}
        onTaskClick={handleTaskClick}
        canReorder={isAdminOrOwner && !selectedLabel}
        onReorder={(order) => reorderTasksMutation.mutate(order)}
      />
    </div>
  );
}
