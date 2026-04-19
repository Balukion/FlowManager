import { useQuery } from "@tanstack/react-query";
import { taskService } from "@web/services/task.service";
import { stepService } from "@web/services/step.service";
import { commentService } from "@web/services/comment.service";
import { labelService } from "@web/services/label.service";
import { workspaceService } from "@web/services/workspace.service";
import { activityService } from "@web/services/activity.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useApiClient } from "@web/hooks/use-api-client";
import type { Step, MemberWithUser, ApiResponse } from "@flowmanager/types";

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface CommentWithUser {
  id: string;
  task_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  edited_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  user: { id: string; name: string; avatar_url: string | null };
}

interface ActivityLog {
  id: string;
  action: string;
  created_at: Date;
  user: { id: string; name: string };
  metadata: Record<string, unknown>;
}

interface TaskData {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assignee_id: string | null;
  assignee?: { id: string; name: string } | null;
  task_labels?: { label: TaskLabel }[];
}

interface UseTaskPageDataParams {
  workspaceId: string;
  projectId: string;
  taskId: string;
}

interface UseTaskPageDataResult {
  task: TaskData | undefined;
  isWatching: boolean;
  steps: (Step & { assignments?: { user_id: string; user: { id: string; name: string; avatar_url: string | null } }[] })[];
  members: MemberWithUser[];
  activityLogs: ActivityLog[];
  comments: CommentWithUser[];
  workspaceLabels: TaskLabel[];
  taskLabels: TaskLabel[];
  isLoading: boolean;
}

export function useTaskPageData({
  workspaceId,
  projectId,
  taskId,
}: UseTaskPageDataParams): UseTaskPageDataResult {
  const { accessToken } = useAuthStore();
  const client = useApiClient();
  const enabled = !!accessToken;

  const { data: taskData, isLoading: isLoadingTask } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskService(client).get(workspaceId, projectId, taskId),
    enabled,
  });

  const { data: stepsData, isLoading: isLoadingSteps } = useQuery({
    queryKey: ["steps", taskId],
    queryFn: () => stepService(client).list(workspaceId, projectId, taskId),
    enabled,
  });

  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => commentService(client).list(workspaceId, projectId, taskId),
    enabled,
  });

  const { data: labelsData, isLoading: isLoadingLabels } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => labelService(client).list(workspaceId),
    enabled,
  });

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService(client).listMembers(workspaceId),
    enabled,
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["activity", taskId],
    queryFn: () => activityService(client).listByTask(workspaceId, projectId, taskId),
    enabled,
  });

  const taskResponse = (taskData as ApiResponse<{ task: TaskData; is_watching?: boolean }> | undefined);

  const task = taskResponse?.data?.task;
  const isWatching = taskResponse?.data?.is_watching ?? false;

  const steps = (stepsData as ApiResponse<{ steps: UseTaskPageDataResult["steps"] }> | undefined)?.data?.steps ?? [];
  const members: MemberWithUser[] = (membersData as ApiResponse<{ members: MemberWithUser[] }> | undefined)?.data?.members ?? [];
  const activityLogs: ActivityLog[] = (activityData as ApiResponse<{ logs: ActivityLog[] }> | undefined)?.data?.logs ?? [];

  const rawComments = (commentsData as ApiResponse<{ comments: Record<string, unknown>[] }> | undefined)?.data?.comments ?? [];
  const comments: CommentWithUser[] = rawComments.map((c) => ({ ...c, user: c.author } as CommentWithUser));

  const workspaceLabels: TaskLabel[] = (labelsData as ApiResponse<{ labels: TaskLabel[] }> | undefined)?.data?.labels ?? [];
  const taskLabels: TaskLabel[] = task?.task_labels?.map((tl) => tl.label) ?? [];

  const isLoading =
    isLoadingTask ||
    isLoadingSteps ||
    isLoadingComments ||
    isLoadingLabels ||
    isLoadingMembers ||
    isLoadingActivity;

  return { task, isWatching, steps, members, activityLogs, comments, workspaceLabels, taskLabels, isLoading };
}
