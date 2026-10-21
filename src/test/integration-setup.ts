// Chạy trước mọi integration test: trỏ Prisma vào DB test, chặn nhầm sang DB thật.
try {
  process.loadEnvFile(".env");
} catch {
  // Không có .env: dùng biến môi trường sẵn có (CI).
}

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl) {
  if (testUrl === process.env.DATABASE_URL || testUrl === process.env.DIRECT_URL) {
    throw new Error("TEST_DATABASE_URL phải trỏ DB RIÊNG (không phải DATABASE_URL/DIRECT_URL) — integration test ghi và xóa dữ liệu.");
  }
  process.env.DATABASE_URL = testUrl;
  process.env.DIRECT_URL = testUrl;
}

export const hasTestDb = Boolean(testUrl);
