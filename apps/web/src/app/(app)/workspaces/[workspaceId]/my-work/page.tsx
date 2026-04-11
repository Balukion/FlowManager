"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { stepService } from "@web/services/step.service";
import { useAuthStore } from "@web/stores/auth.store";
import { MyStepsList } from "@web/components/features/steps/my-steps-list";

interface AssignedStep {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  task: {
    id: string;
    title: string;
    number: number;
    project_id: string;
    project: { id: string; name: string };
  };
}

export default function MyWorkPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { accessToken } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["my-steps", workspaceId],
    queryFn: () => stepService.listAssigned(workspaceId, accessToken!),
    enabled: !!workspaceId && !!accessToken,
  });

  const steps: AssignedStep[] = (data as { data: { steps: AssignedStep[] } } | undefined)?.data?.steps ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu trabalho</h1>
        <p className="text-sm text-muted-foreground">Passos atribuídos a você neste workspace</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <MyStepsList steps={steps} workspaceId={workspaceId} />
      )}
    </div>
  );
}
