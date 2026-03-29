import { NotFoundError } from "../../errors/index.js";
import type { NotificationsRepository } from "./notifications.repository.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class NotificationsService {
  constructor(private repo: NotificationsRepository) {}

  async listNotifications(userId: string, query: { limit?: number; cursor?: string }) {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const items = await this.repo.findByUser(userId, { limit, cursor: query.cursor });
    const hasMore = items.length > limit;
    const notifications = hasMore ? items.slice(0, limit) : items;

    const unread_count = await this.repo.countUnread(userId);
    const next_cursor = hasMore ? notifications[notifications.length - 1].id : undefined;

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
