import type { ActivityAction } from "../enums/activity.js";

export interface ActivityLog {
  id: string;
  workspace_id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}
