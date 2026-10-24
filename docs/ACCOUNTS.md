# Tài khoản demo — CoreLink Academy v3

Tài khoản **giả** do `prisma/seed.ts` tạo, chỉ dùng cho môi trường dev. Không dùng ở production, không ghi mật khẩu vào tài liệu.

- Cổng đăng nhập: `http://localhost:3000/dang-nhap` (email hoặc số điện thoại + mật khẩu).
- Mật khẩu: giá trị `SEED_DEMO_PASSWORD` trong `.env`; nếu để trống, seed tự sinh và in ra **một lần** khi chạy.
- Tài khoản do Admin tạo sau này dùng mật khẩu tạm và phải đổi ở lần đăng nhập đầu.

| Vai trò | Họ tên | Email | SĐT | Trang chính |
|---|---|---|---|---|
| Admin | Quản trị Demo | `admin@demo.corelink.vn` | 0900 000 001 | `/quan-ly` |
| ~~Staff (giáo vụ)~~ | Giáo vụ Demo | `giaovu@demo.corelink.vn` | 0900 000 002 | **Đã khóa** — vai trò giáo vụ bỏ (DECISION-D35); seed không tạo nữa |
| Giáo viên | Giáo viên Toán Demo | `gv.toan@demo.corelink.vn` | 0900 000 011 | `/giao-vien` — lớp TOAN9-K1 |
| Giáo viên | Giáo viên Văn Demo | `gv.van@demo.corelink.vn` | 0900 000 012 | `/giao-vien` — lớp VAN9-K1 |
| Giáo viên | Giáo viên Anh Demo | `gv.anh@demo.corelink.vn` | 0900 000 013 | `/giao-vien` — lớp ANH-THCS-K1 |
| Học sinh | Học sinh Một (HS260001) | `hs1@demo.corelink.vn` | 0900 000 101 | `/hoc-sinh` — Toán, Văn |
| Học sinh | Học sinh Hai (HS260002) | `hs2@demo.corelink.vn` | 0900 000 102 | `/hoc-sinh` — Toán, Văn (có cảnh báo vắng) |
| Học sinh | Học sinh Ba … Sáu | `hs3@` … `hs6@demo.corelink.vn` | 0900 000 103–106 | `/hoc-sinh` |
| Phụ huynh | Phụ huynh Một | `ph1@demo.corelink.vn` | 0900 000 201 | `/phu-huynh` — con: HS1, HS3 |
| Phụ huynh | Phụ huynh Hai | `ph2@demo.corelink.vn` | 0900 000 202 | `/phu-huynh` — con: HS2 |
| Phụ huynh | Phụ huynh Ba, Bốn | `ph3@`, `ph4@demo.corelink.vn` | 0900 000 203–204 | `/phu-huynh` |

Kiểm tra truy cập chéo nên ra 404: `gv.van` mở lớp TOAN9-K1 qua URL; `ph2` mở `/phu-huynh?con=<id HS1>`; `hs3` mở bài tập của lớp Toán.

Danh sách tài khoản của bản v1/v2 không còn hiệu lực trên nhánh `rebuild/v3`; dữ liệu cũ nằm trong `backup/corelink-v2-20261021.sql`.
