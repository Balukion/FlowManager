import { randomUUID } from "crypto";
import type { Step } from "@flowmanager/types";

export function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: randomUUID(),
    task_id: randomUUID(),
    title: "Test Step",
    description: null,
    status: "PENDING",
    order: 1,
    deadline: null,
    due_reminder_sent_at: null,
    created_by: randomUUID(),
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}
