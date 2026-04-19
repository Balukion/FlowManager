"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceRole } from "@web/hooks/use-workspace-role";
import { useTaskPageData } from "@web/hooks/use-task-page-data";
import { useTaskMutations } from "@web/hooks/use-task-mutations";
import { StepList } from "@web/components/features/steps/step-list";
import { AddStepInput } from "@web/components/features/steps/add-step-input";
import { ActivityLogList } from "@web/components/features/activity/activity-log-list";
import { BackLink } from "@web/components/layout/back-link";
import { CommentList } from "@web/components/features/comments/comment-list";
import { AddCommentInput } from "@web/components/features/comments/add-comment-input";
import { TaskLabels } from "@web/components/features/labels/task-labels";
import { EditTaskForm } from "@web/components/features/tasks/edit-task-form";
import { TaskStatusSelect } from "@web/components/features/tasks/task-status-select";
import { TaskWatchButton } from "@web/components/features/tasks/task-watch-button";
import { ConfirmDialog } from "@web/components/ui/confirm-dialog";
import { Button } from "@web/components/ui/button";
import { useAuthStore } from "@web/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";

export default function TaskPage() {
  const { workspaceId, projectId, taskId } = useParams<{
    workspaceId: string;
    projectId: string;
    taskId: string;
  }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { isAdminOrOwner: canManageAssignments } = useWorkspaceRole(workspaceId);
  const [showEditTask, setShowEditTask] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(false);

  const {
    task,
    isWatching,
    steps,
    members,
    activityLogs,
    comments,
    workspaceLabels,
    taskLabels,
  } = useTaskPageData({ workspaceId, projectId, taskId });

  const {
    stepStatusMutation,
    createStepMutation,
    assignMutation,
    unassignMutation,
    deleteStepMutation,
    updateTaskMutation,
    deleteTaskMutation,
    createCommentMutation,
    deleteCommentMutation,
    editCommentMutation,
    replyMutation,
    updateStatusMutation,
    reorderStepsMutation,
    assignTaskMutation,
    watchMutation,
    unwatchMutation,
    assignError,
  } = useTaskMutations({
    workspaceId,
    projectId,
    taskId,
    onUpdateTaskSuccess: () => setShowEditTask(false),
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
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            {task.description && (
              <p className="text-muted-foreground">{task.description}</p>
            )}
            <div className="flex items-center gap-3">
              <TaskStatusSelect
                status={task.status}
                onChange={(status) => updateStatusMutation.mutate(status)}
                disabled={!canManageAssignments}
              />
              <TaskWatchButton
                isWatching={isWatching}
                onWatch={() => watchMutation.mutate()}
                onUnwatch={() => unwatchMutation.mutate()}
              />
            </div>
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
        <h2 className="font-semibold">Responsável</h2>
        {canManageAssignments ? (
          <select
            aria-label="Atribuir responsável"
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
            value={task.assignee_id ?? ""}
            onChange={(e) => assignTaskMutation.mutate(e.target.value || null)}
          >
            <option value="">Sem responsável</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-muted-foreground">
            {task.assignee?.name ?? "Sem responsável"}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Labels</h2>
        <TaskLabels
          workspaceId={workspaceId}
          projectId={projectId}
          taskId={taskId}
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
          onReorder={(order) => reorderStepsMutation.mutate(order)}
        />
        {canManageAssignments && (
          <AddStepInput
            onAdd={(title) => createStepMutation.mutateAsync(title)}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Comentários</h2>
        <CommentList
          comments={comments}
          currentUserId={user?.id ?? ""}
          members={members}
          onDelete={(id) => deleteCommentMutation.mutate(id)}
          onEdit={(id, content) => editCommentMutation.mutate({ commentId: id, content })}
          onReply={(parentId, content, mentions) => replyMutation.mutate({ parentId, content, mentions })}
        />
        <AddCommentInput
          members={members}
          onSubmit={(content, mentions) => createCommentMutation.mutateAsync({ content, mentions })}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Histórico</h2>
        <ActivityLogList logs={activityLogs} />
      </section>
    </div>
  );
}
