# KẾ HOẠCH BƯỚC 6: ĐIỂM DANH QR & XÁC THỰC BUỔI HỌC (M04)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-06 | Nhánh: `step-06-attendance`*

---

## 1. Mục tiêu & Phạm vi
- **Mã FR**: FR-401, FR-402, FR-403, FR-404, FR-405, FR-406, FR-408, FR-409
- **Mã TC**: TC-051..TC-065 (15 test cases)
- **Màn hình**:
  - `S28`: Giao diện Điểm danh lớp học dành cho Giáo viên (chiếu QR, Quick Attendance, camera chụp ảnh lớp, GPS verification, điểm danh thủ công chờ duyệt).
  - `S19`: Giao diện Điểm danh & Đơn xin nghỉ dành cho Học sinh & Phụ huynh (quét QR online, xem lịch sử chuyên cần, nộp đơn xin nghỉ trước buổi).
- **Cơ sở dữ liệu**:
  - `attendance`: `session_id`, `student_id`, `status` (`present`, `late`, `excused`, `absent`), `method` (`teacher`, `qr_student`, `online_link`, `absence_request`, `system`), `checkin_at`, `note`, `recorded_by`, `guardian_notified_at`.
  - `session_qr_tokens`: `session_id`, `kind` (`offline`, `online`), `nonce`, `valid_from`, `valid_until`.
  - `teacher_checkins`: `session_id`, `teacher_id`, `qr_token_id`, `photo_file_id`, `latitude`, `longitude`, `distance_m`, `result`, `manual_reason`, `reviewed_by`.
  - `absence_requests`: `session_id`, `student_id`, `requested_by`, `reason`.
  - `audit_logs`: Ghi nhận chỉnh sửa điểm danh sau buổi của Giáo vụ/Admin.

---

## 2. Thiết kế chi tiết
### 2.1. Backend API (`apps/api/src/modules/attendance`)
- `AttendanceModule`:
  - `AttendanceService`:
    - `generateSessionQr(sessionId, kind)`: Sinh nonce ngẫu nhiên 32 ký tự, hạn 10 phút cho offline và 30 phút cho online; lưu `session_qr_tokens`.
    - `verifyTeacherCheckin(sessionId, teacherId, data)`:
      - Kiểm tra QR token: đúng buổi học (`fk_qr_session`) và còn hạn (`valid_until >= now`).
      - Tính khoảng cách GPS theo công thức Haversine giữa tọa độ giáo viên và tọa độ `branches`.
      - So sánh với `checkin_radius_m` của cơ sở (mặc định 150m).
      - Xử lý ảnh chụp lớp: lưu thông tin file.
      - Nếu trong bán kính: `result = accepted`, cập nhật `class_sessions.verified_at = now()`, `verify_method = qr_photo_geo`.
      - Nếu ngoài bán kính: `result = rejected_distance`.
      - Nếu không có tọa độ: `result = rejected_no_location`.
    - `requestManualTeacherCheckin(sessionId, teacherId, reason)`: Gửi yêu cầu điểm danh thủ công kèm lý do, lưu `result = manual_pending`.
    - `approveManualTeacherCheckin(actorId, checkinId)`: Giáo vụ duyệt, cập nhật `result = manual_approved`, `class_sessions.verified_at = now()`, `verify_method = manual_approved`.
    - `quickAttendance(actorId, sessionId, records)`: Điểm danh nhanh danh sách học sinh: mặc định `present`, lưu `attendance`. Tự động kiểm tra vắng 2 buổi liên tiếp (FR-409).
    - `studentScanQr(studentId, sessionId, nonce)`:
      - Kiểm tra QR: nếu buổi online, quét trong 15 phút đầu ghi `present`, quét sau 15 phút ghi `late`.
    - `submitAbsenceRequest(userId, dto)`: Phụ huynh/Học sinh nộp đơn xin nghỉ trước giờ bắt đầu (`starts_at`). Hệ thống tự động ghi `attendance` trạng thái `excused`, phương thức `absence_request`.
    - `correctAttendancePostSession(actorId, attendanceId, newStatus, reason)`:
      - Kiểm tra vai trò: Giáo viên bị cấm (403 Forbidden). Chỉ Admin/Academic được phép.
      - Bắt buộc nhập `reason`.
      - Ghi log kiểm toán `audit_logs` (before_data, after_data, reason).
    - `cleanupOldPhotosJob()`: Xóa các file ảnh điểm danh có tuổi thọ > 30 ngày (TC-057).
    - `checkConsecutiveAbsences(studentId, currentSessionId)`: Kiểm tra xem học sinh có bị vắng 2 buổi liền kề trong cùng lớp không để bắn cảnh báo.
  - `AttendanceController`: `@Controller('attendance')` bảo vệ bằng JWT và Roles.

### 2.2. Frontend Web (`apps/web`)
- `apps/web/src/app/(staff)/academic/attendance/[sessionId]/page.tsx` (Màn hình S28):
  - Chiếu mã QR động cho học sinh quét.
  - Xác thực giáo viên: nút chụp ảnh lớp (Camera preview) + Nút định vị GPS (Geolocation API) + Quét mã QR phòng.
  - Bảng danh sách học sinh: nút gạt "Có mặt" / "Vắng" / "Đi muộn" / "Nghỉ có phép" 1-click.
  - Nút lưu điểm danh nhanh hoàn thành dưới 30s.
- `apps/web/src/app/(student)/attendance/page.tsx` (Màn hình S19):
  - Danh sách buổi học và chuyên cần của học sinh / con em.
  - Form xin nghỉ học trực tuyến: chọn buổi, nhập lý do xin nghỉ.
  - Quét QR check-in online cho học sinh.

### 2.3. Kiểm thử tự động E2E (`apps/api/test/attendance.e2e-spec.ts`)
- Đảm bảo phủ 100% các tiêu chí từ TC-051 đến TC-065.
