import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./apps/web/src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "integrations/**"],
    reporters: ["default", "junit"],
    outputFile: {
      junit: "reports/junit/vitest.xml",
    },
    testTimeout: 30_000,
  },
});
