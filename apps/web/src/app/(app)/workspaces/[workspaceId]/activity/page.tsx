"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { activityService } from "@web/services/activity.service";
import { workspaceService } from "@web/services/workspace.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { ActivityLogList } from "@web/components/features/activity/activity-log-list";
import { ActivityFilters, type Filters } from "@web/components/features/activity/activity-filters";
import { BackLink } from "@web/components/layout/back-link";

interface ActivityLog {
  id: string;
  action: string;
  created_at: Date;
  user: { id: string; name: string };
  metadata: Record<string, unknown>;
}

interface MemberWithUser {
  user_id: string;
  user: { id: string; name: string };
}

const EMPTY_FILTERS: Filters = { user_id: "", action: "", from: "", to: "" };

export default function WorkspaceActivityPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { accessToken } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const activeFilters = {
    user_id: filters.user_id || undefined,
    action: filters.action || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["activity", workspaceId, filters],
    queryFn: () => activityService.listByWorkspace(workspaceId, accessToken!, activeFilters),
    enabled: !!accessToken,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService.listMembers(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const logs: ActivityLog[] =
    (data as { data: { logs: ActivityLog[] } } | undefined)?.data?.logs ?? [];

  const members: { id: string; name: string }[] =
    ((membersData as { data: { members: MemberWithUser[] } } | undefined)?.data?.members ?? [])
      .map((m) => ({ id: m.user_id, name: m.user.name }));

  return (
    <div className="max-w-2xl space-y-6">
      <BackLink href={`/workspaces/${workspaceId}`} label="Projetos" />
      <div>
        <h1 className="text-2xl font-bold">Histórico de atividades</h1>
        <p className="text-sm text-muted-foreground">{currentWorkspace?.name}</p>
      </div>

      <ActivityFilters members={members} filters={filters} onChange={setFilters} />

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <ActivityLogList logs={logs} />
      )}
    </div>
  );
}
