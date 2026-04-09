"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { labelService } from "@web/services/label.service";
import { workspaceService } from "@web/services/workspace.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { LabelManager } from "@web/components/features/labels/label-manager";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface MemberWithUser {
  user_id: string;
  role: string;
}

export default function LabelsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { accessToken, user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => labelService.list(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService.listMembers(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const labels: Label[] =
    (data as { data: { labels: Label[] } } | undefined)?.data?.labels ?? [];

  const members: MemberWithUser[] =
    (membersData as { data: { members: MemberWithUser[] } } | undefined)?.data?.members ?? [];
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isAdminOrOwner =
    currentWorkspace?.owner_id === user?.id || currentMember?.role === "ADMIN";

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
