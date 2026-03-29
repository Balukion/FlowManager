import { prisma } from "../../lib/prisma.js";

interface UpdateUserData {
  name?: string;
  timezone?: string;
  password_hash?: string;
  avatar_url?: string | null;
}

export class UsersRepository {
  async findById(id: string) {
    return prisma.user.findFirst({ where: { id, deleted_at: null } });
  }

  async update(id: string, data: UpdateUserData) {
    return prisma.user.update({ where: { id }, data });
  }
}
