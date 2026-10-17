# KẾ HOẠCH BƯỚC 9: PHỤ HUYNH, ĐÁNH GIÁ, TIẾN ĐỘ, TÓM TẮT NGÀY (M05, M07, M08 GĐ1)
*Mã bước: STEP-09 | Nhánh: `step-09-parents-progress` | Trạng thái: Đang thực hiện*

---

## 1. Mục tiêu & Phạm vi
Triển khai toàn bộ chức năng Giai đoạn 1 của các module:
- **M05 Giáo án & Học liệu (GĐ1)**: FR-501, FR-504, FR-507, FR-508 (TC-066..TC-071)
- **M07 Đánh giá & Tiến độ (GĐ1)**: FR-701, FR-703 (TC-099, TC-100)
- **M08 Theo dõi cho phụ huynh (GĐ1)**: FR-801, FR-802, FR-804, FR-805 (TC-103..TC-106)
- **8 Màn hình**: S11, S12, S16 (Học sinh); S20, S21, S22 (Phụ huynh); S26, S33 (Giáo viên)

---

## 2. Danh sách Test Cases (12 TCs)
1. `TC-066` (FR-501): Tải giáo trình khung và quản lý phiên bản (v1, v2) -> Lưu cả 2 bản, giáo viên chỉ thấy bản đang hiệu lực v2.
2. `TC-067` (FR-501): File quá 100 MB bị từ chối -> Báo vượt dung lượng (HTTP 400/413).
3. `TC-068` (FR-501): File sai loại bị từ chối -> Kiểm tra nội dung magic bytes / MIME type thật, từ chối file exe/script giả dạng pdf.
4. `TC-069` (FR-504): Giáo án nháp chưa dùng chung -> GV tải giáo án nháp, GV khác không thấy cho đến khi Admin/Trưởng bộ môn phê duyệt.
5. `TC-070` (FR-507): Học sinh chỉ thấy tài liệu lớp mình -> Gọi API tài liệu lớp khác bị từ chối HTTP 403 Forbidden.
6. `TC-071` (FR-508): Tài liệu bản quyền bên thứ ba không gửi cho AI -> Khóa nút / từ chối HTTP 400 kèm giải thích lý do bảo vệ bản quyền.
7. `TC-099` (FR-701): Đánh giá nhanh cả lớp -> Giáo viên chọn mẫu nhận xét cho cả lớp 15 em hoàn tất dưới 3 phút, phụ huynh thấy nhận xét.
8. `TC-100` (FR-703): Tiến độ cập nhật hằng ngày -> Hiện phần trăm lộ trình (buổi đã học có `lesson_node_id`), xu hướng điểm 8 tuần, chuyên cần.
9. `TC-103` (FR-801): Tổng quan của con khớp dữ liệu giáo viên nhập -> Hiện đúng điểm 8.5 và nhận xét giáo viên, phản hồi dưới 2 giây.
10. `TC-104` (FR-802): Tác vụ 20:00 dựng tóm tắt ngày tự động từ dữ kiện trong ngày (điểm danh, nộp bài, điểm số) bằng model nhẹ chỉ diễn đạt lại, không thêm thông tin.
11. `TC-105` (FR-802): Ngày không có hoạt động học tập -> Tác vụ 20:00 không gửi tóm tắt.
12. `TC-106` (FR-805): Chuyển đổi giữa các con -> Phụ huynh có 2 con chuyển mượt mà giữa con A và con B, toàn bộ dữ liệu chuyển theo, thông báo ghi rõ tên con.

---

## 3. [BA] User Stories & Tiêu chí chấp nhận
- **US-01 (Giáo trình khung & phiên bản - FR-501, TC-066, TC-067, TC-068)**:
  - *Là Admin*, tôi muốn tải giáo trình khung dạng PDF/Word/PowerPoint (tối đa 100MB), có kiểm tra định dạng nội dung file thật và quản lý phiên bản (v1, v2) để tài liệu đào tạo luôn chuẩn hóa và giáo viên chỉ tiếp cận bản có hiệu lực.
  - *Given* giáo trình v1 và v2, *When* GV xem danh sách giáo trình, *Then* chỉ thấy phiên bản hiệu lực v2; tải file > 100MB hoặc file giả mạo đuôi bị từ chối ngay.
