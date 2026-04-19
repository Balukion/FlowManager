"use client";

import { CreateEntityForm } from "@web/components/features/create-entity-form";

interface CreateProjectFormProps {
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}

export function CreateProjectForm({ onSubmit, onCancel }: CreateProjectFormProps) {
  return (
    <CreateEntityForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      namePlaceholder="Nome do projeto"
      idPrefix="proj"
    />
  );
}
