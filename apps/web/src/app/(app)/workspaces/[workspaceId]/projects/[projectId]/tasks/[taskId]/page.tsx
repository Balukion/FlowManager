"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@web/services/task.service";
import { stepService } from "@web/services/step.service";
import { commentService } from "@web/services/comment.service";
import { labelService } from "@web/services/label.service";
import { workspaceService } from "@web/services/workspace.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { StepList } from "@web/components/features/steps/step-list";
import { BackLink } from "@web/components/layout/back-link";
import { CommentList } from "@web/components/features/comments/comment-list";
import { TaskLabels } from "@web/components/features/labels/task-labels";
import { EditTaskForm } from "@web/components/features/tasks/edit-task-form";
import { ConfirmDialog } from "@web/components/ui/confirm-dialog";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import type { Step } from "@flowmanager/types";

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface MemberWithUser {
  user_id: string;
  role: string;
  user: { id: string; name: string; email: string; avatar_url: string | null };
}

interface CommentWithUser {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  edited_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  user: { id: string; name: string; avatar_url: string | null };
}

export default function TaskPage() {
  const { workspaceId, projectId, taskId } = useParams<{
    workspaceId: string;
    projectId: string;
    taskId: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const [newStep, setNewStep] = useState("");
  const [newComment, setNewComment] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [showEditTask, setShowEditTask] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(false);

  const { data: taskData } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskService.get(workspaceId, projectId, taskId, accessToken!),
    enabled: !!accessToken,
  });

  const { data: stepsData } = useQuery({
    queryKey: ["steps", taskId],
    queryFn: () => stepService.list(workspaceId, projectId, taskId, accessToken!),
    enabled: !!accessToken,
  });

  const { data: commentsData } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => commentService.list(workspaceId, projectId, taskId, accessToken!),
    enabled: !!accessToken,
  });

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

  const task = (taskData as {
    data: {
      task: {
        title: string;
        description: string | null;
        status: string;
        priority: string;
        deadline: string | null;
        task_labels?: { label: TaskLabel }[];
      };
    };
  } | undefined)?.data?.task;

  const steps = (stepsData as { data: { steps: (Step & { assignments?: { user_id: string; user: { id: string; name: string; avatar_url: string | null } }[] }) [] } } | undefined)?.data?.steps ?? [];
  const members: MemberWithUser[] = (membersData as { data: { members: MemberWithUser[] } } | undefined)?.data?.members ?? [];

  const currentMember = members.find((m) => m.user_id === user?.id);
  const canManageAssignments =
    currentWorkspace?.owner_id === user?.id || currentMember?.role === "ADMIN";
  const rawComments = (commentsData as { data: { comments: Record<string, unknown>[] } } | undefined)?.data?.comments ?? [];
  const comments: CommentWithUser[] = rawComments.map((c) => ({ ...c, user: c.author } as CommentWithUser));
  const workspaceLabels: TaskLabel[] = (labelsData as { data: { labels: TaskLabel[] } } | undefined)?.data?.labels ?? [];
  const taskLabels: TaskLabel[] = task?.task_labels?.map((tl) => tl.label) ?? [];

  const stepStatusMutation = useMutation({
    mutationFn: ({ stepId, status }: { stepId: string; status: string }) =>
      stepService.updateStatus(workspaceId, projectId, taskId, stepId, status, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
    },
  });

  const createStepMutation = useMutation({
    mutationFn: (title: string) =>
      stepService.create(workspaceId, projectId, taskId, { title }, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      setNewStep("");
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ stepId, userId }: { stepId: string; userId: string }) =>
      stepService.assign(workspaceId, projectId, taskId, stepId, userId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      setAssignError(null);
    },
    onError: (err: { message?: string }) => {
      setAssignError(err.message ?? "Erro ao atribuir membro");
      setTimeout(() => setAssignError(null), 4000);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: ({ stepId, userId }: { stepId: string; userId: string }) =>
      stepService.unassign(workspaceId, projectId, taskId, stepId, userId, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["steps", taskId] }),
    onError: (err: { message?: string }) => {
      setAssignError(err.message ?? "Erro ao remover atribuição");
      setTimeout(() => setAssignError(null), 4000);
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      stepService.delete(workspaceId, projectId, taskId, stepId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: { title: string; description: string | null; priority: string; deadline: string | null }) =>
      taskService.update(workspaceId, projectId, taskId, data, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      setShowEditTask(false);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.delete(workspaceId, projectId, taskId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.create(workspaceId, projectId, taskId, content, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setNewComment("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentService.delete(workspaceId, projectId, taskId, commentId, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", taskId] }),
  });

  function handleLabelsUpdate() {
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
  }

  if (!task) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <BackLink href={`/workspaces/${workspaceId}/projects/${projectId}`} label="Tarefas" />

      {showEditTask ? (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Editar tarefa</h2>
          <EditTaskForm
            task={{
              title: task.title,
              description: task.description,
              priority: task.priority,
              deadline: task.deadline ?? null,
            }}
            onSubmit={async (data) => { await updateTaskMutation.mutateAsync(data); }}
            onCancel={() => setShowEditTask(false)}
          />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            {task.description && (
              <p className="mt-2 text-muted-foreground">{task.description}</p>
            )}
          </div>
          {canManageAssignments && (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowEditTask(true)}>
                Editar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmDeleteTask(true)}>
                Deletar
              </Button>
            </div>
          )}
        </div>
      )}

      {confirmDeleteTask && (
        <ConfirmDialog
          message="Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita."
          onConfirm={() => deleteTaskMutation.mutate()}
          onCancel={() => setConfirmDeleteTask(false)}
        />
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Labels</h2>
        <TaskLabels
          workspaceId={workspaceId}
          projectId={projectId}
          taskId={taskId}
          token={accessToken!}
          workspaceLabels={workspaceLabels}
          taskLabels={taskLabels}
          canManage={canManageAssignments}
          onUpdate={handleLabelsUpdate}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Passos</h2>
        {assignError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{assignError}</p>
        )}
        <StepList
          steps={steps}
          members={members}
          canManageAssignments={canManageAssignments}
          onStatusChange={(stepId, status) => stepStatusMutation.mutate({ stepId, status })}
          onAssign={(stepId, userId) => assignMutation.mutate({ stepId, userId })}
          onUnassign={(stepId, userId) => unassignMutation.mutate({ stepId, userId })}
          onDelete={(stepId) => deleteStepMutation.mutate(stepId)}
        />
        {canManageAssignments && (
          <div className="flex gap-2">
            <Input
              placeholder="Novo passo..."
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newStep.trim()) {
                  createStepMutation.mutate(newStep.trim());
                }
              }}
            />
            <Button
              onClick={() => newStep.trim() && createStepMutation.mutate(newStep.trim())}
              disabled={!newStep.trim()}
            >
              Adicionar
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Comentários</h2>
        <CommentList
          comments={comments}
          currentUserId={user?.id ?? ""}
          onDelete={(id) => deleteCommentMutation.mutate(id)}
        />
        <div className="space-y-2">
          <Label htmlFor="new-comment">Novo comentário</Label>
          <div className="flex gap-2">
            <Input
              id="new-comment"
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
              disabled={!newComment.trim()}
            >
              Enviar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
