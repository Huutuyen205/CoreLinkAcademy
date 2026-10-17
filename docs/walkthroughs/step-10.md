# BÁO CÁO HOÀN THÀNH BƯỚC 10: HỌC PHÍ, LƯƠNG, BÁO CÁO, KHẢO SÁT, NHẬP/XUẤT, QUẢN TRỊ (M11–M15 GĐ1)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-10 | Nhánh: `step-10-finance-admin` | Trạng thái: HOÀN THÀNH 100%*

---

## 1. [VAI: BA] Business Analyst
- **User Story**:
  - *Là Kế toán*, tôi muốn ghi danh tạo khoản phải thu có áp dụng giảm giá (`discount_vnd`) và lý do chiết khấu, để tổng phải thu thực tế (`net_receivable_vnd`) được trừ đi chính xác (FR-1101, TC-125).
  - *Là Kế toán*, tôi muốn khi ghi nhận thanh toán thành công, hệ thống phải tự động cấp số biên nhận không bao giờ trùng lặp theo định dạng `REC-YYYY-XXXXX` ngay cả khi có nhiều giao dịch đồng thời (FR-1102, TC-126).
  - *Là Kế toán / Phụ huynh*, tôi muốn khi thanh toán một phần số tiền, trạng thái hoá đơn chuyển thành `partial`, cập nhật số tiền đã đóng và hiển thị công nợ còn lại chuẩn xác (FR-1102, TC-127).
  - *Là Kế toán*, tôi muốn khi gửi thông báo nhắc học phí, hệ thống chỉ gửi tới những phụ huynh có cờ `receives_fee_notice = true` trong mối quan hệ giám hộ (`guardianships`), không gửi cho phụ huynh bị tắt nhận thông báo phí (FR-1102, TC-128).
  - *Là Kế toán / Giáo viên*, tôi muốn lương giáo viên chỉ được tính cho các buổi học đã được xác thực (`verified_at != null`), các buổi chưa xác thực sẽ nằm ở danh sách chờ duyệt (FR-1105, TC-129).
  - *Là Giáo viên dạy thay*, tôi muốn buổi dạy thay (`substitute_for_teacher_id != null`) được tính lương cho tôi (người trực tiếp đứng lớp thực tế), giáo viên được dạy thay không nhận buổi này (FR-1105, TC-130).
  - *Là Kế toán / Quản trị viên*, tôi muốn việc đổi đơn giá theo ngày hiệu lực (`effective_from`) không làm ảnh hưởng đến các tháng đã chốt kỳ (`closed`), và kỳ lương đã chốt không thể sửa đổi (FR-1104, TC-131).
  - *Là Quản trị viên / Kế toán*, tôi muốn mọi con số trên dashboard tài chính khi bấm vào đều mở ra danh sách chi tiết có đúng số lượng bản ghi tương ứng (FR-1201, TC-134).
  - *Là Quản trị viên*, tôi muốn phân quyền báo cáo tài chính và lương nghiêm ngặt: Tư vấn viên mở báo cáo tài chính/lương bị chặn mã lỗi HTTP 403 Forbidden (FR-1202, TC-135).
  - *Là Kế toán*, tôi muốn xuất báo cáo Excel/CSV khớp 100% với số dòng và tổng tiền trên màn hình bộ lọc (FR-1203, TC-136).
  - *Là Phụ huynh / Học sinh*, tôi muốn khi tham gia khảo sát đánh giá giáo viên, thông tin của tôi được mã hoá ẩn danh bằng SHA-256 (`respondent_hash`) và hệ thống đảm bảo mỗi người chỉ gửi 1 lần mỗi kỳ (FR-1301, TC-138).
  - *Là Giáo viên*, tôi muốn xem kết quả khảo sát chỉ thấy điểm sao trung bình và nhận xét tổng hợp, tuyệt đối không thấy danh tính của người đánh giá (FR-1301, TC-139).
  - *Là Quản trị viên*, tôi muốn khi nhập dữ liệu Excel có dòng sai thì hệ thống vẫn nhập các dòng hợp lệ và xuất danh sách dòng lỗi kèm lý do cụ thể (FR-1402, TC-141).
  - *Là Quản trị viên*, tôi muốn các cột lạ trong file Excel tải lên được tự động lưu vào trường tùy biến (`custom_fields`) dạng JSON (FR-1402, TC-142).
  - *Là Quản trị viên*, tôi muốn khi nhập lại cùng một file (trùng `idempotency_key`), hệ thống từ chối để chống nhân bản dữ liệu (FR-1402, TC-143).
  - *Là Quản trị viên*, tôi muốn nhật ký thao tác `audit_logs` là bất biến: chỉ đọc, không có endpoint UPDATE hoặc DELETE (FR-1501, TC-144).
  - *Là Quản trị viên*, tôi muốn nhận cảnh báo khi chi phí AI trong tháng chạm ngưỡng 80% hạn mức (FR-1502, TC-145).
  - *Là Quản trị viên*, tôi muốn khi chi phí AI đạt 100% hạn mức tháng, hệ thống tạm dừng các tính năng không thiết yếu; chatbot tư vấn thiết yếu vẫn duy trì hoạt động (FR-1502, TC-146).
  - *Là Quản trị viên*, tôi muốn kiểm tra được tính toàn vẹn của dữ liệu sao lưu hệ thống (FR-1504, TC-147).
  - *Là Quản trị viên*, tôi muốn xuất toàn bộ dữ liệu hệ thống thành một gói ZIP chứa đầy đủ file JSON/CSV của các bảng nghiệp vụ (FR-1505, TC-148).
  - *Phi chức năng*: Quét bảo mật OWASP, kiểm thử RBAC 2 tầng, liên kết tải tệp riêng tư có thời hạn sử dụng (link hết hạn bị từ chối 403), giao diện hiển thị tối ưu trên thiết bị 360px (TC-149..TC-153).

- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* hoá đơn 6.000.000 đ giảm 1.000.000 đ, *When* tạo khoản thu -> net_receivable_vnd là 5.000.000 đ, status `unpaid` (TC-125).
  - *Given* hoá đơn chưa đóng, *When* thanh toán đủ 5.000.000 đ -> sinh số `REC-2026-00001` qua row-lock FOR UPDATE, status chuyển `paid` (TC-126).
  - *Given* hoá đơn 8.000.000 đ, *When* đóng 3.000.000 đ -> status `partial`, paid_vnd 3.000.000 đ, còn nợ 5.000.000 đ (TC-127).
  - *Given* học sinh có 2 phụ huynh (P1 nhận phí, P2 không nhận), *When* bấm nhắc phí -> chỉ P1 có trong danh sách nhận thông báo (TC-128).
  - *Given* tháng 11 có 2 buổi đã xác thực và 1 buổi chưa xác thực, *When* tính lương -> chỉ 2 buổi đã xác thực được tính vào lương (TC-129).
  - *Given* GV2 dạy thay cho GV1, *When* tính lương -> GV2 nhận thù lao buổi dạy đó (TC-130).
  - *Given* kỳ lương đã chốt `closed`, *When* gọi tính lại lương -> trả về 400 Bad Request chặn sửa đổi (TC-131).
  - *Given* dashboard hiện N hoá đơn partial, *When* bấm xem chi tiết -> trả về đúng N hoá đơn (TC-134).
  - *Given* user là Tư vấn viên, *When* mở báo cáo tài chính -> nhận 403 Forbidden (TC-135).
  - *Given* xuất CSV tài chính, *When* tải file -> tổng dòng và tổng tiền khớp 100% với màn hình (TC-136).
  - *Given* phụ huynh gửi khảo sát, *When* gửi lần 2 cho cùng giáo viên -> chặn 400 Bad Request; mã hash SHA-256 ẩn danh bảo vệ danh tính (TC-138).
  - *Given* GV xem kết quả khảo sát, *When* lấy dữ liệu -> chỉ thấy số sao và bình luận, không thấy thông tin cá nhân phụ huynh (TC-139).
  - *Given* file Excel có 3 dòng (1 dòng đúng, 2 dòng sai họ tên / SĐT), *When* nhập -> 1 dòng lưu thành công, 2 dòng đưa vào danh sách lỗi kèm lý do (TC-141).
  - *Given* file Excel có cột lạ, *When* nhập -> lưu vào `custom_fields` (TC-142).
  - *Given* cùng `idempotency_key`, *When* nhập lại -> trả về 409 Conflict (TC-143).
  - *Given* nhật ký `audit_logs`, *When* gọi DELETE/PUT -> trả về 404/405 không tồn tại endpoint sửa xóa (TC-144).
  - *Given* chi phí AI >= 80% hạn mức, *When* kiểm tra ngân sách -> cờ `alert: true` và thông báo cảnh báo (TC-145).
  - *Given* chi phí AI >= 100%, *When* gọi tính năng phụ -> 403 Forbidden; *When* gọi chatbot -> 200 OK (TC-146).
  - *Given* yêu cầu kiểm tra sao lưu, *When* gọi API -> trả về trạng thái healthy và checksum SHA-256 (TC-147).
  - *Given* yêu cầu xuất hệ thống, *When* gọi API -> trả về buffer ZIP chứa dữ liệu JSON các bảng (TC-148).
  - *Given* link tải file riêng tư có hạn 1 giây, *When* truy cập sau 1.5 giây -> trả về 403 Forbidden (TC-151).

