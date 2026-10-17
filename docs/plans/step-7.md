# IMPLEMENTATION PLAN: BƯỚC 7 — THÔNG BÁO & TRAO ĐỔI (M09, M10)
*Mã bước: STEP-07 | Nhánh: `step-07-messages-notif` | Trạng thái: Đang thực hiện*

---

## 1. Mục tiêu & Phạm vi
- **Module M09: Trao đổi - Tương tác**:
  - Chat 1-1: Phụ huynh–Giáo viên của con, Học sinh–Giáo viên, Phụ huynh–Giáo vụ/Tư vấn (FR-901).
  - Chặn chat học sinh–học sinh (403 Forbidden) (FR-902, TC-115).
  - Chặn phụ huynh nhắn giáo viên không dạy con mình (403 Forbidden) (FR-901, TC-110).
  - Giới hạn file đính kèm tối đa 20 MB, ghi âm tối đa 2 phút (FR-901, TC-111).
  - Quy tắc bất biến: Không xóa tin nhắn (DELETE trả 405 Method Not Allowed) (FR-902, TC-112).
  - Sửa tin nhắn trong 5 phút kể từ khi gửi: lưu phiên bản cũ vào `message_edits`; chặn sửa sau 5 phút (400 Bad Request) (FR-902, TC-113).
  - Giờ yên lặng (Quiet hours 21:00 - 07:00): tin nhắn ngoài khung giờ vẫn đến hộp thư nhưng thông báo đẩy được hẹn giờ (`scheduled_for`) lúc 07:00 sáng hôm sau (FR-902, FR-1003, TC-114).
  - Phụ huynh yêu cầu xem chat giữa Giáo viên và con (`chat_access_requests`): Admin duyệt cấp quyền chỉ đọc (read-only) trong 72 giờ; gửi thông báo cho giáo viên; phụ huynh thử gửi tin bị chặn 403; ghi nhật ký `audit_logs` (FR-903, TC-116, TC-117).
  - Báo cáo tin nhắn (`message_reports`): Admin xem đoạn hội thoại và có quyền tạm khóa chat (`conversations.locked_at`); khi hội thoại bị khóa người tham gia không thể gửi tin mới (FR-904, TC-118).
  - Bảng tin lớp (`announcements`, `announcement_reads`): Giáo viên đăng thông báo, phụ huynh và học sinh xem và bấm "đã đọc"; không có tính năng bình luận; giáo viên xem danh sách chưa đọc và có nút gửi nhắc nhở (FR-905, TC-119).
  - Tìm kiếm tin nhắn trong hội thoại, lọc file đính kèm (FR-907).

- **Module M10: Thông báo**:
  - Hai kênh: Chuông thông báo trong app (`notifications`) và Thông báo đẩy Web Push (`push_subscriptions`) (FR-1001, TC-121, TC-122).
  - Nút gửi thông báo thử (`POST /notifications/test-push`) (FR-1004, TC-123).
  - Tùy chọn bật/tắt theo loại thông báo (`notification_preferences`), chặn tắt 2 loại bắt buộc: vắng mặt (`attendance_absence`) và đổi lịch (`schedule_reschedule`) (FR-1002, TC-124).
  - Hướng dẫn cài đặt Web App PWA ra màn hình chính cho iOS Safari và Android Chrome (FR-1004).

---

## 2. Thiết kế API Endpoints

### A. Conversations & Messages (`/api/v1/communication`)
1. `GET /api/v1/communication/conversations` (Auth)
   - Lấy danh sách hội thoại của người dùng (kèm người tham gia, tin nhắn cuối, số tin chưa đọc).
2. `POST /api/v1/communication/conversations` (Auth)
   - Tạo hoặc lấy hội thoại 1-1. Body: `{ recipientId, studentId?, kind }`.
   - Validate RBAC: Phụ huynh chỉ nhắn GV đang dạy con; Học sinh không nhắn học sinh; v.v.
3. `GET /api/v1/communication/conversations/:id/messages` (Auth)
   - Lấy lịch sử tin nhắn trong hội thoại, kiểm tra quyền truy cập (thành viên hoặc phụ huynh có quyền 72h).
4. `POST /api/v1/communication/conversations/:id/messages` (Auth)
   - Gửi tin nhắn. Body: `{ body, attachments?, isUrgent? }`.
   - Validate: File <= 20 MB; Không gửi vào hội thoại đang bị khóa (`locked_at`); Phụ huynh chỉ đọc (72h) không được gửi (403).
