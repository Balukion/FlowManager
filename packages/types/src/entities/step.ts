import type { StepStatus } from "../enums/status.js";

export interface Step {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  status: StepStatus;
  order: number;
  deadline: Date | null;
  due_reminder_sent_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface StepAssignment {
  id: string;
  step_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: Date;
  unassigned_by: string | null;
  unassigned_at: Date | null;
}
