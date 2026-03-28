import { randomUUID } from "crypto";
import type { User } from "@flowmanager/types";

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: randomUUID(),
    name: "Test User",
    email: `user-${randomUUID()}@test.com`,
    password_hash: "$2b$10$hashedpassword",
    avatar_url: null,
    timezone: "UTC",
    email_verified: false,
    email_verified_at: null,
    email_verification_token: null,
    email_verification_expires_at: null,
    password_reset_token: null,
    password_reset_expires_at: null,
    password_changed_at: null,
    failed_login_attempts: 0,
    locked_until: null,
    settings: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}