5. `PATCH /api/v1/communication/messages/:id` (Auth)
   - Sửa tin nhắn trong 5 phút. Body: `{ body }`. Lưu bản gốc vào `message_edits`.
6. `DELETE /api/v1/communication/messages/:id` (Auth)
   - Trả về HTTP 405 Method Not Allowed (Quy tắc không xóa tin nhắn).
7. `POST /api/v1/communication/conversations/:id/read` (Auth)
   - Đánh dấu đã xem tin nhắn trong hội thoại (`conversation_participants.last_read_at`).
8. `POST /api/v1/communication/messages/:id/report` (Auth)
   - Báo cáo tin nhắn không phù hợp. Body: `{ reason }`. Lưu `message_reports`.
9. `POST /api/v1/communication/admin/conversations/:id/lock` (Admin/Staff)
   - Tạm khóa hoặc mở khóa hội thoại.
10. `POST /api/v1/communication/chat-access-requests` (Guardian)
    - Phụ huynh gửi đơn xin xem chat của con. Body: `{ studentId, conversationId, reason }`.
11. `POST /api/v1/communication/chat-access-requests/:id/decide` (Admin/Staff)
    - Phê duyệt / Từ chối đơn. Nếu duyệt: cấp hạn 72h (`expires_at = now + 72h`), thông báo giáo viên.

### B. Class Bulletin Board (`/api/v1/communication/announcements`)
1. `GET /api/v1/communication/classes/:classId/announcements` (Auth)
   - Lấy danh sách bài đăng bảng tin của lớp.
2. `POST /api/v1/communication/classes/:classId/announcements` (Teacher/Staff)
   - Đăng thông báo mới vào bảng tin lớp.
3. `POST /api/v1/communication/announcements/:id/read` (Auth)
   - Học sinh / Phụ huynh bấm "đã đọc". Lưu `announcement_reads`.
4. `GET /api/v1/communication/announcements/:id/readers` (Teacher/Staff)
   - Giáo viên xem danh sách đã đọc và chưa đọc.
5. `POST /api/v1/communication/announcements/:id/remind` (Teacher/Staff)
   - Gửi thông báo nhắc lại cho những người chưa đọc.

### C. Notifications & Web Push (`/api/v1/notifications`)
1. `GET /api/v1/notifications` (Auth)
   - Lấy danh sách thông báo của người dùng (kèm phân trang, lọc theo category, trạng thái đọc).
2. `PATCH /api/v1/notifications/:id/read` (Auth)
   - Đánh dấu đã đọc 1 thông báo hoặc toàn bộ.
3. `GET /api/v1/notifications/preferences` (Auth)
   - Lấy cấu hình bật/tắt nhận thông báo theo loại.
4. `PUT /api/v1/notifications/preferences` (Auth)
   - Cập nhật cấu hình: `{ category, pushOn }`. Chặn tắt với loại bắt buộc (vắng mặt, đổi lịch).
5. `POST /api/v1/notifications/push-subscription` (Auth)
   - Đăng ký thiết bị Web Push. Body: `{ endpoint, p256dh, auth, userAgent }`.
6. `POST /api/v1/notifications/test-push` (Auth)
   - Nút gửi thông báo thử nghiệm tới thiết bị.

---

## 3. Cấu trúc mã nguồn sẽ tạo
- **Backend API**:
  - `apps/api/src/modules/communication/communication.service.ts`
  - `apps/api/src/modules/communication/communication.controller.ts`
  - `apps/api/src/modules/communication/communication.module.ts`
  - `apps/api/src/modules/communication/dto/index.ts`
  - `apps/api/src/modules/notifications/notifications.service.ts`
  - `apps/api/src/modules/notifications/notifications.controller.ts`
  - `apps/api/src/modules/notifications/notifications.module.ts`
  - Đăng ký `CommunicationModule` và `NotificationsModule` vào `AppModule`.
- **Frontend Web**:
  - `apps/web/src/app/(portal)/notifications/page.tsx` (Màn hình S09: Trung tâm thông báo)
  - `apps/web/src/app/(portal)/messages/page.tsx` (Màn hình S10: Hội thoại tin nhắn, gửi file, ghi âm, bảng tin lớp, PWA push setup)
- **E2E Test Suite**:
  - `apps/api/test/communication-notif.e2e-spec.ts`: Bao phủ toàn bộ 16 test cases (TC-109..124).
