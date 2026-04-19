"use client";

import { CreateEntityForm } from "@web/components/features/create-entity-form";

interface CreateWorkspaceFormProps {
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}

export function CreateWorkspaceForm({ onSubmit, onCancel }: CreateWorkspaceFormProps) {
  return (
    <CreateEntityForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      namePlaceholder="Nome do workspace"
      idPrefix="ws"
    />
  );
}
