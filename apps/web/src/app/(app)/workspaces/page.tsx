"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@web/services/workspace.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { WorkspaceCard } from "@web/components/features/workspaces/workspace-card";
import { CreateWorkspaceForm } from "@web/components/features/workspaces/create-workspace-form";
import { Button } from "@web/components/ui/button";
import type { Workspace } from "@flowmanager/types";

export default function WorkspacesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const { setCurrentWorkspace } = useWorkspaceStore();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceService.list(accessToken!),
    enabled: !!accessToken,
  });

  const workspaces: Workspace[] =
    (data as { data: { workspaces: Workspace[] } } | undefined)?.data?.workspaces ?? [];

  const createMutation = useMutation({
    mutationFn: (formData: { name: string; description?: string }) =>
      workspaceService.create(formData, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setShowForm(false);
    },
  });

  function handleClick(workspace: Workspace) {
    setCurrentWorkspace(workspace);
    router.push(`/workspaces/${workspace.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Button onClick={() => setShowForm(true)}>Novo workspace</Button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Criar workspace</h2>
          <CreateWorkspaceForm
            onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      {!isLoading && workspaces.length === 0 && !showForm && (
        <p className="text-muted-foreground">Nenhum workspace encontrado.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} onClick={handleClick} />
        ))}
      </div>
    </div>
  );
}
