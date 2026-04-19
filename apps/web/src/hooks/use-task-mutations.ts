import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { taskService } from "@web/services/task.service";
import { stepService } from "@web/services/step.service";
import { commentService } from "@web/services/comment.service";
import { useApiClient } from "@web/hooks/use-api-client";

interface UseTaskMutationsParams {
  workspaceId: string;
  projectId: string;
  taskId: string;
  onUpdateTaskSuccess?: () => void;
}

export function useTaskMutations({
  workspaceId,
  projectId,
  taskId,
  onUpdateTaskSuccess,
}: UseTaskMutationsParams) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const client = useApiClient();
  const [assignError, setAssignError] = useState<string | null>(null);

  const stepStatusMutation = useMutation({
    mutationFn: ({ stepId, status }: { stepId: string; status: string }) =>
      stepService(client).updateStatus(workspaceId, projectId, taskId, stepId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
    },
  });

  const createStepMutation = useMutation({
    mutationFn: (title: string) =>
      stepService(client).create(workspaceId, projectId, taskId, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ stepId, userId }: { stepId: string; userId: string }) =>
      stepService(client).assign(workspaceId, projectId, taskId, stepId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
      setAssignError(null);
    },
    onError: (err: { message?: string }) => {
      setAssignError(err.message ?? "Erro ao atribuir membro");
      setTimeout(() => setAssignError(null), 4000);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: ({ stepId, userId }: { stepId: string; userId: string }) =>
      stepService(client).unassign(workspaceId, projectId, taskId, stepId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
    onError: (err: { message?: string }) => {
      setAssignError(err.message ?? "Erro ao remover atribuição");
      setTimeout(() => setAssignError(null), 4000);
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      stepService(client).delete(workspaceId, projectId, taskId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: { title: string; description: string | null; priority: string; deadline: string | null }) =>
      taskService(client).update(workspaceId, projectId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
      onUpdateTaskSuccess?.();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService(client).delete(workspaceId, projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: ({ content, mentions }: { content: string; mentions: string[] }) =>
      commentService(client).create(workspaceId, projectId, taskId, content, mentions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentService(client).delete(workspaceId, projectId, taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentService(client).update(workspaceId, projectId, taskId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ parentId, content, mentions }: { parentId: string; content: string; mentions: string[] }) =>
      commentService(client).reply(workspaceId, projectId, taskId, content, parentId, mentions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      taskService(client).updateStatus(workspaceId, projectId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
    },
  });

  const reorderStepsMutation = useMutation({
    mutationFn: (order: string[]) =>
      stepService(client).reorder(workspaceId, projectId, taskId, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps", taskId] });
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: (userId: string | null) =>
      taskService(client).assign(workspaceId, projectId, taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId, projectId] });
    },
  });

  const watchMutation = useMutation({
    mutationFn: () => taskService(client).watch(workspaceId, projectId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const unwatchMutation = useMutation({
    mutationFn: () => taskService(client).unwatch(workspaceId, projectId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  return {
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
  };
}
