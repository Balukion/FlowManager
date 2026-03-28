export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: Date;
  deleted_at: Date | null;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface TaskWatcher {
  task_id: string;
  user_id: string;
  created_at: Date;
}