- **US-02 (Giáo án & Chia sẻ tài liệu - FR-504, FR-507, FR-508, TC-069, TC-070, TC-071)**:
  - *Là Giáo viên*, tôi muốn soạn giáo án cá nhân ở trạng thái nháp và chỉ dùng chung cho trung tâm khi được duyệt; tôi muốn đánh dấu nguồn bản quyền tài liệu (bên thứ ba thì cấm gọi AI).
  - *Là Học sinh*, tôi muốn vào kho tài liệu lớp mình và bị chặn khi cố xem tài liệu lớp khác.
- **US-03 (Đánh giá nhanh học sinh - FR-701, TC-099)**:
  - *Là Giáo viên*, tôi muốn dùng bộ mẫu nhận xét sẵn (thái độ, tập trung, tiến bộ) để đánh giá nhanh cả lớp 15 học sinh dưới 3 phút để phụ huynh nắm bắt kịp thời.
- **US-04 (Tiến độ học tập & Tổng quan phụ huynh - FR-703, FR-801, FR-805, TC-100, TC-103, TC-106)**:
  - *Là Phụ huynh*, tôi muốn mở trang tổng quan thấy đầy đủ phần trăm lộ trình của con, điểm số (khớp 100% với giáo viên nhập), xu hướng 8 tuần và chuyên cần, phản hồi dưới 2s; chuyển đổi mượt mà giữa các con.
- **US-05 (Tóm tắt ngày tự động lúc 20:00 - FR-802, TC-104, TC-105)**:
  - *Là Phụ huynh*, tôi muốn nhận tóm tắt ngày vào 20:00 gom từ các sự kiện có thật trong ngày của con; ngày nào con không có hoạt động thì không gửi để tránh làm phiền.

---

## 4. [TECH LEAD] Kiến trúc & Phân rã kỹ thuật

### Backend: 2 Modules
1. `CurriculumModule` (`apps/api/src/modules/curriculum`):
   - Quản lý `curricula`, `curriculum_versions`, `curriculum_nodes`, `lesson_plans`, `materials`, `files`.
   - File upload validation: size <= 100 MB, magic bytes inspection (PDF: `%PDF-`, ZIP/Office: `PK\x03\x04`, Compound File: `\xD0\xCF\x11\xE0`).
   - Copyright protection: `files.copyright_source = 'third_party'` -> cấm gửi sang AiGateway.
2. `ParentsProgressModule` (`apps/api/src/modules/parents-progress`):
   - Quản lý `evaluations`, `guardianships`, `daily_summaries`, tính toán tiến độ lộ trình (`curriculum_nodes`).
   - Tác vụ 20:00 (`DailySummaryService`): gom sự kiện `attendance`, `attempts`, `evaluations` trong ngày; nếu rỗng -> skip; nếu có -> gọi AiGateway (model nhẹ Haiku / fallback template an toàn) sinh `text_vi` bám sát `facts`.
   - RBAC bảo mật: Phụ huynh chỉ xem được dữ liệu của con mình thông qua bảng `guardianships`.

### Frontend: 8 Màn hình
- `apps/web/src/app/student/page.tsx` (S11: Hôm nay học gì, tiến độ, bài hạn)
- `apps/web/src/app/student/schedule/page.tsx` (S12: Lịch tuần & nút xin nghỉ)
- `apps/web/src/app/student/materials/page.tsx` (S16: Kho tài liệu theo lớp & buổi)
- `apps/web/src/app/parent/page.tsx` (S20: Tổng quan của con, chuyển con A/B, tiến độ, chuyên cần)
- `apps/web/src/app/parent/assignments/page.tsx` (S21: Bài tập & kết quả của con)
- `apps/web/src/app/parent/reports/page.tsx` (S22: Tóm tắt ngày và báo cáo)
- `apps/web/src/app/teacher/page.tsx` (S26: Trang chính giáo viên, lịch dạy, bài chờ chấm)
- `apps/web/src/app/teacher/evaluations/page.tsx` (S33: Đánh giá nhanh theo mẫu cho cả lớp)

### QA / Testing
- E2E Test Suite: `apps/api/test/parents-progress.e2e-spec.ts` phủ toàn bộ 12 test cases.
