"use client";

import { useEffect, useRef, useState } from "react";
import { labelService } from "@web/services/label.service";
import { useApiClient } from "@web/hooks/use-api-client";
import { LabelBadge } from "./label-badge";
import { Button } from "@web/components/ui/button";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TaskLabelsProps {
  workspaceId: string;
  projectId: string;
  taskId: string;
  workspaceLabels: Label[];
  taskLabels: Label[];
  canManage?: boolean;
  onUpdate: () => void;
}

export function TaskLabels({
  workspaceId,
  projectId,
  taskId,
  workspaceLabels,
  taskLabels,
  canManage = false,
  onUpdate,
}: TaskLabelsProps) {
  const client = useApiClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const appliedIds = new Set(taskLabels.map((l) => l.id));
  const available = workspaceLabels.filter((l) => !appliedIds.has(l.id));

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  async function handleApply(labelId: string) {
    await labelService(client).applyToTask(workspaceId, projectId, taskId, labelId);
    setOpen(false);
    onUpdate();
  }

  async function handleRemove(labelId: string) {
    await labelService(client).removeFromTask(workspaceId, projectId, taskId, labelId);
    onUpdate();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {taskLabels.length === 0 ? (
          <span className="text-xs text-muted-foreground">Nenhuma label aplicada</span>
        ) : (
          taskLabels.map((label) => (
            <LabelBadge
              key={label.id}
              name={label.name}
              color={label.color}
              onRemove={canManage ? () => handleRemove(label.id) : undefined}
            />
          ))
        )}
      </div>

      {canManage && (
      <div ref={dropdownRef} className="relative inline-block">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Adicionar label"
        >
          + Adicionar label
        </Button>

        {open && (
          <div className="absolute left-0 top-full z-10 mt-1 min-w-40 rounded-md border bg-popover p-1 shadow-md">
            {available.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                Todas as labels já foram aplicadas
              </p>
            ) : (
              available.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => handleApply(label.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
