# BÁO CÁO HOÀN THÀNH BƯỚC 7: THÔNG BÁO & TRAO ĐỔI (M09, M10)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-07 | Nhánh: `step-07-messages-notif` | Trạng thái: HOÀN THÀNH 100%*

---

## 1. [VAI: BA] Business Analyst
- **User Story**:
  - *Là Phụ huynh*, tôi muốn nhắn tin trực tiếp với Giáo viên đang giảng dạy con mình kèm tệp đính kèm tài liệu/ảnh bài tập, đồng thời xem được trạng thái giáo viên đã đọc tin nhắn hay chưa (FR-901, TC-109).
  - *Là Nhà trường*, tôi muốn ngăn chặn Phụ huynh nhắn tin cho các Giáo viên không trực tiếp giảng dạy con họ để tránh làm phiền giáo viên (FR-901, TC-110).
  - *Là Quản trị viên hệ thống*, tôi muốn giới hạn dung lượng tệp đính kèm tối đa 20 MB và file ghi âm không quá 2 phút để bảo vệ băng thông và tài nguyên hệ thống (FR-901, TC-111).
  - *Là Cán bộ Pháp chế/Ban Giám hiệu*, tôi muốn toàn bộ tin nhắn trao đổi trên hệ thống KHÔNG CÓ THAO TÁC XÓA (bảo lưu dữ liệu kiểm toán phòng ngừa tranh chấp), phương thức HTTP DELETE trả về 405 Method Not Allowed (FR-902, TC-112).
  - *Là Người dùng*, tôi muốn có thể chỉnh sửa tin nhắn đã gửi trong vòng 5 phút đầu tiên; tuy nhiên toàn bộ nội dung gốc trước khi sửa phải được lưu vết tự động vào bảng `message_edits` qua Database Trigger và chặn hoàn toàn việc sửa sau 5 phút (FR-902, TC-113).
  - *Là Người dùng*, tôi muốn hệ thống tôn trọng quyền riêng tư ngoài giờ làm việc; các thông báo không khẩn gửi trong khung giờ yên tĩnh (21:00 đến 07:00 sáng hôm sau) phải được hẹn giờ tự động gửi vào 07:00 sáng (FR-1002, TC-114).
  - *Là Ban Quản lý*, tôi muốn nghiêm cấm Học sinh nhắn tin trực tiếp với Học sinh khác qua nền tảng đào tạo của trung tâm (FR-902, TC-115).
  - *Là Phụ huynh*, tôi muốn có thể nộp đơn xin xem nội dung trao đổi hỏi bài giữa con và giáo viên; sau khi Admin phê duyệt, tôi được cấp quyền xem CHỈ ĐỌC trong vòng 72 giờ và không được phép gửi tin can thiệp, toàn bộ lượt xem được ghi nhận vào `audit_logs` (FR-903, TC-116).
  - *Là Hệ thống*, tôi muốn quyền xem chỉ đọc 72 giờ của Phụ huynh tự động hết hạn và thu hồi quyền sau 72 giờ (TC-117).
  - *Là Người dùng*, tôi muốn có tính năng báo cáo tin nhắn có dấu hiệu vi phạm chuẩn mực sư phạm; ngay khi có báo cáo, Admin có thể tạm khóa cuộc hội thoại để điều tra xác minh (FR-904, TC-118).
  - *Là Giáo viên*, tôi muốn đăng thông báo lên bảng tin lớp học (không cho phép bình luận), xem danh sách học sinh/phụ huynh đã đọc, và gửi thông báo nhắc nhở một chạm tới những người chưa đọc (FR-905, TC-119).
  - *Là Người dùng*, tôi muốn đăng ký nhận thông báo Web Push trên trình duyệt Android Chrome và iPhone iOS Safari (PWA) để nhận tin tức quan trọng ngay cả khi không mở ứng dụng (FR-1001, TC-121, TC-122).
  - *Là Người dùng*, tôi muốn có nút kiểm tra thông báo thử nghiệm nhận ngay trong 30 giây (TC-123).
  - *Là Người dùng*, tôi muốn có thể bật/tắt các loại thông báo tùy chọn theo sở thích, nhưng các loại thông báo bắt buộc liên quan đến an toàn (vắng mặt không phép, đổi lịch học) bị khóa cứng không thể tắt (FR-1004, TC-124).

- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* phụ huynh có con học lớp của giáo viên, *When* gửi tin nhắn kèm ảnh 3 MB, *Then* tin nhắn được gửi thành công, giáo viên bấm đọc thì phụ huynh thấy `isRead = true` (TC-109).
  - *Given* phụ huynh gửi tin nhắn cho giáo viên không dạy con mình, *When* gọi tạo hội thoại hoặc gửi tin, *Then* hệ thống trả về 403 Forbidden (TC-110).
  - *Given* tệp đính kèm > 20 MB hoặc âm thanh > 120s, *When* gửi tin, *Then* trả về 400 Bad Request (TC-111).
  - *Given* cuộc hội thoại hoặc tin nhắn bất kỳ, *When* gọi `DELETE /api/v1/communication/messages/:id`, *Then* trả về 405 Method Not Allowed (TC-112).
  - *Given* tin nhắn được gửi trong vòng 5 phút, *When* sửa nội dung, *Then* cập nhật thành công và lưu nội dung cũ vào `message_edits`; nếu sửa sau 5 phút -> trả về 400 Bad Request (TC-113).
  - *Given* tin nhắn không khẩn gửi lúc 22:30, *When* tạo thông báo, *Then* `scheduled_for` được đặt là 07:00 sáng hôm sau (TC-114).
  - *Given* tài khoản học sinh, *When* cố tạo hội thoại với học sinh khác, *Then* trả về 403 Forbidden (TC-115).
  - *Given* đơn xin xem chat 72h của phụ huynh được Admin phê duyệt, *When* phụ huynh xem tin nhắn -> xem được ở chế độ chỉ đọc và ghi `audit_logs`; *When* phụ huynh gửi tin nhắn -> trả về 403 Forbidden (TC-116).
  - *Given* yêu cầu xem chat đã quá 72 giờ, *When* phụ huynh cố truy cập -> trả về 403 Forbidden (TC-117).
  - *Given* tin nhắn bị báo cáo, *When* Admin bấm tạm khóa hội thoại, *Then* mọi hành động gửi tin mới đều trả về 400 Bad Request (TC-118).
  - *Given* thông báo bảng tin lớp học, *When* phụ huynh bấm xác nhận đã đọc, *Then* giáo viên xem được danh sách và có thể gửi nhắc nhở tới người chưa đọc (TC-119).
  - *Given* người dùng trên Android Chrome và iOS Safari, *When* gửi endpoint Web Push, *Then* lưu vào `push_subscriptions` thành công (TC-121, TC-122).
  - *Given* người dùng bấm gửi thông báo thử nghiệm, *Then* hệ thống gửi thông báo push thành công (TC-123).
  - *Given* cấu hình thông báo, *When* người dùng tắt thông báo vắng mặt hoặc đổi lịch học, *Then* hệ thống chặn và trả về 400 Bad Request (TC-124).

---

## 2. [VAI: Tech Lead] Kiến trúc & Thiết kế kỹ thuật
- **Backend Modules**:
  1. `apps/api/src/modules/notifications`:
     - `NotificationsService`:
       - `registerPushSubscription`: Lưu thông tin VAPID Subscription (endpoint, keys p256dh, auth, device_type).
       - `createNotification`: Kiểm tra giờ yên lặng (quiet hours 21h–7h), tự động dời `scheduled_for` sang 07:00 sáng hôm sau cho thông báo không khẩn.
       - `getPreferences` & `updatePreferences`: Khóa cứng không cho tắt các loại thông báo bắt buộc (`attendance_absence`, `schedule_reschedule`).
       - `sendTestPush`: Gửi thông báo mẫu kiểm tra tới thiết bị đăng ký.
     - `NotificationsController`: Định tuyến bảo mật bằng `@UseGuards(JwtAuthGuard)`.
  2. `apps/api/src/modules/communication`:
     - `CommunicationService`:
       - `getOrCreateConversation`: RBAC chặn học sinh chat học sinh, kiểm tra phân công giảng dạy giữa giáo viên và học sinh của phụ huynh.
       - `sendMessage`: Kiểm tra giới hạn file 20 MB, kiểm tra hội thoại có bị tạm khóa không, chặn người xem chỉ đọc 72h.
       - `editMessage`: Sửa tin nhắn trong 5 phút; bắt lỗi Database Trigger `trg_messages_keep_original` và chuyển thành `BadRequestException`. Chuyển đổi `message_edits.id` kiểu `BigInt` sang `String` an toàn khi tuần tự hóa JSON.
       - `deleteMessageEndpoint`: Trả về `MethodNotAllowedException` (405).
       - `requestChatAccess` & `decideChatAccess`: Quy trình phụ huynh xin xem chat của con, Admin duyệt cấp quyền chỉ đọc trong 72 giờ, ghi nhật ký `audit_logs`.
       - `reportMessage` & `toggleConversationLock`: Báo cáo tin nhắn vi phạm, Admin tạm khóa hội thoại.
       - `createAnnouncement`, `markAnnouncementAsRead`, `getAnnouncementReaders`, `remindUnread`: Bảng tin lớp học không có chức năng bình luận, kiểm soát lượt đọc và nhắc nhở.
     - `CommunicationController`: Đăng ký đầy đủ endpoints RESTful.

