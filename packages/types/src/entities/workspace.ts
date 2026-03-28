import type { Role } from "../enums/role.js";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  logo_url: string | null;
  owner_id: string;
  settings: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: Role;
  position: number | null;
  last_seen_at: Date | null;
  joined_at: Date;
}
