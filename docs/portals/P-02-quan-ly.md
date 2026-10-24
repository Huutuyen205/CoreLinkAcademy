# P-02 — Cổng quản lý (Quản trị viên / Admin)

| Mục | Giá trị |
|---|---|
| Phiên bản | 2.0 (2026-10-24) — bỏ vai trò giáo vụ theo DECISION-D35, toàn bộ cổng quản lý do Admin sử dụng · Owner: BA + Designer (trợ lý) · Approver: chủ dự án |
| Người dùng | Quản trị viên (`ADMIN`) — chủ yếu máy tính |
| Mục tiêu | Không bỏ sót lead (GOAL-002); trực tiếp vận hành lớp, ghi danh, điểm danh, duyệt đơn/đề xuất; quản trị dữ liệu nền |
| FR | FR-006..009, 012..021, 024, 026, 034, 035 · UC-002, 003, 005, 006, 007, 012, 014, 015, 018, 019, 020 |

> **DECISION-D35 (2026-10-24):** Đã bỏ vai trò giáo vụ (`STAFF`). Toàn bộ tính năng tuyển sinh, đào tạo, duyệt đơn, báo cáo trước đây nay do Admin trực tiếp đảm nhận.

## 1. Điều hướng
Sidebar (≥ 1024px) / ngăn kéo "Menu" (< 1024px) cho Quản trị viên:
- **Tổng quan & tuyển sinh:** Tổng quan · Lead · Lớp học · Lịch tổng · Đề xuất & đơn nghỉ · Chuyên cần · Đánh giá của GV · Báo cáo
- **Con người:** Học viên · Giáo viên · Phụ huynh
- **Tài liệu & tương tác:** Giáo trình, tài liệu, giáo án · Đề luyện tập · Thông báo · Tin nhắn
- **Quản trị hệ thống:** Người dùng · Khóa học · Môn & cấp học · Phòng học · Nhật ký

Cuối menu: họ tên, vai trò, "Đổi mật khẩu", "Đăng xuất".

## 2. Đăng nhập và đổi mật khẩu (chung mọi vai trò)
- `/dang-nhap`: email hoặc SĐT + mật khẩu. Sai → "Thông tin đăng nhập không đúng." (giữ ô email/SĐT); 5 lần → khóa 15 phút; > 20 lần/10'/IP → chặn tạm.
- Tài khoản mới (mật khẩu tạm) → `/doi-mat-khau` bắt buộc trước mọi trang khác.

## 3. Màn hình

### SCREEN-008 Tổng quan `/quan-ly`
| Khối | Dữ liệu | Hành động |
|---|---|---|
| 4 ô số liệu | Lead mới · Lead quá 24 giờ chưa xử lý (cảnh báo khi > 0) · Lớp đang tuyển · Lớp đang học | Liên kết danh sách đã lọc |
| Cảnh báo vắng 2 buổi liên tiếp | Tên HS · "Lớp X" | Liên kết lớp |

### SCREEN-009 Lead `/quan-ly/lead`
- Nút **"Nhập lead"** → SCREEN-011.
- Lọc: tìm tên/SĐT, trạng thái, môn; "Chỉ xem lead mới quá 24 giờ chưa xử lý" ↔ "Xem tất cả lead".
- Bảng: Phụ huynh + "HS: tên, lớp n" · SĐT · Quan tâm · Trạng thái (+ "Quá hạn") · Ngày tạo. 20/trang.

### SCREEN-011 Nhập lead `/quan-ly/lead/moi` *(bổ sung P3)*
Nguồn* (Gọi điện / Đến trực tiếp / Được giới thiệu / Khác) · Họ tên PH* · SĐT* · Email · Họ tên HS* · Khối · Môn · Khóa · Ghi chú → "Tạo lead". Trùng lead mở → "SĐT này đang có lead chưa xử lý xong." + "Mở lead hiện có".

### SCREEN-010 Chi tiết lead `/quan-ly/lead/[id]`
| Cột trái | Cột phải |
|---|---|
| Thông tin (SĐT bấm gọi, email, môn, khóa, nguồn, ngày tạo, lý do không theo học, học viên) + ghi chú gốc | Đổi trạng thái (chỉ trạng thái hợp lệ + lý do khi "Không theo học") |
| Lịch sử hoạt động (loại · thời điểm · người · nội dung) | Thêm ghi chú (≤ 2000) |
| | Chuyển thành học viên → thẻ "Mật khẩu tạm — chỉ hiển thị một lần" |

### SCREEN-012 Lớp học `/quan-ly/lop`
"Mở lớp mới"; chip lọc trạng thái; bảng Lớp · Lịch · GV · Khai giảng · Sĩ số `n/cap` · Trạng thái.

