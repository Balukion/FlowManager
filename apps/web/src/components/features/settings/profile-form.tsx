"use client";

import { useState } from "react";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";

interface ProfileFormProps {
  initialName: string;
  onSubmit: (name: string) => Promise<void>;
}

export function ProfileForm({ initialName, onSubmit }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Nome é obrigatório");
      return;
    }
    setNameError(null);
    setSubmitError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="profile-name">Nome</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSuccess(false); }}
          placeholder="Seu nome"
        />
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {success && <p className="text-sm text-green-600">Salvo com sucesso!</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
