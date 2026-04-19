import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { workspaceService } from "@web/services/workspace.service";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { useAuthStore } from "@web/stores/auth.store";
import { useApiClient } from "@web/hooks/use-api-client";
import type { Workspace, ApiResponse } from "@flowmanager/types";

export function useWorkspace() {
  const { accessToken } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const client = useApiClient();

  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceService(client).list(),
    enabled: !!accessToken,
  });

  const workspaces: Workspace[] =
    (data as ApiResponse<{ workspaces: Workspace[] }> | undefined)?.data?.workspaces ?? [];

  useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0) {
      setCurrentWorkspace(workspaces[0]!);
    }
  }, [currentWorkspace, workspaces, setCurrentWorkspace]);

  function selectWorkspace(workspace: Workspace) {
    setCurrentWorkspace(workspace);
  }

  return { workspaces, currentWorkspace, selectWorkspace, isLoading };
}