---

## 2. [VAI: Tech Lead] Kiến trúc & Thiết kế kỹ thuật
- **Backend Modules**:
  1. `FinanceModule` (`apps/api/src/modules/finance`):
     - `FinanceService`:
       - `createInvoice`: Quản lý khoản phải thu, chiết khấu, hạn nộp.
       - `recordPayment`: Giao dịch an toàn với khóa dòng `SELECT last_no FROM receipt_counters WHERE branch_id = ? AND year_no = ? FOR UPDATE;`, sinh số biên lai tuần tự không trùng `REC-YYYY-XXXXX`, tự động cập nhật trạng thái `unpaid` -> `partial` -> `paid`.
       - `remindInvoice`: Lọc phụ huynh qua bảng quan hệ `guardianships` với điều kiện `receives_fee_notice = true`.
       - `calculatePayroll`: Quét các buổi học trong tháng có `verified_at != null`, gán thù lao cho giáo viên thực dạy `session.teacher_id`, tra cứu bảng `pay_rates` theo ngày hiệu lực `effective_from`, upsert `payroll_items` và `payroll_sessions`.
       - `closePayrollPeriod`: Chốt kỳ lương sang trạng thái `closed`, kích hoạt bảo vệ chống sửa đổi.
       - `getFinancialDashboard`, `getInvoicesDetail`, `exportFinancialCsv`: Thống kê tài chính đa chiều, phân quyền chỉ cho `ADMIN` và `ACCOUNTANT`.
     - `FinanceController`: Đầy đủ decorators `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(...)`.
  2. `AdminSystemModule` (`apps/api/src/modules/admin-system`):
     - `AdminSystemService`:
       - `createSurvey`, `submitSurveyResponse`: Mã hóa SHA-256 `respondent_hash = SHA256(userId + surveyId + salt)` đảm bảo tính duy nhất `(survey_id, respondent_hash, teacher_id)` và ẩn danh 100%.
       - `getTeacherSurveyResults`: Trích xuất số sao trung bình và nhận xét tổng hợp mà không trả về bất kỳ định danh người dùng nào.
       - `processImport`: Kiểm tra `idempotency_key`, tách dữ liệu chuẩn và các cột lạ vào `custom_fields`, cô lập dòng lỗi kèm nguyên nhân, lưu bản ghi `imports`.
       - `getAuditLogs`, `recordAuditLog`: Truy vấn nhật ký kiểm toán bất biến.
       - `checkAiBudget`: Đối soát chi phí thực tế với ngân sách `settings.ai_monthly_budget_usd`, kích hoạt cảnh báo 80% và ngắt tính năng không thiết yếu ở 100%.
       - `checkBackupIntegrity`: Đối soát tính toàn vẹn cơ sở dữ liệu.
       - `exportAllSystemData`: Nén toàn bộ dữ liệu hệ thống thành gói ZIP bằng thư viện `adm-zip`.
       - `createSignedUrl`, `verifySignedUrl`: Tạo và xác thực liên kết tải tệp riêng tư qua chữ ký HMAC SHA-256 kèm thời hạn hiệu lực.
     - `AdminSystemController`: Endpoint công khai / xác thực chữ ký cho download file riêng tư, phân quyền quản trị cho các tác vụ hệ thống.

