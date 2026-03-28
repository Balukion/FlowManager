import type { Role } from "../enums/role.js";
import type { InvitationStatus } from "../enums/status.js";

export interface Invitation {
  id: string;
  workspace_id: string;
  invited_by: string;
  email: string;
  role: Role;
  token_hash: string;
  status: InvitationStatus;
  expires_at: Date;
  viewed_at: Date | null;
  accepted_at: Date | null;
  declined_at: Date | null;
  created_at: Date;
}