### SCREEN-013 Mở lớp `/quan-ly/lop/moi`
Form 2 cột (UC-005). Trùng lịch → Alert + danh sách xung đột. Thiếu khóa/GV → cảnh báo thay form.

### SCREEN-014 Chi tiết lớp `/quan-ly/lop/[id]`
| Khối | Nội dung | Hành động |
|---|---|---|
| Thông tin | Lịch, khai giảng, sĩ số | — |
| Học sinh (n) | Họ tên (mã), trạng thái | "Chuyển sang" → "Lưu" |
| Buổi học (n) | Buổi i, ngày, giờ, GV, phòng, số đã điểm danh, lý do hủy | "Điểm danh"; "Hủy hoặc dời buổi" (buổi tương lai) |
| Ghi danh (lớp OPEN/IN_PROGRESS) | Tìm tên/mã; checkbox HS; "còn n chỗ" | "Ghi danh" |
| Trạng thái lớp | Chuyển sang (xác nhận) | "Cập nhật" |
| Xóa lớp (chưa ghi danh) | — | "Xóa lớp" (xác nhận) |

### SCREEN-015 Điểm danh quản lý `/quan-ly/buoi/[id]`
Như [P-03 SCREEN-028](P-03-giao-vien.md) nhưng luôn sửa được (trừ buổi hủy); ngoài khung GV → ô "Lý do sửa ngoài khung thời gian" bắt buộc, ghi nhật ký.

### SCREEN-016 Học viên `/quan-ly/hoc-vien`
- "Tạo tài khoản học sinh hoặc phụ huynh" → thẻ mật khẩu tạm.
- Mỗi HS: tên (Admin: liên kết), mã, khối, "Đang học: …", cảnh báo "chưa có email/SĐT để đăng nhập"; "Phụ huynh (n/4)" + "Bỏ"; "Thêm phụ huynh" → "Liên kết". 25/trang.

### SCREEN-017/018 Người dùng (Admin)
Danh sách lọc vai trò/trạng thái/tìm; tạo mọi vai trò. Chi tiết: form thông tin (vai trò khóa với chính mình), PH/con liên kết, "Đặt lại mật khẩu", "Khóa tài khoản"/"Mở khóa".

### SCREEN-019..022 Danh mục (Admin)
- **Khóa học:** bảng + "Thêm khóa học"; trang sửa; "Xem trang công khai"; xóa khi chưa có lớp.
- **Môn học:** thẻ "Tên · n khóa" + form sửa; **"Xóa môn"** khi n = 0; "Thêm môn".
- **Phòng học:** thẻ tên/sức chứa; "Xóa phòng" hoặc giải thích; "Thêm phòng".

### SCREEN-023 Nhật ký (Admin)
Lọc loại; bảng thời điểm, người, thao tác, đối tượng, chi tiết JSON. Không sửa/xóa.

## 4. Hành trình chính
- **Lead → học viên:** 008 (ô quá hạn) → 009 → 010 → chuyển + chọn lớp → gửi mật khẩu tạm.
- **Khách gọi điện:** 009 → "Nhập lead" → 010.
- **Khai giảng:** 012 → 013 → 014 → ghi danh → "Đang học".
- **GV ốm:** 014 → "Dời buổi"/"Hủy buổi" + lý do.
- **GV quên điểm danh:** 014 → 015 + lý do.
- **Kết thúc khóa:** 014 → "Đã kết thúc".

## 5. Quyền
docs/03 §4: `lead.manage`, `class.manage`, `enrollment.manage`, `attendance.override`, `guardian.manage`, `user.createLearner` (Staff + Admin); `user.manage`, `catalog.manage`, `room.manage`, `audit.read` (Admin).

## 6. Tình huống biên
| Tình huống | Hành vi |
|---|---|
| Hai Staff cùng đổi trạng thái lead | Người sau: "Lead vừa được người khác cập nhật…" |
| Hai Staff ghi danh chỗ cuối | Người sau: "Lớp đã đủ sĩ số." |
| Ghi danh 5 HS, HS thứ 3 trùng lịch | "Đã ghi danh 2 học sinh. Dừng lại: …" |
| SĐT PH là SĐT của GV | Lỗi ô SĐT, không tạo gì |
| Tải lại sau khi chuyển lead | Mật khẩu tạm mất (cố ý) → Admin đặt lại |

## 7. Kiểm thử
TC-005..008, 013..020, 036..041, 044, 047, 048; TC-UAT-03, 04, 06, 08, 12, 13, 14.
