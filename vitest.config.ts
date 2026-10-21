import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit test: logic thuần, không cần DB. Integration test (*.int.test.ts) chạy riêng bằng vitest.integration.config.ts.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], exclude: ["src/**/*.int.test.ts", "node_modules/**"], environment: "node" },
});
