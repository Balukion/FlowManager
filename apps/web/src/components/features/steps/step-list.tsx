"use client";

import { useState } from "react";
import { ConfirmDialog } from "@web/components/ui/confirm-dialog";

interface Assignee {
  user_id: string;
  user: { id: string; name: string; avatar_url: string | null };
}

interface StepWithAssignments {
  id: string;
  task_id: string;
  title: string;
  status: string;
  order: number;
  assignments?: Assignee[];
  [key: string]: unknown;
}

interface Member {
  user_id: string;
  user: { id: string; name: string; email: string; avatar_url: string | null };
}

interface StepListProps {
  steps: StepWithAssignments[];
  members: Member[];
  canManageAssignments?: boolean;
  onStatusChange: (stepId: string, status: "DONE" | "PENDING") => void;
  onAssign: (stepId: string, userId: string) => void;
  onUnassign: (stepId: string, userId: string) => void;
  onDelete: (stepId: string) => void;
}

export function StepList({ steps, members, canManageAssignments = false, onStatusChange, onAssign, onUnassign, onDelete }: StepListProps) {
  const [openPickerFor, setOpenPickerFor] = useState<string | null>(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState<string | null>(null);

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum passo cadastrado</p>;
  }

  return (
    <ul className="space-y-2">
      {steps.map((step) => {
        const isDone = step.status === "DONE";
        const assignments = step.assignments ?? [];
        const assignedUserIds = new Set(assignments.map((a) => a.user_id));
        const availableMembers = members.filter((m) => !assignedUserIds.has(m.user_id));
        const isPickerOpen = openPickerFor === step.id;

        return (
          <li key={step.id} className="rounded-md border bg-card px-3 py-2 space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => onStatusChange(step.id, isDone ? "PENDING" : "DONE")}
                className="h-4 w-4 cursor-pointer"
              />
              <span className={`text-sm flex-1 ${isDone ? "text-muted-foreground line-through" : ""}`}>
                {step.title}
              </span>
              {canManageAssignments && (
                <button
                  aria-label="Deletar passo"
                  onClick={() => setConfirmDeleteFor(step.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              )}
            </div>
            {confirmDeleteFor === step.id && (
              <ConfirmDialog
                message="Tem certeza que deseja deletar este passo?"
                onConfirm={() => { onDelete(step.id); setConfirmDeleteFor(null); }}
                onCancel={() => setConfirmDeleteFor(null)}
              />
            )}

            {/* Assignees */}
            <div className="flex flex-wrap items-center gap-2 pl-7">
              {assignments.map((a) => (
                <span
                  key={a.user_id}
                  className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {a.user.name}
                  {canManageAssignments && (
                    <button
                      aria-label={`Remover ${a.user.name}`}
                      onClick={() => onUnassign(step.id, a.user_id)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}

              {/* Assign button / picker */}
              {canManageAssignments && availableMembers.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setOpenPickerFor(isPickerOpen ? null : step.id)}
                    className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    + Atribuir
                  </button>
                  {isPickerOpen && (
                    <ul className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-md border bg-popover shadow-md">
                      {availableMembers.map((m) => (
                        <li key={m.user_id}>
                          <button
                            onClick={() => {
                              onAssign(step.id, m.user_id);
                              setOpenPickerFor(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                          >
                            {m.user.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
