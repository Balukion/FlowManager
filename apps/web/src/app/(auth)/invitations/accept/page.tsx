"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { invitationService, previewInvitation } from "@web/services/invitation.service";
import { createAuthenticatedClient } from "@web/services/api.client";
import { authService } from "@web/services/auth.service";
import { getErrorMessage } from "@shared/utils";
import { useAuthStore } from "@web/stores/auth.store";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import type { AuthResponse } from "@flowmanager/types";

interface PreviewData {
  workspace_name: string;
  email: string;
  invited_by_name: string;
}

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { accessToken, _hasHydrated, setAuth } = useAuthStore();

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [tab, setTab] = useState<"login" | "register">("login");

  // Accept flow state
  const [acceptStatus, setAcceptStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [acceptMessage, setAcceptMessage] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // Load preview on mount
  useEffect(() => {
    if (!token) return;
    previewInvitation(token)
      .then((res) => {
        const d = (res as { data: PreviewData }).data;
        setPreview(d);
        setLoginEmail(d.email);
        setRegisterEmail(d.email);
      })
      .catch((err: unknown) => {
        setPreviewError(getErrorMessage(err, "Convite inválido"));
      });
  }, [token]);

  // Auto-accept once authenticated
  async function acceptInvitation(authToken: string) {
    setAcceptStatus("loading");
    try {
      await invitationService(createAuthenticatedClient(authToken)).accept(token);
      setAcceptStatus("success");
      setAcceptMessage("Convite aceito! Você agora é membro do workspace.");
      setTimeout(() => router.push("/workspaces"), 2000);
    } catch (err: unknown) {
      setAcceptStatus("error");
      setAcceptMessage(getErrorMessage(err, "Erro ao aceitar convite"));
    }
  }

  // If already authenticated, show accept button
  useEffect(() => {
    if (!_hasHydrated) return;
    if (accessToken && preview && acceptStatus === "idle") {
      // user is already logged in — ready to accept
    }
  }, [_hasHydrated, accessToken, preview, acceptStatus]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await authService.login(loginEmail, loginPassword) as AuthResponse;
      setAuth(res.data.user, res.data.access_token);
      await acceptInvitation(res.data.access_token);
    } catch (err: unknown) {
      setLoginError(getErrorMessage(err, "Email ou senha inválidos"));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError("");
    setRegisterLoading(true);
    try {
      const res = await authService.register(registerName, registerEmail, registerPassword) as AuthResponse;
      setAuth(res.data.user, res.data.access_token);
      await acceptInvitation(res.data.access_token);
    } catch (err: unknown) {
      setRegisterError(getErrorMessage(err, "Erro ao criar conta"));
    } finally {
      setRegisterLoading(false);
    }
  }

  if (!token) {
    return <p className="text-destructive">Token de convite inválido.</p>;
  }

  if (previewError) {
    return <p className="text-destructive">{previewError}</p>;
  }

  if (!preview) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (acceptStatus === "success") {
    return (
      <div className="space-y-2 text-center">
        <p className="font-medium text-green-600">{acceptMessage}</p>
        <p className="text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  // Authenticated — show accept button
  if (_hasHydrated && accessToken) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Aceitar convite</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong>{preview.invited_by_name}</strong> convidou você para{" "}
            <strong>{preview.workspace_name}</strong>.
          </p>
        </div>

        {acceptStatus === "error" && (
          <p className="text-sm text-destructive">{acceptMessage}</p>
        )}

        <Button
          onClick={() => acceptInvitation(accessToken)}
          disabled={acceptStatus === "loading"}
          className="w-full"
        >
          {acceptStatus === "loading" ? "Aceitando..." : "Aceitar convite"}
        </Button>
      </div>
    );
  }

  // Not authenticated — show login / register tabs
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Aceitar convite</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <strong>{preview.invited_by_name}</strong> convidou você para{" "}
          <strong>{preview.workspace_name}</strong>.
        </p>
      </div>

      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "login"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("login")}
        >
          Já tenho conta
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "register"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("register")}
        >
          Criar conta
        </button>
      </div>

      {tab === "login" && (
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <Input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>
          {loginError && <p className="text-sm text-destructive">{loginError}</p>}
          <Button type="submit" className="w-full" disabled={loginLoading}>
            {loginLoading ? "Entrando..." : "Entrar e aceitar convite"}
          </Button>
        </form>
      )}

      {tab === "register" && (
        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <Input
              type="text"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <Input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
            />
          </div>
          {registerError && <p className="text-sm text-destructive">{registerError}</p>}
          <Button type="submit" className="w-full" disabled={registerLoading}>
            {registerLoading ? "Criando conta..." : "Criar conta e aceitar convite"}
          </Button>
        </form>
      )}
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
