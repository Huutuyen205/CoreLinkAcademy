// Chạy trước `pnpm dev`: dừng sớm với hướng dẫn rõ ràng khi DB chưa có schema v3,
// thay vì để mọi trang lỗi "table ... does not exist".
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["prisma", "migrate", "status"], { encoding: "utf8", shell: true });
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

if (result.status === 0) process.exit(0);

console.error("\n[check-db] Database chưa sẵn sàng cho CoreLink Academy v3.\n");
if (/not managed by Prisma Migrate|have not yet been applied|P3005/i.test(output)) {
  console.error("Database 'corelink' còn schema cũ (v2) hoặc chưa áp migration v3.");
  console.error("Đã có backup tại backup/. Chạy lệnh sau (xóa bảng cũ, tạo bảng v3, nạp dữ liệu demo):\n");
  console.error("    pnpm db:reset\n");
} else if (/P1001|Can't reach database/i.test(output)) {
  console.error("Không kết nối được MySQL. Kiểm tra MySQL đang chạy và DATABASE_URL trong .env.\n");
} else if (/P1000|Authentication failed|denied/i.test(output)) {
  console.error("MySQL từ chối đăng nhập. Kiểm tra user/mật khẩu trong DATABASE_URL (.env).\n");
} else {
  console.error(output.trim());
}
console.error("Bỏ qua bước kiểm tra này: pnpm dev:raw\n");
process.exit(1);
