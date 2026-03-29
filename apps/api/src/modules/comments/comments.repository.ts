import { prisma } from "../../lib/prisma.js";

export class CommentsRepository {
  async create(data: {
    task_id: string;
    user_id: string;
    content: string;
    parent_id?: string | null;
  }) {
    return prisma.comment.create({ data });
  }

  async findById(id: string) {
    return prisma.comment.findFirst({ where: { id, deleted_at: null } });
  }

  async findByTask(taskId: string, options: { limit: number; cursor?: string }) {
    return prisma.comment.findMany({
      where: { task_id: taskId, deleted_at: null },
      orderBy: { created_at: "asc" },
      take: options.limit + 1,
      include: {
        author: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });
  }

  async update(id: string, content: string) {
    return prisma.comment.update({ where: { id }, data: { content, edited_at: new Date() } });
  }

  async softDelete(id: string, deletedBy: string) {
    return prisma.comment.update({
      where: { id },
      data: { deleted_at: new Date(), deleted_by: deletedBy },
    });
  }

  async createMention(commentId: string, userId: string) {
    return prisma.commentMention.create({ data: { comment_id: commentId, user_id: userId } });
  }
}
