import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration test trên MySQL thật (docs/13 §2–3). Cần TEST_DATABASE_URL trỏ DB RIÊNG đã `prisma migrate deploy`.
// Không có biến → các test tự skip.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.int.test.ts"],
    environment: "node",
    setupFiles: ["src/test/integration-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
