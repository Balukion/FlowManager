import { prisma } from "../../lib/prisma.js";

export class TasksRepository {
  async findLastNumber(projectId: string) {
    return prisma.task.findFirst({
      where: { project_id: projectId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
  }

  async findLastOrder(projectId: string) {
    return prisma.task.findFirst({
      where: { project_id: projectId, deleted_at: null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  }

  async create(data: {
    project_id: string;
    title: string;
    number: number;
    order: number;
    priority: string;
    description?: string | null;
    deadline?: Date | null;
    created_by: string;
  }) {
    return prisma.task.create({ data: data as any });
  }

  async findById(id: string) {
    return prisma.task.findFirst({
      where: { id, deleted_at: null },
      include: {
        task_labels: {
          include: { label: true },
        },
        assignee: { select: { id: true, name: true, avatar_url: true } },
      },
    });
  }

  async findByProject(
    projectId: string,
    filters: { status?: string; priority?: string; label_id?: string },
  ) {
    return prisma.task.findMany({
      where: {
        project_id: projectId,
        deleted_at: null,
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.priority ? { priority: filters.priority as any } : {}),
        ...(filters.label_id
          ? { task_labels: { some: { label_id: filters.label_id } } }
          : {}),
      },
      include: {
        task_labels: {
          include: { label: true },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string | null;
    priority?: string;
    deadline?: Date | null;
    status?: string;
    status_is_manual?: boolean;
    status_overridden_by?: string | null;
    status_overridden_at?: Date | null;
    order?: number;
    assignee_id?: string | null;
  }) {
    return prisma.task.update({ where: { id }, data: data as any });
  }

  async updateOrder(id: string, order: number) {
    return prisma.task.update({ where: { id }, data: { order } });
  }

  async softDelete(id: string) {
    return prisma.task.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  // Watchers

  async findWatcher(taskId: string, userId: string) {
    return prisma.taskWatcher.findUnique({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
    });
  }

  async findWatchers(taskId: string) {
    return prisma.taskWatcher.findMany({
      where: { task_id: taskId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async createWatcher(taskId: string, userId: string) {
    return prisma.taskWatcher.create({ data: { task_id: taskId, user_id: userId } });
  }

  async deleteWatcher(taskId: string, userId: string) {
    return prisma.taskWatcher.delete({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
    });
  }

  // Used by steps to update task status automatically
  async findStepsByTask(taskId: string) {
    return prisma.step.findMany({
      where: { task_id: taskId, deleted_at: null },
      select: { status: true },
    });
  }

  async findStepsExceedingDeadline(taskId: string, deadline: Date) {
    return prisma.step.findMany({
      where: { task_id: taskId, deleted_at: null, deadline: { gt: deadline } },
      select: { id: true },
    });
  }
}