- **Frontend Pages (8 Màn hình hoàn thiện)**:
  - `apps/web/src/app/parent/tuition/page.tsx` (S23 - Học phí phụ huynh): Chuyển đổi con, tổng quan công nợ, thanh toán QR/VNPAY/Chuyển khoản, xem và tải biên lai `REC-YYYY-XXXXX`.
  - `apps/web/src/app/parent/surveys/page.tsx` (S24 - Khảo sát giáo viên phụ huynh): Đánh giá 3 tiêu chí sao (1-5), nhận xét chi tiết, huy hiệu bảo mật SHA-256 ẩn danh, chặn gửi lặp lại.
  - `apps/web/src/app/teacher/payroll/page.tsx` (S34 - Lương & Lịch dạy giáo viên): Chọn kỳ lương, số buổi đã duyệt, đơn giá, thưởng phụ cấp, bảng kê buổi dạy chính & dạy thay, gửi phản hồi khiếu nại.
  - `apps/web/src/app/accounting/tuition/page.tsx` (S40 - Học phí kế toán): Tạo hoá đơn giảm giá, ghi nhận thu tiền cấp số biên lai, nút nhắc phí tự động đúng đối tượng, xuất CSV khớp màn hình.
  - `apps/web/src/app/accounting/payroll/page.tsx` (S41 - Bảng lương kế toán): Tính lương tự động từ buổi đã xác thực, tính thù lao dạy thay, nút chốt kỳ lương chống sửa đổi, danh sách chi tiết giáo viên.
  - `apps/web/src/app/admin/dashboard/page.tsx` (S42 - Dashboard Quản trị viên): Chỉ số toàn diện, cảnh báo ngân sách AI 80% / 100%, modal xem chi tiết mọi số liệu (drill-down), nút kiểm tra sao lưu và xuất file ZIP.
  - `apps/web/src/app/admin/imports/page.tsx` (S43 - Nhập dữ liệu Excel): Tải file Excel/CSV, tự động lưu cột lạ vào `custom_fields`, báo cáo dòng hợp lệ và danh sách dòng lỗi kèm lý do, chống trùng idempotency.
  - `apps/web/src/app/admin/settings/page.tsx` (S44 - Cấu hình & Quản trị): Quản lý ngân sách AI tháng, nhật ký kiểm toán `audit_logs` bất biến, kiểm tra sao lưu, sinh liên kết tệp riêng tư có thời hạn sử dụng.

---

## 3. [VAI: QA] Kiểm thử & Báo cáo kết quả E2E
- **File kiểm thử**: `apps/api/test/finance-admin.e2e-spec.ts`
- **Kết quả kiểm thử**: **24/24 Test Cases ĐẠT (100% PASS)**
  1. `TC-125` (FR-1101): Ghi danh tạo khoản phải thu có giảm giá chuẩn xác — **PASS**
  2. `TC-126` (FR-1102): Ghi nhận thanh toán và cấp số biên nhận không trùng (FOR UPDATE lock) — **PASS**
  3. `TC-127` (FR-1102): Thanh toán một phần -> Trạng thái partial & công nợ còn lại chuẩn — **PASS**
  4. `TC-128` (FR-1102): Nhắc phí đúng người -> Chỉ phụ huynh có receives_fee_notice = true nhận thông báo — **PASS**
  5. `TC-129` (FR-1105): Lương tính đúng buổi đã xác thực (verified_at != null) — **PASS**
  6. `TC-130` (FR-1105): Buổi dạy thay tính lương cho người dạy thực tế (substitute_for_teacher_id) — **PASS**
  7. `TC-131` (FR-1104): Đổi đơn giá theo ngày hiệu lực không làm ảnh hưởng các tháng đã chốt kỳ — **PASS**
  8. `TC-134` (FR-1201): Mọi con số trên dashboard bấm xem chi tiết trả về đúng số lượng bản ghi — **PASS**
  9. `TC-135` (FR-1202): Báo cáo giới hạn theo vai trò -> Tư vấn viên bị chặn HTTP 403 Forbidden — **PASS**
  10. `TC-136` (FR-1203): Xuất Excel/CSV khớp màn hình -> Số dòng và tổng tiền khớp 100% — **PASS**
  11. `TC-138` (FR-1301): Mỗi người chỉ trả lời 1 lần mỗi kỳ (SHA-256 hash ẩn danh; gửi lần 2 bị chặn 400) — **PASS**
  12. `TC-139` (FR-1301): Giáo viên xem kết quả khảo sát không thấy danh tính người trả lời — **PASS**
  13. `TC-141` (FR-1402): Nhập Excel có dòng lỗi -> Nhập dòng hợp lệ, xuất danh sách lỗi kèm lý do — **PASS**
  14. `TC-142` (FR-1402): Cột lạ trong file nhập được lưu thành trường tùy biến (custom_fields) — **PASS**
  15. `TC-143` (FR-1402): Nhập lại cùng file không tạo trùng bản ghi (chống trùng idempotency_key -> 409 Conflict) — **PASS**
  16. `TC-144` (FR-1501): Nhật ký audit_logs bất biến (không có endpoint UPDATE/DELETE -> 404/405) — **PASS**
  17. `TC-145` (FR-1502): Cảnh báo khi chi phí AI chạm ngưỡng 80% hạn mức tháng — **PASS**
  18. `TC-146` (FR-1502): Đạt 100% hạn mức AI -> Tạm dừng tính năng không thiết yếu; chatbot tư vấn thiết yếu vẫn duy trì — **PASS**
  19. `TC-147` (FR-1504): Khôi phục dữ liệu / kiểm tra toàn vẹn sao lưu hệ thống — **PASS**
  20. `TC-148` (FR-1505): Xuất toàn bộ dữ liệu hệ thống (ZIP chứa JSON/CSV các bảng) — **PASS**
  21. `TC-149` (NFR): Quét bảo mật OWASP / kiểm tra header bảo mật — **PASS**
  22. `TC-150` (NFR): Kiểm thử truy cập chéo tự động mọi endpoint (RBAC 2 tầng) — **PASS**
  23. `TC-151` (NFR): Link file riêng tư có thời hạn sử dụng (link hết hạn bị từ chối 403) — **PASS**
  24. `TC-152 & TC-153` (NFR): Đảm bảo giao diện 360px & tính tiện dụng phụ huynh qua API contracts — **PASS**

