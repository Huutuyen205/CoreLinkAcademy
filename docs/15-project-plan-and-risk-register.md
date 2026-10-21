# 15 — Kế hoạch và sổ rủi ro

## 1. Các pha

| Pha | Nội dung | Đầu ra | Cổng | Trạng thái (2026-10-21) |
|---|---|---|---|---|
| 0 | Discovery + tài liệu baseline | `docs/00..18` | Chủ dự án đã chốt 8 quyết định | Xong |
| 1a | Nền tảng: scaffold Next.js, Prisma, migrate, seed, design system, xác thực, layout theo vai trò | Đăng nhập được 5 vai trò | typecheck/lint/test/build xanh | Code xong, kiểm tra tĩnh xanh; chờ migrate DB để đăng nhập thử |
| 1b | Công khai + tuyển sinh (FR-001..009) | Form → lead → học viên | như trên | Code xong, kiểm tra tĩnh xanh; chờ DB |
| 1c | Đào tạo + điểm danh (FR-013..026) | Mở lớp, ghi danh, điểm danh, lịch | như trên | Code xong, kiểm tra tĩnh xanh; chờ DB |
| 1d | Bài tập + chấm (FR-027..035) | Làm bài → chấm → công bố | như trên | Code xong, kiểm tra tĩnh xanh; chờ DB |
| 1.5 | Integration test với DB test, Playwright E2E 360px, axe | Bằng chứng test tự động cho UC | — | Chưa bắt đầu (cần QUESTION-Q08) |
| 2 | Học phí, thông báo, AI chatbot, QR… | Theo ưu tiên của chủ dự án | Discovery bổ sung | Chưa bắt đầu |

## 2. Sổ rủi ro

| ID | Rủi ro | Khả năng | Tác động | Giảm thiểu | Owner |
|---|---|---|---|---|---|
| RISK-001 | Xóa DB `corelink` cũ làm mất dữ liệu | Thấp (chủ dự án đã chọn) | Cao | `mysqldump` trước khi xóa, lưu ở `backup/` | Dev |
| RISK-002 | Phạm vi phình ra như v1/v2 | Cao | Cao | Mọi ý tưởng mới vào mục Pha 2 của 05; không code ngoài FR | Chủ dự án |
| RISK-003 | Server Action thiếu kiểm quyền | Trung bình | Cao | Mẫu action chuẩn + unit test policy + review | Dev |
| RISK-004 | Chưa có integration/E2E test ở Pha 1 | Chắc chắn | Trung bình | Kiểm tra thủ công có ghi chép, Pha 1.5 bổ sung | Dev |
| RISK-005 | Sai lệch múi giờ khi sinh lịch | Trung bình | Trung bình | Một module `time.ts` duy nhất + unit test | Dev |
| RISK-006 | Hosting chưa chọn | — | Trung bình | Chọn trước khi có người dùng thật (Q04) | Chủ dự án |
| RISK-007 | Code Pha 1 chưa chạy trên DB thật (DB chưa migrate, không có DB test) | Chắc chắn | Cao | Chủ dự án chạy `prisma migrate reset`, kiểm tra thủ công UC-001..012; cấp quyền `corelink_test` cho Pha 1.5 | Chủ dự án + Dev |
