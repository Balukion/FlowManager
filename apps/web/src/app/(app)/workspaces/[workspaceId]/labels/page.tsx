"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { labelService } from "@web/services/label.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceRole } from "@web/hooks/use-workspace-role";
import { LabelManager } from "@web/components/features/labels/label-manager";

interface Label {
  id: string;
  name: string;
  color: string;
}

export default function LabelsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const { isAdminOrOwner } = useWorkspaceRole(workspaceId);

  const { data } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => labelService.list(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const labels: Label[] =
    (data as { data: { labels: Label[] } } | undefined)?.data?.labels ?? [];

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
        token={accessToken!}
        labels={labels}
        canManage={isAdminOrOwner}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
