import { getSafeLimit, paginateResult } from "@flowmanager/shared";
import { NotFoundError } from "../../errors/index.js";
import type { NotificationsRepository } from "./notifications.repository.js";

export class NotificationsService {
  constructor(private repo: NotificationsRepository) {}

  async listNotifications(userId: string, query: { limit?: number; cursor?: string }) {
    const limit = getSafeLimit(query.limit);

    const rows = await this.repo.findByUser(userId, { limit, cursor: query.cursor });
    const { items: notifications, next_cursor } = paginateResult(rows, limit);

    const unread_count = await this.repo.countUnread(userId);

    return {
      data: { notifications },
      meta: { unread_count, next_cursor },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.repo.findById(notificationId);
    if (!notification || notification.user_id !== userId) {
      throw new NotFoundError("Notificação não encontrada");
    }

    await this.repo.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    await this.repo.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.repo.findById(notificationId);
    if (!notification || notification.user_id !== userId) {
      throw new NotFoundError("Notificação não encontrada");
    }

    await this.repo.delete(notificationId);
  }
}
