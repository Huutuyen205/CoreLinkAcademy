# 14 — Triển khai và vận hành

## 1. Môi trường

| Môi trường | Trạng thái |
|---|---|
| Dev (máy Windows, MySQL local) | Đang dùng |
| Staging / Production | TBD — QUESTION-Q04 (hosting chưa chọn) |

## 2. Biến môi trường (chỉ tên, không ghi giá trị)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | Có | `mysql://USER:PASSWORD@localhost:3306/corelink` |
| `APP_URL` | Có | URL gốc, dùng cho metadata (dev: `http://localhost:3000`) |
| `SEED_DEMO_PASSWORD` | Chỉ khi seed | Mật khẩu chung cho tài khoản demo; không đặt thì seed tự sinh và in ra một lần |

## 3. Lệnh (PowerShell, tại thư mục gốc)

```powershell
pnpm install
# Chỉ một lần khi chuyển từ v2 (DB còn bảng cũ; đã backup ở backup\):
pnpm exec prisma migrate reset --force   # xóa toàn bộ bảng, áp migration init, chạy seed
pnpm db:migrate        # prisma migrate dev — tạo/cập nhật bảng
pnpm db:seed           # dữ liệu demo giả
pnpm dev               # http://localhost:3000
pnpm typecheck; pnpm lint; pnpm test; pnpm build
```

## 4. Tài khoản demo (sau seed)

Seed tạo dữ liệu **giả**: 1 Admin, 1 Staff, 3 giáo viên, 6 học sinh, 4 phụ huynh; 3 lớp đang học (TOAN9-K1, VAN9-K1, ANH-THCS-K1) bắt đầu 14 ngày trước ngày chạy seed, kèm buổi đã điểm danh, một cảnh báo vắng 2 buổi liên tiếp (Học sinh Hai, lớp Toán), một bài tập đang giao có đủ 3 dạng câu và 2 lead (1 lead quá 24 giờ). Mật khẩu = `SEED_DEMO_PASSWORD` hoặc mật khẩu in ra khi seed. Không dùng các tài khoản này ở production.

| Vai trò | Đăng nhập |
|---|---|
| Admin | `admin@demo.corelink.vn` |
| Staff | `giaovu@demo.corelink.vn` |
| Giáo viên | `gv.toan@demo.corelink.vn`, `gv.van@…`, `gv.anh@…` |
| Học sinh | `hs1@demo.corelink.vn` … `hs6@…` |
| Phụ huynh | `ph1@demo.corelink.vn` (2 con: HS1, HS3) … `ph4@…` |

## 5. Sao lưu và khôi phục

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u <user> -p --single-transaction corelink > backup\corelink-YYYYMMDD.sql
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u <user> -p corelink < backup\corelink-YYYYMMDD.sql
```

## 6. Thứ tự release (khi có production)
1. Backup DB. 2. `pnpm build`. 3. `prisma migrate deploy`. 4. Khởi động lại app. 5. Smoke test: trang chủ, đăng nhập 5 vai trò. 6. Rollback: deploy lại bản build trước; migration chỉ thêm (không xóa cột) để bản cũ vẫn chạy.

## 7. Giám sát
Pha 1: log lỗi của Next.js ra stdout. Pha 2: thêm theo dõi lỗi (TBD).
