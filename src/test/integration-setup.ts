// Chạy trước mọi integration test: trỏ Prisma vào DB test, chặn nhầm sang DB dev `corelink`.
try {
  process.loadEnvFile(".env");
} catch {
  // Không có .env: dùng biến môi trường sẵn có (CI).
}

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl) {
  const dbName = new URL(testUrl).pathname.replace(/^\//, "");
  if (testUrl === process.env.DATABASE_URL || dbName === "corelink") {
    throw new Error("TEST_DATABASE_URL phải trỏ DB riêng (không phải DATABASE_URL / corelink) — integration test ghi và xóa dữ liệu.");
  }
  process.env.DATABASE_URL = testUrl;
}

export const hasTestDb = Boolean(testUrl);
