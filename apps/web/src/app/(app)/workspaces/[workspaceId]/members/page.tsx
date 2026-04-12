"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@web/services/workspace.service";
import { invitationService } from "@web/services/invitation.service";
import { useAuthStore } from "@web/stores/auth.store";
import { useWorkspaceStore } from "@web/stores/workspace.store";
import { useWorkspaceRole } from "@web/hooks/use-workspace-role";
import { MemberList } from "@web/components/features/invitations/member-list";
import { InvitationList } from "@web/components/features/invitations/invitation-list";
import { InviteMemberForm } from "@web/components/features/invitations/invite-member-form";
import { Button } from "@web/components/ui/button";

interface MemberWithUser {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  position: number | null;
  last_seen_at: Date | null;
  joined_at: Date;
  user: { id: string; name: string; email: string; avatar_url: string | null };
}

interface Invitation {
  id: string;
  workspace_id: string;
  invited_by: string;
  email: string;
  role: string;
  status: string;
  expires_at: Date;
  viewed_at: Date | null;
  accepted_at: Date | null;
  declined_at: Date | null;
  created_at: Date;
}

export default function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { isAdminOrOwner } = useWorkspaceRole(workspaceId);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: membersData } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService.listMembers(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const { data: invitationsData } = useQuery({
    queryKey: ["invitations", workspaceId],
    queryFn: () => invitationService.list(workspaceId, accessToken!),
    enabled: !!accessToken,
  });

  const members: MemberWithUser[] =
    (membersData as { data: { members: MemberWithUser[] } } | undefined)?.data?.members ?? [];

  const currentMember = members.find((m) => m.user_id === user?.id);

  const invitations: Invitation[] =
    (invitationsData as { data: { invitations: Invitation[] } } | undefined)?.data?.invitations ?? [];

  const inviteMutation = useMutation({
    mutationFn: (email: string) => invitationService.create(workspaceId, email, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", workspaceId] });
      setShowForm(false);
      setFeedback("Convite enviado com sucesso!");
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: { message?: string }) => {
      setFeedback(err.message ?? "Erro ao enviar convite");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      workspaceService.removeMember(workspaceId, userId, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", workspaceId] }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      workspaceService.updateMemberRole(workspaceId, userId, role, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", workspaceId] }),
    onError: (err: { message?: string }) => {
      setFeedback(err.message ?? "Erro ao alterar papel");
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (invitationId: string) =>
      invitationService.cancel(workspaceId, invitationId, accessToken!),
    onSuccess: () => queryClient.refetchQueries({ queryKey: ["invitations", workspaceId] }),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-sm text-muted-foreground">{currentWorkspace?.name}</p>
        </div>
        {isAdminOrOwner && (
          <Button onClick={() => setShowForm(true)}>Convidar membro</Button>
        )}
      </div>

      {feedback && (
        <p className="rounded-md bg-muted px-4 py-2 text-sm">{feedback}</p>
      )}

      {showForm && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Convidar por email</h2>
          <InviteMemberForm
            onSubmit={async (email) => { await inviteMutation.mutateAsync(email); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">Membros ativos</h2>
        <MemberList
          members={members}
          ownerId={currentWorkspace?.owner_id ?? ""}
          currentUserId={user?.id ?? ""}
          currentUserRole={currentMember?.role}
          onRemove={(userId) => removeMutation.mutate(userId)}
          onChangeRole={(userId, role) => changeRoleMutation.mutate({ userId, role })}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Convites pendentes</h2>
        <InvitationList
          invitations={invitations.filter((i) => i.status === "PENDING")}
          canManage={isAdminOrOwner}
          onCancel={(id) => cancelInviteMutation.mutate(id)}
        />
      </section>
    </div>
  );
}
