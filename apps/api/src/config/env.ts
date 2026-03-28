import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(3001),
  API_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),
  DATABASE_TEST_URL: z.string().min(1).optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  TOKEN_SECRET: z.string().min(32),

  INVITATION_TOKEN_EXPIRES_HOURS: z.coerce.number().default(72),
  EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS: z.coerce.number().default(24),
  PASSWORD_RESET_TOKEN_EXPIRES_HOURS: z.coerce.number().default(1),

  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  ACCOUNT_LOCK_DURATION_MINUTES: z.coerce.number().default(30),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default("sa-east-1"),
  AWS_S3_BUCKET_NAME: z.string().min(1),
  S3_MAX_AVATAR_SIZE_MB: z.coerce.number().default(2),
  S3_MAX_LOGO_SIZE_MB: z.coerce.number().default(5),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_FROM_NAME: z.string().default("FlowManager"),

  SENTRY_DSN: z.string().url().optional(),

  DEFAULT_PAGE_SIZE: z.coerce.number().default(20),
  MAX_PAGE_SIZE: z.coerce.number().default(100),

  CRON_CLEANUP: z.string().default("0 2 * * *"),
  CRON_DEADLINE_REMINDERS: z.string().default("0 8 * * *"),
  CRON_RETRY_NOTIFICATIONS: z.string().default("0 * * * *"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
