import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generatePresignedUploadUrl, getPublicUrl } from "../../lib/s3.js";
import { env } from "../../config/env.js";
import { stripPassword } from "../../lib/user.js";
import { BadRequestError, UnauthorizedError } from "../../errors/index.js";
import type { UsersRepository } from "./users.repository.js";

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export class UsersService {
  constructor(private repo: UsersRepository) {}

  async getMe(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new UnauthorizedError("Usuário não encontrado");
    return { user: stripPassword(user) };
  }

  async updateMe(userId: string, data: { name?: string; timezone?: string }) {
    if (data.timezone !== undefined && !isValidTimezone(data.timezone)) {
      throw new BadRequestError("Timezone inválido", "INVALID_TIMEZONE");
    }
    const user = await this.repo.update(userId, data);
    return { user: stripPassword(user) };
  }

  async changePassword(
    userId: string,
    data: { current_password: string; new_password: string },
  ) {
    const user = await this.repo.findById(userId);
    if (!user) throw new UnauthorizedError("Usuário não encontrado");

    const valid = await bcrypt.compare(data.current_password, user.password_hash);
    if (!valid) throw new UnauthorizedError("Senha atual incorreta");

    if (data.current_password === data.new_password) {
      throw new BadRequestError("A nova senha deve ser diferente da atual", "SAME_PASSWORD");
    }

    const password_hash = await bcrypt.hash(data.new_password, 10);
    await this.repo.update(userId, { password_hash });
  }

  async presignAvatar(userId: string, data: { content_type: string; file_size_bytes: number }) {
    if (!ALLOWED_AVATAR_TYPES.includes(data.content_type)) {
      throw new BadRequestError("Tipo de arquivo não permitido", "INVALID_FILE_TYPE");
    }

    const maxBytes = env.S3_MAX_AVATAR_SIZE_MB * 1024 * 1024;
    if (data.file_size_bytes > maxBytes) {
      throw new BadRequestError(
        `Arquivo excede o tamanho máximo de ${env.S3_MAX_AVATAR_SIZE_MB}MB`,
        "FILE_TOO_LARGE",
      );
    }

    const ext = EXT_MAP[data.content_type];
    const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

    const upload_url = await generatePresignedUploadUrl(key, data.content_type);
    const final_url = getPublicUrl(key);

    return { upload_url, final_url };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.repo.update(userId, { avatar_url: avatarUrl });
    return { user: stripPassword(user) };
  }

  async deleteAvatar(userId: string) {
    const user = await this.repo.update(userId, { avatar_url: null });
    return { user: stripPassword(user) };
  }
}
