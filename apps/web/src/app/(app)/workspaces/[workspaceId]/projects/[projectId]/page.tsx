"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@web/services/task.service";
import { labelService } from "@web/services/label.service";
import { workspaceService } from "@web/services/workspace.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { TaskCard } from "@web/components/features/tasks/task-card";
import { LabelBadge } from "@web/components/features/labels/label-badge";
import { CreateTaskForm } from "@web/components/features/tasks/create-task-form";
import { ConfirmDialog } from "@web/components/ui/confirm-dialog";
import { Button } from "@web/components/ui/button";
import { BackLink } from "@web/components/layout/back-link";
import type { Task } from "@flowmanager/types";

interface TaskLabel {
  label: { id: string; name: string; color: string };
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface MemberWithUser {
  user_id: string;
  role: string;
}

export default function ProjectPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  const { data: labelsData } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => labelService.list(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService.listMembers(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const members: MemberWithUser[] =
    (membersData as { data: { members: MemberWithUser[] } } | undefined)?.data?.members ?? [];
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isAdminOrOwner =
    currentWorkspace?.owner_id === user?.id || currentMember?.role === "ADMIN";

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", workspaceId, projectId, selectedLabel],
    queryFn: () =>
      taskService.list(workspaceId, projectId, accessToken!, {
        label_id: selectedLabel ?? undefined,
      }),
    enabled: !!accessToken,
  });

  const workspaceLabels: Label[] =
    (labelsData as { data: { labels: Label[] } } | undefined)?.data?.labels ?? [];

  const tasks: (Task & { task_labels?: TaskLabel[] })[] =
    (data as { data: { tasks: (Task & { task_labels?: TaskLabel[] })[] } } | undefined)?.data
      ?.tasks ?? [];

  const createMutation = useMutation({
    mutationFn: (formData: { title: string; priority: string }) =>
      taskService.create(workspaceId, projectId, formData, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      setShowForm(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectService.delete(workspaceId, projectId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      router.push(`/workspaces/${workspaceId}`);
    },
  });

  function handleClick(task: Task) {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`);
  }

  return (
    <div className="space-y-6">
      <BackLink href={`/workspaces/${workspaceId}`} label="Projetos" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <div className="flex gap-2">
          {isAdminOrOwner && (
            <Button onClick={() => setShowForm(true)}>Nova tarefa</Button>
          )}
          {isAdminOrOwner && (
            <Button variant="outline" onClick={() => setConfirmDeleteProject(true)}>
              Deletar projeto
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

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={handleClick} />
        ))}
      </div>
    </div>
  );
}
