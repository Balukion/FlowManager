import { useQuery } from "@tanstack/react-query";
import { workspaceService } from "@web/services/workspace.service";
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

  const { data: membersData, isLoading } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService.listMembers(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const members: WorkspaceMember[] =
    (membersData as { data: { members: WorkspaceMember[] } } | undefined)?.data?.members ?? [];

  const currentMember = members.find((m) => m.user_id === user?.id) ?? null;
  const isOwner = currentWorkspace?.owner_id === user?.id;
  const isAdmin = currentMember?.role === "ADMIN";
  const isAdminOrOwner = isOwner || isAdmin;
  const isMember = currentMember !== null;

  return { isOwner, isAdmin, isAdminOrOwner, isMember, currentMember, isLoading };
}
