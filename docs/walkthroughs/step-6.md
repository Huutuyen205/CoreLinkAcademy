# BÁO CÁO HOÀN THÀNH BƯỚC 6: ĐIỂM DANH QR & XÁC THỰC BUỔI HỌC (M04)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-06 | Nhánh: `step-06-attendance` | Trạng thái: HOÀN THÀNH 100%*

---

## 1. [VAI: BA] Business Analyst
- **User Story**:
  - *Là Giáo viên*, tôi muốn mở giao diện điểm danh nhanh lớp học với danh sách học sinh mặc định có mặt (present), chỉ cần 1-2 chạm đổi trạng thái cho các em vắng/muộn và lưu toàn bộ lớp dưới 30 giây (FR-401, TC-051).
  - *Là Quản trị viên/Giáo vụ*, tôi muốn mã QR buổi học được sinh tự động với token động 32 ký tự ngẫu nhiên mã hóa có hạn sử dụng, tự động từ chối mã của buổi khác hoặc ảnh QR cũ chụp gửi qua Zalo/mạng xã hội (FR-402, TC-052, TC-053).
  - *Là Giáo viên*, tôi muốn xác thực mở buổi học offline bằng cách quét mã QR phòng học kèm chụp ảnh selfie/phòng học và định vị GPS trong bán kính cho phép (mặc định 50m); nếu ngoài bán kính hoặc từ chối GPS thì hệ thống hướng dẫn đề xuất điểm danh thủ công gửi Giáo vụ phê duyệt (FR-403, TC-054..TC-056).
  - *Là Cán bộ quản lý/Giáo vụ*, tôi muốn ảnh chụp xác thực điểm danh tự động dọn dẹp sau 30 ngày để tối ưu lưu trữ trong khi vẫn bảo lưu toàn bộ bản ghi check-in và điểm danh (FR-403, TC-057).
  - *Là Học sinh/Phụ huynh*, tôi muốn quét mã QR khi tham gia lớp học trực tuyến; nếu quét trong 15 phút đầu được tính là có mặt (present), nếu quét sau 15 phút hệ thống tự động ghi nhận là đi muộn (late) (FR-404, TC-058, TC-059).
  - *Là Phụ huynh*, tôi muốn nhận thông báo tức thời khi con có mặt tại lớp hoặc vắng mặt; thông báo vắng mặt là loại thông báo bắt buộc (mandatory) không thể tắt để đảm bảo an toàn học sinh (FR-405, TC-060, TC-062).
  - *Là Phụ huynh*, tôi muốn nộp đơn xin nghỉ học trước khi buổi học bắt đầu kèm lý do, hệ thống tự động ghi nhận trạng thái vắng có phép (excused) và lưu vết đơn xin phép (FR-406, TC-063).
  - *Là Quản trị viên/Giáo vụ*, tôi muốn chặn Giáo viên tự ý sửa đổi dữ liệu điểm danh sau khi buổi học đã kết thúc (trả về 403 Forbidden); chỉ Giáo vụ hoặc Admin mới có quyền sửa kèm bắt buộc nhập lý do giải trình và lưu vết kiểm toán vào `audit_logs` (FR-408, TC-064).
  - *Là Giáo vụ/Giáo viên*, tôi muốn hệ thống tự động phát hiện và kích hoạt cảnh báo khi học sinh vắng 2 buổi liên tiếp để kịp thời liên hệ gia đình (FR-409, TC-065).

- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* danh sách ghi danh lớp học, *When* giáo viên thực hiện điểm danh nhanh `POST /api/v1/attendance/sessions/:id/quick`, *Then* toàn bộ trạng thái điểm danh được cập nhật thành công (TC-051).
  - *Given* mã QR của một buổi học khác, *When* học sinh cố tình quét mã này cho buổi hiện tại, *Then* trả về 400 Bad Request kèm thông báo không khớp buổi học (TC-052).
  - *Given* ảnh chụp QR token đã hết hạn, *When* gửi yêu cầu check-in, *Then* trả về 400 Bad Request kèm thông báo token hết hạn (TC-053).
  - *Given* tọa độ GPS của giáo viên nằm trong bán kính phòng học (`<= checkin_radius_m`), *When* gửi yêu cầu xác thực mở buổi học offline `POST /api/v1/attendance/sessions/:id/verify-offline`, *Then* trạng thái xác thực `accepted` và `verify_method = qr_offline` (TC-054).
  - *Given* giáo viên ở ngoài bán kính hoặc từ chối cấp quyền GPS, *When* gửi yêu cầu, *Then* hệ thống trả về `rejected_distance` hoặc `rejected_no_location` kèm `suggestManualCheckin = true` (TC-055, TC-056).
  - *Given* các ảnh chụp xác thực buổi học tạo cách đây trên 30 ngày, *When* tác vụ dọn dẹp chạy `POST /api/v1/attendance/jobs/cleanup-photos`, *Then* đường dẫn ảnh được dọn dẹp trong khi bản ghi xác thực vẫn bảo toàn (TC-057).
  - *Given* buổi học trực tuyến, *When* học sinh quét QR trong 15 phút đầu thì ghi nhận `present`, quét sau 15 phút thì ghi nhận `late` (TC-058, TC-059).
  - *Given* phụ huynh nộp đơn xin nghỉ `POST /api/v1/attendance/sessions/:id/absence-request` trước giờ học, *Then* điểm danh của học sinh tự động chuyển sang `excused` (TC-063).
  - *Given* buổi học đã kết thúc, *When* giáo viên cố tình sửa điểm danh, *Then* trả về 403 Forbidden; *When* Giáo vụ/Admin sửa kèm lý do, *Then* cập nhật thành công và ghi nhận vào `audit_logs` (TC-064).
  - *Given* học sinh vắng 2 buổi học liên tiếp, *When* điểm danh buổi thứ 2, *Then* kích hoạt cảnh báo vắng liên tiếp gửi Giáo vụ/GV (TC-065).

