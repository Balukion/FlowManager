"use client";

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
import { TaskCard } from "./task-card";
import type { Task } from "@flowmanager/types";

interface TaskLabel {
  label: { id: string; name: string; color: string };
}

type TaskWithLabels = Task & { task_labels?: TaskLabel[] };

interface SortableTaskItemProps {
  task: TaskWithLabels;
  onTaskClick: (task: Task) => void;
  canDrag: boolean;
  position: number;
}

function SortableTaskItem({ task, onTaskClick, canDrag, position }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      {canDrag && (
        <button
          {...attributes}
          {...listeners}
          aria-label="Arrastar tarefa"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <TaskCard task={task} onClick={onTaskClick} position={position} />
      </div>
    </div>
  );
}

interface SortableTaskListProps {
  tasks: TaskWithLabels[];
  onTaskClick: (task: Task) => void;
  canReorder?: boolean;
  onReorder?: (newOrder: string[]) => void;
}

export function SortableTaskList({
  tasks,
  onTaskClick,
  canReorder = false,
  onReorder,
}: SortableTaskListProps) {
  const canDrag = canReorder && !!onReorder;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    const newOrder = arrayMove(tasks, oldIndex, newIndex).map((t) => t.id);
    onReorder?.(newOrder);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              canDrag={canDrag}
              position={index + 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
