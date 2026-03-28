import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { readFileSync } from "fs";
import { parse } from "dotenv";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Carrega o .env para injetar via test.env — único método confiável no Vitest 3
let envVars: Record<string, string> = {};
try {
  envVars = parse(readFileSync(resolve(__dirname, ".env"), "utf-8"));
} catch {}

// Em teste, aponta DATABASE_URL para o banco de testes
const testEnv = {
  ...envVars,
  NODE_ENV: "test",
  DISABLE_RATE_LIMIT: "true",
  ...(envVars.DATABASE_TEST_URL ? { DATABASE_URL: envVars.DATABASE_TEST_URL } : {}),
};

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    pool: "forks",
    fileParallelism: false,
    env: testEnv,
    setupFiles: ["./tests/helpers/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "dist/**",
        "tests/**",
        "prisma/**",
        "**/*.spec.ts",
        "**/*.test.ts",
        "src/server.ts",
      ],
    },
    include: ["src/**/*.spec.ts", "tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@api": resolve(__dirname, "./src"),
      "@types": resolve(__dirname, "../../packages/types/src"),
      "@shared": resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
