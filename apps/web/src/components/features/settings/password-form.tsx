"use client";

import { useState } from "react";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";

interface PasswordFormProps {
  onSubmit: (data: { current_password: string; new_password: string }) => Promise<void>;
}

export function PasswordForm({ onSubmit }: PasswordFormProps) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ newPwd?: string; confirm?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: { newPwd?: string; confirm?: string } = {};
    if (newPwd.length < 8) errors.newPwd = "Senha deve ter pelo menos 8 caracteres";
    if (newPwd !== confirm) errors.confirm = "As senhas não coincidem";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await onSubmit({ current_password: current, new_password: newPwd });
      setSuccess(true);
      setCurrent("");
      setNewPwd("");
      setConfirm("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="current-password">Senha atual</Label>
        <Input
          id="current-password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          id="new-password"
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder="••••••••"
        />
        {fieldErrors.newPwd && <p className="text-sm text-destructive">{fieldErrors.newPwd}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
        />
        {fieldErrors.confirm && <p className="text-sm text-destructive">{fieldErrors.confirm}</p>}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {success && <p className="text-sm text-green-600">Senha alterada com sucesso!</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
