import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { workspaceService } from "@web/services/workspace.service";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { useAuthStore } from "@web/stores/auth.store";
import type { Workspace } from "@flowmanager/types";

export function useWorkspace() {
  const { accessToken } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceService.list(accessToken!),
    enabled: !!accessToken,
  });

  const workspaces: Workspace[] =
    (data as { data: { workspaces: Workspace[] } } | undefined)?.data?.workspaces ?? [];

  useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [currentWorkspace, workspaces, setCurrentWorkspace]);

  function selectWorkspace(workspace: Workspace) {
    setCurrentWorkspace(workspace);
  }

  return { workspaces, currentWorkspace, selectWorkspace, isLoading };
}
