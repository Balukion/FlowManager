import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.spec.tsx", "src/**/*.spec.ts", "tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@web": resolve(__dirname, "./src"),
      "@types": resolve(__dirname, "../../packages/types/src"),
      "@shared": resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
