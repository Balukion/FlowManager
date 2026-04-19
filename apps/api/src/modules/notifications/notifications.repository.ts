import { type NotificationType } from "@prisma/client";
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

  async create(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    entity_type?: string;
    entity_id?: string;
  }) {
    return prisma.notification.create({ data });
  }

  async markAsSent(id: string) {
    return prisma.notification.update({ where: { id }, data: { sent_at: new Date() } });
  }

  async delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }

  async findPendingRetry(maxAttempts: number) {
    return prisma.notification.findMany({
      where: {
        sent_at: null,
        attempt_count: { lt: maxAttempts },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  async incrementAttempt(id: string, errorMessage: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        attempt_count: { increment: 1 },
        failed_at: new Date(),
        error_message: errorMessage,
      },
    });
  }

  async deleteOldNotifications(cutoff: Date): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { created_at: { lt: cutoff } },
    });
    return result.count;
  }
}