- **Frontend Pages (`apps/web`)**:
  - `apps/web/src/app/notifications/page.tsx` (Màn hình S09):
    - Trung tâm thông báo: Danh sách thông báo phân loại theo tabs (Tất cả, Chưa đọc, Tin nhắn, Học tập, Điểm danh, Lịch học).
    - Bộ đếm huy hiệu thông báo chưa đọc trực quan.
    - Modal cấu hình tùy chọn thông báo: Cho phép bật/tắt nhận tin qua Push/Email, hiển thị biểu tượng ổ khóa đối với các thông báo bắt buộc.
    - Hướng dẫn cài đặt Web Push PWA cho thiết bị iOS và Android.
  - `apps/web/src/app/messages/page.tsx` (Màn hình S10):
    - Giao diện chat hiện đại: Danh sách hội thoại, tìm kiếm, đánh dấu tin nhắn khẩn cấp.
    - Khung chat trực tiếp: Đính kèm tệp tin tài liệu, hình ảnh, ghi âm giọng nói.
    - Hiển thị trạng thái "Đã xem" (Read receipts) thời gian thực.
    - Nút sửa tin nhắn trực tiếp với đồng hồ đếm ngược 5 phút và lịch sử chỉnh sửa.
    - Nút báo cáo vi phạm tiêu chuẩn và chỉ báo hội thoại bị tạm khóa.
    - Bảng tin lớp học (Bulletin board) tách biệt: Hiển thị thông báo giáo viên, nút xác nhận "Đã đọc", danh sách người đọc và nút gửi nhắc nhở một chạm.

---

## 3. [VAI: Security/Compliance Officer] An toàn dữ liệu & Kiểm toán
- **Bảo lưu dữ liệu bất biến (Immutability)**:
  - Database Trigger `trg_messages_no_delete` ngăn chặn hoàn toàn thao tác xóa tin nhắn ở tầng CSDL.
  - API DELETE trả về HTTP 405 Method Not Allowed.
- **Lưu vết chỉnh sửa tin nhắn**:
  - Trigger `trg_messages_keep_original` tự động sao lưu bản tin cũ vào `message_edits` và cưỡng chế mốc thời gian 5 phút (`TIMESTAMPDIFF(SECOND, OLD.created_at, CURRENT_TIMESTAMP(3)) <= 300`).
- **Giám sát phụ huynh xem chat 72h**:
  - Khi phụ huynh xem chat của con, hệ thống tự động ghi bản ghi bất biến vào `audit_logs` với `action = guardian_view_chat_72h`.
  - Phụ huynh chỉ có quyền `isReadOnly`, hoàn toàn bị chặn gửi tin can thiệp (HTTP 403).
- **Tuân thủ giờ làm việc & Quyền riêng tư**:
  - Tính năng Quiet Hours bảo vệ giáo viên và phụ huynh khỏi sự làm phiền lúc nửa đêm, tuân thủ đúng yêu cầu quản lý nhân sự sư phạm.

---

## 4. [VAI: QA/Tester] Kết quả kiểm thử tự động
- **Suite E2E Step 7 (`test/communication-notif.e2e-spec.ts`)**: **15/15 test cases ĐẠT 100%**:
  - `TC-109 (Phụ huynh nhắn GV dạy con kèm ảnh 3 MB, trạng thái đã xem)`: -> **ĐẠT**
  - `TC-110 (Phụ huynh bị chặn nhắn GV không dạy con -> 403)`: -> **ĐẠT**
  - `TC-111 (File > 20 MB bị từ chối -> 400)`: -> **ĐẠT**
  - `TC-112 (Không có thao tác xóa tin nhắn -> 405)`: -> **ĐẠT**
  - `TC-113 (Sửa tin trong 5 phút giữ bản gốc, chặn sau 5 phút)`: -> **ĐẠT**
  - `TC-114 (Ngoài 7h-21h tự động hẹn giờ gửi 7h sáng)`: -> **ĐẠT**
  - `TC-115 (Học sinh bị chặn nhắn học sinh -> 403)`: -> **ĐẠT**
  - `TC-116 (Phụ huynh xin xem chat 72h chỉ đọc, ghi audit_logs)`: -> **ĐẠT**
  - `TC-117 (Quyền xem tự hết hạn sau 72h -> 403)`: -> **ĐẠT**
  - `TC-118 (Báo cáo tin nhắn, Admin tạm khóa hội thoại)`: -> **ĐẠT**
  - `TC-119 (Bảng tin lớp học, phụ huynh xác nhận đọc, GV nhắc nhở)`: -> **ĐẠT**
  - `TC-121 (Đăng ký Web Push trên Android Chrome)`: -> **ĐẠT**
  - `TC-122 (Đăng ký Web Push trên iPhone iOS Safari)`: -> **ĐẠT**
  - `TC-123 (Nút gửi thông báo thử nghiệm trong 30 giây)`: -> **ĐẠT**
  - `TC-124 (Tùy chọn thông báo; khóa chặn tắt thông báo bắt buộc)`: -> **ĐẠT**

- **Toàn bộ hệ thống E2E (`pnpm test:e2e`)**: **7/7 Suites - 83/83 Tests PASSED (100%)**:
  1. `health.e2e-spec.ts`: PASSED
  2. `auth-rbac.e2e-spec.ts`: PASSED
  3. `public-leads.e2e-spec.ts`: PASSED
  4. `ai-chatbot.e2e-spec.ts`: PASSED
  5. `academic.e2e-spec.ts`: PASSED
  6. `attendance.e2e-spec.ts`: PASSED
  7. `communication-notif.e2e-spec.ts`: PASSED
- **Web Build (`pnpm --filter @corelink/web build`)**: **20/20 routes compiled successfully (Exit Code 0)**.
