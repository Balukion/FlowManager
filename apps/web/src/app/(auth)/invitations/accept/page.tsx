"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { invitationService } from "@web/services/invitation.service";
import { useAuthStore } from "@web/stores/auth.store";
import { Button } from "@web/components/ui/button";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { accessToken, _hasHydrated } = useAuthStore();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!accessToken) {
      router.replace(`/login?redirect=/invitations/accept?token=${token}`);
    }
  }, [_hasHydrated, accessToken, token, router]);

  async function handleAccept() {
    if (!token || !accessToken) return;
    setStatus("loading");
    try {
      await invitationService.accept(token, accessToken);
      setStatus("success");
      setMessage("Convite aceito! Você agora é membro do workspace.");
      setTimeout(() => router.push("/workspaces"), 2000);
    } catch (err: unknown) {
      setStatus("error");
      setMessage((err as { message?: string })?.message ?? "Erro ao aceitar convite");
    }
  }

  if (!_hasHydrated || !accessToken) return null;

  if (status === "success") {
    return (
      <div className="space-y-2 text-center">
        <p className="font-medium text-green-600">{message}</p>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Aceitar convite</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Você foi convidado para participar de um workspace.
        </p>
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">{message}</p>
      )}

      <Button onClick={handleAccept} disabled={status === "loading" || !token} className="w-full">
        {status === "loading" ? "Aceitando..." : "Aceitar convite"}
      </Button>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationContent />
    </Suspense>
  );
}
