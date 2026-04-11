"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
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
  onReorder?: (newOrder: string[]) => void;
}

interface SortableStepItemProps {
  step: StepWithAssignments;
  canDrag: boolean;
  canManageAssignments: boolean;
  members: Member[];
  openPickerFor: string | null;
  confirmDeleteFor: string | null;
  position: number;
  onStatusChange: (stepId: string, status: "DONE" | "PENDING") => void;
  onAssign: (stepId: string, userId: string) => void;
  onUnassign: (stepId: string, userId: string) => void;
  onDelete: (stepId: string) => void;
  onOpenPicker: (id: string | null) => void;
  onConfirmDelete: (id: string | null) => void;
}

function SortableStepItem({
  step,
  canDrag,
  canManageAssignments,
  members,
  openPickerFor,
  confirmDeleteFor,
  position,
  onStatusChange,
  onAssign,
  onUnassign,
  onDelete,
  onOpenPicker,
  onConfirmDelete,
}: SortableStepItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDone = step.status === "DONE";
  const assignments = step.assignments ?? [];
  const assignedUserIds = new Set(assignments.map((a) => a.user_id));
  const availableMembers = members.filter((m) => !assignedUserIds.has(m.user_id));
  const isPickerOpen = openPickerFor === step.id;

  return (
    <li ref={setNodeRef} style={style} className="rounded-md border bg-card px-3 py-2 space-y-2">
      <div className="flex items-center gap-3">
        {canDrag && (
          <button
            {...attributes}
            {...listeners}
            aria-label="Arrastar passo"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onStatusChange(step.id, isDone ? "PENDING" : "DONE")}
          className="h-4 w-4 cursor-pointer"
        />
        <span className="text-xs font-mono text-muted-foreground">#{position}</span>
        <span className={`text-sm flex-1 ${isDone ? "text-muted-foreground line-through" : ""}`}>
          {step.title}
        </span>
        {canManageAssignments && (
          <button
            aria-label="Deletar passo"
            onClick={() => onConfirmDelete(step.id)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        )}
      </div>

      {confirmDeleteFor === step.id && (
        <ConfirmDialog
          message="Tem certeza que deseja deletar este passo?"
          onConfirm={() => { onDelete(step.id); onConfirmDelete(null); }}
          onCancel={() => onConfirmDelete(null)}
        />
      )}

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

        {canManageAssignments && availableMembers.length > 0 && (
          <div className="relative">
            <button
              onClick={() => onOpenPicker(isPickerOpen ? null : step.id)}
              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              + Atribuir
            </button>
            {isPickerOpen && (
              <ul className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-md border bg-popover shadow-md">
                {availableMembers.map((m) => (
                  <li key={m.user_id}>
                    <button
                      onClick={() => { onAssign(step.id, m.user_id); onOpenPicker(null); }}
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
}

export function StepList({
  steps,
  members,
  canManageAssignments = false,
  onStatusChange,
  onAssign,
  onUnassign,
  onDelete,
  onReorder,
}: StepListProps) {
  const [openPickerFor, setOpenPickerFor] = useState<string | null>(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState<string | null>(null);

  const canDrag = canManageAssignments && !!onReorder;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(steps, oldIndex, newIndex).map((s) => s.id);
    onReorder?.(newOrder);
  }

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum passo cadastrado</p>;
  }

  const itemProps = {
    canDrag,
    canManageAssignments,
    members,
    openPickerFor,
    confirmDeleteFor,
    onStatusChange,
    onAssign,
    onUnassign,
    onDelete,
    onOpenPicker: setOpenPickerFor,
    onConfirmDelete: setConfirmDeleteFor,
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {steps.map((step, index) => (
            <SortableStepItem key={step.id} step={step} position={index + 1} {...itemProps} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
