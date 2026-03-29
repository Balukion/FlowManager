import { prisma } from "../../lib/prisma.js";

export class NotificationsRepository {
  async findByUser(userId: string, options: { limit: number; cursor?: string }) {
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: [{ created_at: "desc" }],
      take: options.limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });
  }

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { user_id: userId, read_at: null },
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { read_at: new Date() } });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }
}
