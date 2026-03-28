import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
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
