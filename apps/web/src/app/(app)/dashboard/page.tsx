"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@web/services/dashboard.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { DashboardStats } from "@web/components/features/dashboard/dashboard-stats";
import { RecentTasksList } from "@web/components/features/dashboard/recent-tasks";

interface DashboardData {
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
  };
  members_count: number;
  recent_tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline: string | null;
    created_at: string;
  }[];
}

export default function DashboardPage() {
  const { accessToken } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", currentWorkspace?.id],
    queryFn: () => dashboardService.get(currentWorkspace!.id, accessToken!),
    enabled: !!currentWorkspace && !!accessToken,
  });

  const dashboardData = (data as { data: DashboardData } | undefined)?.data;

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Selecione um workspace na barra lateral</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  if (!dashboardData) return <p className="text-muted-foreground">Sem dados disponíveis.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
        <p className="text-sm text-muted-foreground">Visão geral do workspace</p>
      </div>

      <DashboardStats tasks={dashboardData.tasks} members_count={dashboardData.members_count} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Tarefas recentes</h2>
        <RecentTasksList tasks={dashboardData.recent_tasks} />
      </div>
    </div>
  );
}
