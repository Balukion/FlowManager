"use client";

import { Input } from "@web/components/ui/input";
import { Button } from "@web/components/ui/button";

interface LabelFormProps {
  name: string;
  color: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
}

export function LabelForm({
  name,
  color,
  onNameChange,
  onColorChange,
  onSubmit,
  onCancel,
  submitLabel,
}: LabelFormProps) {
  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded border p-0.5"
        aria-label="Cor da label"
      />
      <Input
        placeholder="Nome da label"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        className="flex-1"
        autoFocus={!!onCancel}
      />
      <Button type="button" size="sm" onClick={onSubmit}>
        {submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} aria-label="Cancelar">
          Cancelar
        </Button>
      )}
    </div>
  );
}
