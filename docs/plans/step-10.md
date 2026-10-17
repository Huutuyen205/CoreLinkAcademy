# KẾ HOẠCH BƯỚC 10: HỌC PHÍ, LƯƠNG, THỐNG KÊ, KHẢO SÁT, NHẬP/XUẤT, QUẢN TRỊ (M11–M15 GĐ1)
*Mã bước: STEP-10 | Nhánh: `step-10-finance-admin` | Trạng thái: Đang thực hiện*

---

## 1. Mục tiêu & Phạm vi
Triển khai toàn bộ các chức năng còn lại của Giai đoạn 1 (GĐ1) theo đặc tả `CORELINK_MASTER.md`:
- **M11 Học phí & Lương giáo viên**: FR-1101, FR-1102, FR-1104, FR-1105 (TC-125..TC-131)
- **M12 Báo cáo & Thống kê**: FR-1201..FR-1203 (TC-134..TC-136)
- **M13 Khảo sát & Đánh giá giáo viên**: FR-1301 (TC-138, TC-139)
- **M14 Nhập dữ liệu Excel**: FR-1401, FR-1402 (TC-141..TC-143)
- **M15 Quản trị hệ thống**: FR-1501..FR-1505 (TC-144..TC-148)
- **Phi chức năng (NFR)**: TC-149..TC-153 (Bảo mật OWASP, kiểm thử truy cập chéo RBAC 2 tầng, link riêng tư hết hạn, giao diện 360px, tính tiện dụng).
- **8 Màn hình**: S23 (Học phí phụ huynh), S24 (Khảo sát giáo viên), S34 (Lương & lịch dạy GV), S40 (Học phí kế toán), S41 (Bảng lương kế toán), S42 (Dashboard Admin), S43 (Nhập Excel), S44 (Cấu hình & Quản trị).
- **Tổng kết GĐ1**: Viết tài liệu `docs/walkthroughs/GD1_TONG_KET.md` sẵn sàng nghiệm thu và chuyển sang GĐ2.

---

## 2. Danh sách Test Cases (24 TCs)
1. `TC-125` (FR-1101): Ghi danh tạo khoản phải thu có giảm giá (`invoices`, discount_vnd, tổng phải thu = giá gốc - giảm giá).
2. `TC-126` (FR-1102): Ghi nhận thanh toán và cấp số biên nhận không trùng (`receipt_counters` khóa dòng FOR UPDATE, sinh số `REC-YYYY-XXXXX`).
3. `TC-127` (FR-1102): Thanh toán một phần -> Trạng thái chuyển sang `partial`, cập nhật `paid_vnd` và công nợ còn lại chuẩn xác.
4. `TC-128` (FR-1102): Nhắc phí đúng người -> Chỉ phụ huynh có `receives_fee_notice = true` mới nhận thông báo nhắc học phí.
5. `TC-129` (FR-1105): Lương tính đúng buổi đã xác thực (`verified_at != null`, buổi chưa xác thực nằm ở danh sách chờ).
6. `TC-130` (FR-1105): Buổi dạy thay tính lương cho người dạy thực tế (`substitute_for_teacher_id != null` -> tính lương cho giáo viên dạy thực tế).
7. `TC-131` (FR-1104): Đổi đơn giá theo ngày hiệu lực (`effective_from`) không làm ảnh hưởng các tháng đã chốt kỳ (`closed`).
8. `TC-134` (FR-1201): Mọi con số trên dashboard bấm xem chi tiết -> Trả về danh sách chi tiết có đúng số lượng bản ghi.
9. `TC-135` (FR-1202): Báo cáo giới hạn theo vai trò -> Tư vấn viên mở báo cáo tài chính/lương bị chặn HTTP 403 Forbidden.
10. `TC-136` (FR-1203): Xuất Excel/CSV khớp màn hình -> Số dòng và tổng tiền khớp 100% với số liệu lọc.
11. `TC-138` (FR-1301): Mỗi người chỉ trả lời khảo sát 1 lần mỗi kỳ (`respondent_hash` mã hóa SHA-256 ẩn danh; gửi lần 2 bị chặn 400 Bad Request).
12. `TC-139` (FR-1301): Giáo viên xem kết quả khảo sát không thấy danh tính người trả lời (chỉ có số liệu sao và nhận xét tổng hợp).
13. `TC-141` (FR-1402): Nhập Excel có dòng lỗi -> Nhập các dòng hợp lệ, xuất danh sách/file các dòng lỗi kèm lý do cụ thể.
14. `TC-142` (FR-1402): Cột lạ trong file nhập được lưu thành trường tùy biến (`custom_fields`).
15. `TC-143` (FR-1402): Nhập lại cùng file không tạo trùng bản ghi (chống trùng SĐT, email, mã học sinh).
16. `TC-144` (FR-1501): Nhật ký `audit_logs` không sửa xóa được (không có endpoint UPDATE/DELETE, API trả 404/405).
17. `TC-145` (FR-1502): Cảnh báo khi chi phí AI chạm ngưỡng 80% hạn mức tháng.
18. `TC-146` (FR-1502): Đạt 100% hạn mức AI -> Tạm dừng tính năng không thiết yếu; chatbot tư vấn thiết yếu vẫn duy trì.
19. `TC-147` (FR-1504): Khôi phục dữ liệu từ bản sao lưu / kiểm tra toàn vẹn sao lưu.
20. `TC-148` (FR-1505): Xuất toàn bộ dữ liệu hệ thống (ZIP chứa JSON/CSV các bảng nghiệp vụ và file).
21. `TC-149` (NFR): Quét bảo mật OWASP / kiểm tra header bảo mật (CORS, Rate limit, No X-Powered-By, Content-Type validation).
22. `TC-150` (NFR): Kiểm thử truy cập chéo tự động mọi endpoint (RBAC 2 tầng).
23. `TC-151` (NFR): Link file riêng tư có thời hạn sử dụng (link hết hạn bị từ chối).
24. `TC-152` & `TC-153` (NFR): Giao diện 360px và tính tiện dụng của cổng phụ huynh.