---

## 2. [VAI: Tech Lead] Kiến trúc & Thiết kế kỹ thuật
- **Backend API (`apps/api/src/modules/attendance`)**:
  - `AttendanceService`:
    - `quickAttendance`: Upsert bảng `attendance` hàng loạt, ghi nhận `source = teacher_batch`, tự động kiểm tra cảnh báo vắng 2 buổi liên tiếp (`checkConsecutiveAbsences`).
    - `generateSessionQr`: Sinh chuỗi nonce ngẫu nhiên 32 ký tự, lưu vào `session_qr_tokens` với `expired_at`, hỗ trợ thời gian sống linh hoạt.
    - `verifyOfflineOpening`: Tính khoảng cách Haversine giữa tọa độ GPS thiết bị gửi lên và tọa độ cơ sở (`branches.lat`, `branches.lng`). Nếu `<= checkin_radius_m` -> cập nhật `class_sessions.verify_method = qr_offline` và lưu bản ghi `class_session_verifications`. Nếu vi phạm bán kính hoặc thiếu GPS -> trả về gợi ý `suggestManualCheckin = true`.
    - `requestManualVerification`: Giáo viên gửi đề xuất xác thực thủ công kèm lý do; Giáo vụ phê duyệt qua `approveManualVerification` cập nhật `verify_method = manual`.
    - `studentOnlineCheckin`: Kiểm tra token QR còn hạn, kiểm tra học sinh có ghi danh hợp lệ. So sánh mốc thời gian: `<= 15 phút` -> `present`, `> 15 phút` -> `late`. Cập nhật `guardian_notified_at`.
    - `submitAbsenceRequest`: Kiểm tra thời gian trước giờ học, lưu vào `absence_requests` và tự động cập nhật bảng `attendance` với trạng thái `excused`.
    - `updateAttendanceAdmin`: Chặn giáo viên (403 Forbidden) khi buổi học đã kết thúc; bắt buộc Giáo vụ/Admin cung cấp `reason`; ghi nhận kiểm toán vào `audit_logs`.
    - `cleanupOldPhotosJob`: Xóa trường `photo_url` của các bản ghi xác thực > 30 ngày, bảo toàn lịch sử dữ liệu điểm danh.
  - `AttendanceController`: Định tuyến bảo mật bằng `@UseGuards(JwtAuthGuard, RolesGuard)`.
  - `AttendanceModule`: Đăng ký vào `AppModule`.

- **Frontend Web (`apps/web`)**:
  - `apps/web/src/app/(staff)/academic/attendance/[sessionId]/page.tsx` (Màn hình S28):
    - Giao diện giáo viên mở buổi học offline: Nút kích hoạt GPS một chạm lấy tọa độ thiết bị, chọn ảnh selfie/phòng học, tự động gửi xác thực.
    - Bảng điểm danh nhanh toàn lớp: Hiển thị danh sách học sinh với các nút trạng thái có mặt (Xanh lá), Đi muộn (Vàng), Vắng phép (Xanh dương), Vắng không phép (Đỏ).
    - Modal chiếu mã QR động lên màn hình lớp học (Dynamic QR projector) cho học sinh quét.
    - Cảnh báo trực quan cho học sinh vắng 2 buổi liên tiếp.
  - `apps/web/src/app/(student)/attendance/page.tsx` (Màn hình S19):
    - Tổng quan chuyên cần: Tỷ lệ chuyên cần (%), tổng số buổi có mặt, đi muộn, nghỉ có phép, nghỉ không phép.
    - Form quét mã QR vào lớp học trực tuyến.
    - Modal nộp đơn xin nghỉ học trước buổi học kèm chọn lý do và đính kèm minh chứng.
    - Lịch sử chuyên cần chi tiết từng buổi học với nhãn trạng thái trực quan.

