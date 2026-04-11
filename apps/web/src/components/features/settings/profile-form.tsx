"use client";

import { useState } from "react";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";

const TIMEZONES = [
  "UTC",
  "America/Noronha",
  "America/Fortaleza",
  "America/Recife",
  "America/Maceio",
  "America/Bahia",
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Rio_Branco",
  "America/Belem",
  "America/Santarem",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Buenos_Aires",
  "America/Santiago",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Bucharest",
  "Europe/Helsinki",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

interface ProfileFormProps {
  initialName: string;
  initialTimezone: string;
  onSubmit: (data: { name: string; timezone: string }) => Promise<void>;
}

export function ProfileForm({ initialName, initialTimezone, onSubmit }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState(initialTimezone);
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
      await onSubmit({ name: name.trim(), timezone });
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

      <div className="space-y-1">
        <Label htmlFor="profile-timezone">Fuso horário</Label>
        <select
          id="profile-timezone"
          value={timezone}
          onChange={(e) => { setTimezone(e.target.value); setSuccess(false); }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Fuso horário"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {success && <p className="text-sm text-green-600">Salvo com sucesso!</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