---

## 3. [TECH LEAD] Kiến trúc & Phân rã kỹ thuật

### Backend Modules
1. `FinanceModule` (`apps/api/src/modules/finance`):
   - `TuitionService`: Quản lý `invoices`, `payments`, `receipts`, `receipt_counters` (dùng khóa dòng `SELECT ... FOR UPDATE` tránh cấp trùng số biên nhận), `fee_plans`.
   - `PayrollService`: Quản lý `pay_rates`, `payroll_periods`, `payroll_items`, `payroll_sessions` (đảm bảo mỗi buổi học chỉ tính lương 1 lần duy nhất với `uq_ps_session`), tính lương dạy thay cho giáo viên thực dạy, khóa chốt kỳ.
   - `ReportsService`: Thống kê dashboard tài chính, danh sách chi tiết có phân trang, xuất CSV/Excel khớp màn hình, kiểm soát vai trò chặt chẽ (Tư vấn viên không xem được tài chính).
2. `AdminSystemModule` (`apps/api/src/modules/admin-system`):
   - `SurveyService`: Khảo sát giáo viên, tính hash `SHA-256(userId + surveyId + salt)` để đảm bảo mỗi phụ huynh/học sinh chỉ gửi 1 lần mà giáo viên không xem được danh tính.
   - `ImportExportService`: Nhập Excel (ghép cột, xem trước, lưu dòng đúng, xuất dòng lỗi, cột lạ lưu vào `custom_fields`, chống nhập trùng); xuất toàn bộ dữ liệu hệ thống dưới dạng file ZIP.
   - `SystemSettingsService`: Quản lý `settings`, kiểm tra hạn mức chi phí AI (cảnh báo 80%, đóng băng tính năng AI không thiết yếu ở 100%), nhật ký `audit_logs` bất biến.

### Frontend: 8 Màn hình
- `apps/web/src/app/parent/tuition/page.tsx` (S23)
- `apps/web/src/app/parent/surveys/page.tsx` (S24)
- `apps/web/src/app/teacher/payroll/page.tsx` (S34)
- `apps/web/src/app/accounting/tuition/page.tsx` (S40)
- `apps/web/src/app/accounting/payroll/page.tsx` (S41)
- `apps/web/src/app/admin/dashboard/page.tsx` (S42)
- `apps/web/src/app/admin/imports/page.tsx` (S43)
- `apps/web/src/app/admin/settings/page.tsx` (S44)

### QA / Testing
- E2E Test Suite: `apps/api/test/finance-admin.e2e-spec.ts` phủ toàn bộ 24 test cases.
