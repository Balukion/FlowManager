import type { NotificationType } from "../enums/notification.js";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  entity_type: string;
  entity_id: string;
  sent_at: Date | null;
  failed_at: Date | null;
  error_message: string | null;
  created_at: Date;
}
