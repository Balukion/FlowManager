"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@web/services/user.service";
import { useAuthStore } from "@web/stores/auth.store";
import { ProfileForm } from "@web/components/features/settings/profile-form";
import { PasswordForm } from "@web/components/features/settings/password-form";
import { AvatarUpload } from "@web/components/features/settings/avatar-upload";

export default function SettingsPage() {
  const { user, accessToken, setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; timezone: string }) =>
      userService.updateMe(data, accessToken!),
    onSuccess: (data) => {
      const updated = (data as { data: { user: typeof user } })?.data?.user;
      if (updated && accessToken) setAuth(updated, accessToken);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      userService.updatePassword(data, accessToken!),
  });

  function handleAvatarUpdate(url: string | null) {
    if (!user || !accessToken) return;
    setAuth({ ...user, avatar_url: url ?? undefined }, accessToken);
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  if (!user) return null;

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu perfil e segurança</p>
      </div>

      <section className="rounded-lg border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold">Perfil</h2>
        <AvatarUpload
          currentAvatarUrl={user.avatar_url ?? null}
          userName={user.name}
          token={accessToken!}
          onUpdate={handleAvatarUpdate}
        />
        <ProfileForm
          initialName={user.name}
          initialTimezone={user.timezone ?? "UTC"}
          onSubmit={async (data) => { await updateProfileMutation.mutateAsync(data); }}
        />
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Alterar senha</h2>
        <PasswordForm
          onSubmit={async (data) => { await updatePasswordMutation.mutateAsync(data); }}
        />
      </section>
    </div>
  );
}
