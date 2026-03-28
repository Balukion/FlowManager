export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  timezone: string;
  email_verified: boolean;
  email_verified_at: Date | null;
  email_verification_token: string | null;
  email_verification_expires_at: Date | null;
  password_reset_token: string | null;
  password_reset_expires_at: Date | null;
  password_changed_at: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  settings: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type PublicUser = Pick<User, "id" | "name" | "email" | "avatar_url" | "timezone" | "email_verified" | "created_at">;
