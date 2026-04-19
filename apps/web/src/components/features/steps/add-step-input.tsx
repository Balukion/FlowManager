"use client";

import { useState } from "react";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";

interface AddStepInputProps {
  onAdd: (title: string) => Promise<unknown> | void;
}

export function AddStepInput({ onAdd }: AddStepInputProps) {
  const [value, setValue] = useState("");

  async function handleSubmit() {
    const title = value.trim();
    if (!title) return;
    try {
      await onAdd(title);
      setValue("");
    } catch {
      // mantém o valor para que o usuário possa tentar novamente
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Novo passo..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />
      <Button onClick={handleSubmit} disabled={!value.trim()}>
        Adicionar
      </Button>
    </div>
  );
}
