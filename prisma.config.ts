// Cấu hình Prisma CLI (thay cho khóa "prisma" trong package.json, đã bị deprecate).
// Khi có file này Prisma không tự đọc .env, nên nạp thủ công (Node ≥ 20.12).
import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile(".env");
} catch {
  // Không có .env: dùng biến môi trường sẵn có (CI, production).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { seed: "tsx prisma/seed.ts" },
});