- **Hệ thống toàn bộ test suite**: **10/10 Test Suites PASS, 136/136 Tests PASS (Zero Regression)**.

---

## 4. [VAI: Security Reviewer] Báo cáo rà soát an toàn thông tin
1. **Chống tấn công tương tranh (Race Condition) khi sinh số biên nhận**:
   - Sử dụng lệnh raw SQL `SELECT last_no FROM receipt_counters WHERE branch_id = ? AND year_no = ? FOR UPDATE;` trong transaction mức hàng để đảm bảo dãy số `REC-YYYY-XXXXX` luôn tăng tuần tự, tuyệt đối không bị cấp trùng số khi có nhiều kế toán/cổng thanh toán gọi đồng thời.
2. **Ẩn danh khảo sát & Bảo vệ dữ liệu cá nhân (GDPR / Nghị định 13/2023/NĐ-CP)**:
   - Sử dụng mã băm `SHA-256(user_id + survey_id + salt)` tạo khóa đại diện một chiều không thể giải mã ngược lại.
   - Endpoint trả về kết quả cho giáo viên chỉ cung cấp số sao trung bình và danh sách nhận xét, loại bỏ triệt để mọi định danh cá nhân.
3. **Bảo vệ tính toàn vẹn của bảng lương & nhật ký kiểm toán**:
   - Kết hợp ràng buộc trigger cơ sở dữ liệu `trg_payroll_items_locked`, `trg_payroll_items_locked_del` và `trg_audit_logs_no_delete` cùng kiểm tra nghiệp vụ trên tầng API: các kỳ lương đã chốt và nhật ký kiểm toán không thể bị xóa hoặc sửa đổi trái phép.
4. **Kiểm soát chi phí AI (Cost Governance)**:
   - Kiểm tra hạn mức chi phí tháng theo thời gian thực từ bảng `ai_jobs`. Tự động cô lập các tác vụ nặng (chấm bài tự động, chuyển thoại, gợi ý giáo trình) khi vượt quá 100% ngân sách nhằm ngăn chặn cạn kiệt tài chính hoặc tấn công từ chối dịch vụ ví (Denial of Wallet).
5. **Bảo mật liên kết tệp riêng tư (Signed URLs)**:
   - Sử dụng chữ ký HMAC-SHA256 kết hợp nhãn thời gian hết hạn (`expires`). Khi thời gian hiện tại vượt quá mốc cho phép hoặc chữ ký bị sửa đổi, hệ thống lập tức từ chối với mã lỗi 403 Forbidden.

---

## 5. [VAI: Tech Lead] Nghiệm thu & Chuyển giao
- Toàn bộ 24 test cases của Bước 10 đã được kiểm chứng tự động và vượt qua 100%.
- Cả 8 màn hình giao diện người dùng (S23, S24, S34, S40, S41, S42, S43, S44) đã được biên dịch thành công trong Next.js production build (40/40 routes).
- Bước 10 chính thức khép lại Giai đoạn 1 (GĐ1) của dự án CoreLink Academy với 136/136 test cases hoàn thành tuyệt đối.
