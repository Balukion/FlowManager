"use client";

import { useState } from "react";
import { labelService } from "@web/services/label.service";
import { LabelBadge } from "./label-badge";
import { LabelForm } from "./label-form";
import { Button } from "@web/components/ui/button";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelManagerProps {
  workspaceId: string;
  token: string;
  labels: Label[];
  canManage?: boolean;
  onUpdate: () => void;
}

const DEFAULT_COLOR = "#6366f1";

export function LabelManager({ workspaceId, token, labels, canManage = false, onUpdate }: LabelManagerProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    await labelService.create(workspaceId, { name: newName.trim(), color: newColor }, token);
    setNewName("");
    setNewColor(DEFAULT_COLOR);
    onUpdate();
  }

  function startEdit(label: Label) {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  }

  async function handleSave(labelId: string) {
    await labelService.update(
      workspaceId,
      labelId,
      { name: editName.trim(), color: editColor },
      token,
    );
    cancelEdit();
    onUpdate();
  }

  async function handleDelete(labelId: string) {
    await labelService.delete(workspaceId, labelId, token);
    onUpdate();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <LabelForm
          name={newName}
          color={newColor}
          onNameChange={setNewName}
          onColorChange={setNewColor}
          onSubmit={handleCreate}
          submitLabel="Criar"
        />
      )}

      {labels.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma label criada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {labels.map((label) => (
            <li key={label.id} className="flex items-center gap-2 rounded-md border p-2">
              {editingId === label.id ? (
                <LabelForm
                  name={editName}
                  color={editColor}
                  onNameChange={setEditName}
                  onColorChange={setEditColor}
                  onSubmit={() => handleSave(label.id)}
                  onCancel={cancelEdit}
                  submitLabel="Salvar"
                />
              ) : (
                <>
                  <LabelBadge name={label.name} color={label.color} />
                  {canManage && (
                    <div className="ml-auto flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(label)}
                        aria-label={`Editar label ${label.name}`}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(label.id)}
                        aria-label={`Excluir label ${label.name}`}
                        className="text-destructive hover:text-destructive"
                      >
                        Excluir
                      </Button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
