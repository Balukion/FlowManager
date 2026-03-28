import type { ProjectStatus } from "../enums/status.js";

export interface Project {
  id: string;
  workspace_id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus;
  deadline: Date | null;
  created_by: string;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
