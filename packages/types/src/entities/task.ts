import type { TaskStatus, Priority } from "../enums/index.js";

export interface Task {
  id: string;
  project_id: string;
  assignee_id: string | null;
  title: string;
  number: number;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  order: number;
  deadline: Date | null;
  due_reminder_sent_at: Date | null;
  status_is_manual: boolean;
  status_overridden_by: string | null;
  status_overridden_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
