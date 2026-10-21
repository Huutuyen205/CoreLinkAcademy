# 05 — Phân rã chức năng

`Domain → Module → Feature`. Cột Pha: 1 = MVP, 2 = sau MVP.

| Domain | Module | Feature | Actor | FR | Pha |
|---|---|---|---|---|---|
| Công khai | Nội dung | Trang chủ | Khách | FR-001 | 1 |
| | | Danh mục khóa học + lọc | Khách | FR-002 | 1 |
| | | Chi tiết khóa học | Khách | FR-003 | 1 |
| Tuyển sinh | Form | Đăng ký học thử, chống spam | Khách | FR-004, FR-005 | 1 |
| | Lead | Danh sách, lọc, quá hạn | Staff | FR-006 | 1 |
| | | Trạng thái, ghi chú | Staff | FR-007, FR-008 | 1 |
| | | Chuyển thành học viên | Staff | FR-009 | 1 |
| | Chiến dịch, mã giới thiệu, phễu | — | — | — | 2 |
| Nền tảng | Xác thực | Đăng nhập/đăng xuất, khóa tạm | Mọi người | FR-010, FR-011 | 1 |
| | | Đổi mật khẩu, bắt đổi lần đầu | Mọi người | FR-012 | 1 |
| | Người dùng | CRUD, khóa, vai trò, mật khẩu tạm | Admin | FR-013 | 1 |
| | | Liên kết phụ huynh–học sinh | Admin/Staff | FR-014 | 1 |
| | Audit | Ghi và xem nhật ký | Admin | FR-035 | 1 |
| | Quên mật khẩu qua email, 2FA | — | — | — | 2 |
| | Đăng nhập bằng mã học sinh (QUESTION-Q07) | HS | — | — | 2 |
| Đào tạo | Danh mục | Môn, khóa, xuất bản | Admin | FR-015 | 1 |
| | | Phòng | Admin | FR-016 | 1 |
| | Lớp | Mở lớp, sinh buổi, chống trùng | Staff | FR-017, FR-018 | 1 |
| | | Hủy/dời buổi | Staff | FR-021 | 1 |
| | Ghi danh | Ghi danh, đổi trạng thái | Staff | FR-019, FR-020 | 1 |
| | Lịch | Lịch tuần theo vai trò | GV/HS/PH | FR-022 | 1 |
| | Điểm danh | Điểm danh trong khung | GV | FR-023 | 1 |
| | | Sửa ngoài khung + audit | Staff | FR-024 | 1 |
| | | Lịch sử, tỷ lệ | HS/PH | FR-025 | 1 |
| | | Cảnh báo vắng liên tiếp | Staff/GV | FR-026 | 1 |
| | QR/GPS | — | — | — | 2 |
| Khảo thí | Bài tập | Soạn bài 3 dạng câu, xuất bản, đóng | GV | FR-027, FR-028 | 1 |
| | Làm bài | Lưu nháp, nộp 1 lần, nộp muộn | HS | FR-029 | 1 |
| | Chấm | Tự chấm khách quan | Hệ thống | FR-030 | 1 |
| | | Chấm tự luận, nhận xét | GV | FR-031 | 1 |
| | | Công bố, bảng điểm | GV/HS/PH | FR-032, FR-033 | 1 |
| | Ngân hàng câu hỏi, AI chấm | — | — | — | 2 |
| Cổng | Dashboard | Tổng quan theo vai trò | Tất cả | FR-034 | 1 |
| Tài chính | Học phí, lương | — | — | — | 2 |
| Giao tiếp | Chat, thông báo, push | — | — | — | 2 |
