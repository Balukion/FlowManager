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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  SortableStepItem,
  type StepWithAssignments,
  type Member,
} from "./sortable-step-item";

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
