"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { labelService } from "@web/services/label.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceRole } from "@web/hooks/use-workspace-role";
import { useApiClient } from "@web/hooks/use-api-client";
import { LabelManager } from "@web/components/features/labels/label-manager";
import type { ApiResponse } from "@flowmanager/types";

interface Label {
  id: string;
  name: string;
  color: string;
}

export default function LabelsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const client = useApiClient();

  const { isAdminOrOwner } = useWorkspaceRole(workspaceId);

  const { data } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => labelService(client).list(workspaceId),
    enabled: !!accessToken,
  });

  const labels: Label[] =
    (data as ApiResponse<{ labels: Label[] }> | undefined)?.data?.labels ?? [];

  function handleUpdate() {
    queryClient.invalidateQueries({ queryKey: ["labels", workspaceId] });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Labels</h1>
        <p className="text-sm text-muted-foreground">
          Crie e gerencie as labels deste workspace
        </p>
      </div>

      <LabelManager
        workspaceId={workspaceId}
        labels={labels}
        canManage={isAdminOrOwner}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
