import { useQuery } from "@tanstack/react-query";
import { workspaceService } from "@web/services/workspace.service";
import { useApiClient } from "@web/hooks/use-api-client";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import type { WorkspaceMember } from "@flowmanager/types";

interface UseWorkspaceRoleResult {
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrOwner: boolean;
  isMember: boolean;
  currentMember: WorkspaceMember | null;
  isLoading: boolean;
}

export function useWorkspaceRole(workspaceId: string): UseWorkspaceRoleResult {
  const { accessToken, user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const client = useApiClient();

  const { data: meData, isLoading } = useQuery({
    queryKey: ["workspace-me", workspaceId],
    queryFn: () => workspaceService(client).getMe(workspaceId),
    enabled: !!accessToken,
  });

  const currentMember =
    (meData as { data: { member: WorkspaceMember } } | undefined)?.data?.member ?? null;

  const isOwner = currentWorkspace?.owner_id === user?.id;
  const isAdmin = currentMember?.role === "ADMIN";
  const isAdminOrOwner = isOwner || isAdmin;
  const isMember = currentMember !== null;

  return { isOwner, isAdmin, isAdminOrOwner, isMember, currentMember, isLoading };
}
