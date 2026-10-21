// Chạy trước `pnpm dev`: dừng sớm với hướng dẫn rõ ràng khi DB (Supabase PostgreSQL) chưa sẵn sàng,
// thay vì để mọi trang lỗi "table ... does not exist".
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["prisma", "migrate", "status"], { encoding: "utf8", shell: true });
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

if (result.status === 0) process.exit(0);

console.error("\n[check-db] Database chưa sẵn sàng cho CoreLink Academy v3.\n");
if (/\[YOUR-PASSWORD\]|\[REGION\]|PROJECT_REF/.test(output) || /Environment variable not found: (DATABASE_URL|DIRECT_URL)/.test(output)) {
  console.error("DATABASE_URL / DIRECT_URL trong .env chưa được điền. Lấy ở Supabase Dashboard → Connect → ORMs → Prisma.\n");
} else if (/have not yet been applied|P3005|No migration found/i.test(output)) {
  console.error("Database chưa có bảng v3. Chạy lệnh sau (tạo bảng rồi nạp dữ liệu demo):\n");
  console.error("    pnpm db:migrate");
  console.error("    pnpm db:seed\n");
} else if (/P1001|Can't reach database/i.test(output)) {
  console.error("Không kết nối được database. Kiểm tra host/cổng trong DIRECT_URL và mạng (Supabase project có đang tạm dừng không).\n");
} else if (/P1000|Authentication failed|password/i.test(output)) {
  console.error("Database từ chối đăng nhập. Kiểm tra mật khẩu trong DATABASE_URL/DIRECT_URL (.env), nhớ mã hóa ký tự đặc biệt.\n");
} else {
  console.error(output.trim());
}
console.error("Bỏ qua bước kiểm tra này: pnpm dev:raw\n");
process.exit(1);
