import { prisma } from "../../lib/prisma.js";

export class LabelsRepository {
  async findByNameInWorkspace(workspaceId: string, name: string) {
    return prisma.label.findFirst({
      where: { workspace_id: workspaceId, name, deleted_at: null },
    });
  }

  async create(data: { workspace_id: string; name: string; color: string; created_by: string }) {
    return prisma.label.create({ data });
  }

  async findById(id: string) {
    return prisma.label.findFirst({ where: { id, deleted_at: null } });
  }

  async findByWorkspace(workspaceId: string) {
    return prisma.label.findMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      orderBy: { created_at: "asc" },
    });
  }

  async update(id: string, data: { name?: string; color?: string }) {
    return prisma.label.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.label.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async findTaskLabel(taskId: string, labelId: string) {
    return prisma.taskLabel.findFirst({ where: { task_id: taskId, label_id: labelId } });
  }

  async createTaskLabel(taskId: string, labelId: string) {
    return prisma.taskLabel.create({ data: { task_id: taskId, label_id: labelId } });
  }

  async deleteTaskLabel(taskId: string, labelId: string) {
    return prisma.taskLabel.delete({
      where: { task_id_label_id: { task_id: taskId, label_id: labelId } },
    });
  }
}
