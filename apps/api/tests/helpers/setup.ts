import { beforeAll, afterAll, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env["DATABASE_TEST_URL"] },
  },
});

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  // Clean up in reverse dependency order
  const tables = [
    "activity_logs",
    "notifications",
    "comment_mentions",
    "comments",
    "step_assignments",
    "steps",
    "task_labels",
    "task_watchers",
    "tasks",
    "labels",
    "projects",
    "invitations",
    "workspace_members",
    "workspaces",
    "revoked_tokens",
    "refresh_tokens",
    "user_oauth_accounts",
    "users",
  ] as const;

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