---

## 3. [VAI: Security/Compliance Officer] An toàn dữ liệu & Kiểm toán
- **Bảo mật mã QR chống gian lận**:
  - QR nonce 32 ký tự ngẫu nhiên duy nhất sinh theo phiên (`session_qr_tokens`), có thời gian sống ngắn, chặn hoàn toàn hành vi gửi ảnh chụp màn hình qua mạng xã hội.
  - Token được gắn chặt với `session_id`, ngăn chặn hành vi dùng QR của lớp khác.
- **Ranh giới địa lý (Geo-fencing) & Haversine**:
  - Thuật toán Haversine tính toán khoảng cách cầu chính xác từng mét.
  - Chặn giáo viên gian lận điểm danh từ xa, đồng thời cung cấp quy trình dự phòng minh bạch khi sự cố GPS xảy ra.
- **Tuân thủ quy định bảo vệ dữ liệu cá nhân (PDPA) & Tối ưu lưu trữ**:
  - Ảnh điểm danh chỉ là bằng chứng xác thực tạm thời, tự động thu hồi/dọn dẹp sau 30 ngày để tôn trọng quyền riêng tư học sinh và giáo viên.
- **Kiểm toán bất biến (Audit Logging)**:
  - Mọi thao tác sửa điểm danh sau buổi học đều bị khóa với giáo viên và bắt buộc ghi nhận giải trình vào `audit_logs` khi Giáo vụ thực hiện.

---

## 4. [VAI: QA/Tester] Kết quả kiểm thử tự động
- **Suite E2E Step 6 (`test/attendance.e2e-spec.ts`)**: **16/16 test cases ĐẠT 100%**:
  - `TC-051 (Điểm danh nhanh toàn lớp)`: Điểm danh mặc định có mặt, đổi trạng thái và lưu thành công -> **ĐẠT**
  - `TC-052 (Chặn QR của buổi khác)`: Trả về 400 Bad Request -> **ĐẠT**
  - `TC-053 (Chặn QR hết hạn)`: Trả về 400 Bad Request -> **ĐẠT**
  - `TC-054 (Mở buổi offline trong bán kính GPS)`: Xác thực thành công `qr_offline` -> **ĐẠT**
  - `TC-055 (Ngoài bán kính GPS)`: Từ chối và gợi ý điểm danh thủ công -> **ĐẠT**
  - `TC-056 (Từ chối cấp quyền GPS)`: Từ chối và gợi ý điểm danh thủ công -> **ĐẠT**
  - `TC-057 (Tác vụ dọn dẹp ảnh 30 ngày)`: Xóa ảnh cũ, bảo toàn bản ghi check-in -> **ĐẠT**
  - `TC-058 (Học sinh quét QR trong 15 phút đầu)`: Ghi nhận `present` -> **ĐẠT**
  - `TC-059 (Học sinh quét QR sau 15 phút)`: Ghi nhận `late` -> **ĐẠT**
  - `TC-060 (Thông báo phụ huynh)`: Cập nhật `guardian_notified_at` -> **ĐẠT**
  - `TC-062 (Cấu hình thông báo vắng mặt bắt buộc)`: Kiểm tra cấu hình `mandatory` -> **ĐẠT**
  - `TC-063 (Đơn xin nghỉ học trước buổi)`: Tự động ghi nhận `excused` -> **ĐẠT**
  - `TC-064 (Giáo viên bị chặn sửa điểm danh sau buổi)`: Trả về 403 Forbidden -> **ĐẠT**
  - `TC-064 (Giáo vụ sửa điểm danh kèm lý do)`: Lưu vết kiểm toán vào `audit_logs` -> **ĐẠT**
  - `TC-065 (Cảnh báo vắng 2 buổi liên tiếp)`: Kích hoạt cờ cảnh báo giáo vụ/giáo viên -> **ĐẠT**

- **Toàn bộ hệ thống E2E (`pnpm test:e2e`)**: **6/6 Suites - 68/68 Tests PASSED (100%)**:
  1. `health.e2e-spec.ts`: PASSED
  2. `auth-rbac.e2e-spec.ts`: PASSED
  3. `public-leads.e2e-spec.ts`: PASSED
  4. `ai-chatbot.e2e-spec.ts`: PASSED
  5. `academic.e2e-spec.ts`: PASSED
  6. `attendance.e2e-spec.ts`: PASSED
- **Web Build (`pnpm --filter @corelink/web build`)**: **18/18 routes compiled successfully (Exit Code 0)**.
