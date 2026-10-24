# 25 — Thông báo đẩy trong ứng dụng (DECISION-D35, FR-048)

## 1. Giao diện

- **Desktop (≥ 1024 px)**: thanh trên cố định ở góc phải: **chuông** (bảng thả xuống 10 thông báo gần nhất, "Đánh dấu đã đọc tất cả", "Xem tất cả") và **menu người dùng** (ảnh + tên → Hồ sơ, Đổi mật khẩu, Cài ứng dụng, Đăng xuất). Thẻ tài khoản không còn ở sidebar.
- **Điện thoại**: chuông giữ trên thanh đầu; hồ sơ/đăng xuất vẫn trong ngăn menu.
- **Popup**: thông báo chưa đọc mà trình duyệt này chưa từng hiện sẽ trượt ra góc phải trên **ngay khi đăng nhập / vào trang**, không cần bấm chuông. Tối đa 4 thẻ, phần còn lại gộp "Còn N thông báo mới khác". Thẻ tự tắt sau 14 giây (dừng khi rê chuột); loại cần chú ý (`session_soon`, `overdue`, `schedule_change`, `leave_request`) giữ tới khi đóng. Bấm thẻ = đánh dấu đã đọc + mở trang liên quan.
- Trình duyệt nhớ thẻ đã hiện bằng `localStorage` (`cl_notif_seen_<userId>`); bị chặn lưu trữ thì popup có thể hiện lại, không ảnh hưởng dữ liệu.
- Thiết bị đã bật **Web Push** (FR-048 cũ) vẫn nhận thông báo hệ điều hành khi đóng web.

## 2. Cách hoạt động

`GET /api/thong-bao/moi` (cần phiên; 401 nếu chưa đăng nhập) trả `{unread, items[10]}` **chỉ của chính người gọi**. Trình duyệt gọi khi vào trang, mỗi 30 giây khi tab đang hiện, và khi quay lại tab. Mỗi lần gọi cũng kích hoạt quét "sắp đến giờ" (giới hạn 1 lần / 45 giây / tiến trình). Chưa làm realtime thật (WebSocket/SSE): độ trễ tối đa ≈ 30 giây.

## 3. Các loại thông báo

| Loại (`kind`) | Ai nhận | Khi nào | Trạng thái |
|---|---|---|---|
| `session_soon` | GV của buổi, HS, PH (gộp các con học cùng buổi) | Buổi bắt đầu trong ≤ 60 phút; bỏ qua em có đơn nghỉ đã duyệt; mỗi (người, buổi) một lần | **Mới** |
| `attendance` | HS + PH của em | Giáo viên lưu điểm danh: em mới ghi hoặc đổi trạng thái (có mặt / muộn / vắng / có phép); lưu lại y nguyên không báo lặp | **Mới** |
| `lead_new` | Admin + Staff | Có đăng ký học thử mới từ website (gửi lại cùng SĐT không báo thêm) | **Mới** |
| `schedule_reminder` | GV, HS, PH | 19:00 hằng ngày: lịch ngày mai | Có sẵn |
| `schedule_change` | GV, HS, PH của lớp | Đổi lịch, đổi phòng, dạy thay, học bù, hủy | Có sẵn |
| `assignment`, `test` | HS, PH | Giao bài / lịch kiểm tra | Có sẵn |
| `due_soon`, `overdue`, `reminder` | HS, PH | Sắp đến hạn / quá hạn / GV nhắc nộp | Có sẵn |
| `results`, `grade_update`, `solution`, `resubmit` | HS, PH | Có điểm, điểm cập nhật, có bài chữa, yêu cầu nộp lại | Có sẵn |
| `submission` | GV | HS nộp bài cần chấm | Có sẵn |
| `leave_request` / `leave_result` | GV · PH | PH gửi đơn nghỉ · kết quả duyệt | Có sẵn |
| `schedule_request` / `request_result` | Giáo vụ · GV | GV đề xuất đổi lịch · kết quả | Có sẵn |
| `evaluation`, `document`, `review`, `lesson`, `announcement` | tùy loại | Đánh giá, tài liệu, giáo án chờ duyệt, nhật ký buổi học, thông báo của trung tâm | Có sẵn |

Ý tưởng chưa làm (Pha 2, không tự code): cảnh báo vắng 2 buổi liên tiếp cho PH, nhắc đóng học phí, tắt thông báo theo loại (P2-43), nhắc GV chưa điểm danh sau giờ học, tin nhắn mới trong popup.

## 4. Vận hành

- Không cần cron để popup và "sắp đến giờ" hoạt động khi **có người đang mở web**.
- Muốn thông báo đẩy "sắp đến giờ" tới điện thoại cả khi **không ai mở web**: gọi `GET /api/cron/nhac-sap-gio` (header `Authorization: Bearer <CRON_SECRET>`) mỗi 5–10 phút bằng cron ngoài (cron-job.org, GitHub Actions…). **Chưa đăng ký trong `vercel.json`** vì gói Vercel Hobby chỉ cho cron mỗi ngày; gói Pro thêm `{"path":"/api/cron/nhac-sap-gio","schedule":"*/10 * * * *"}`.
- Chống gửi trùng: khóa tư vấn Postgres (`pg_advisory_xact_lock(48001)`) + so `kind` và `link` theo từng người.

## 5. Kiểm thử

- Unit: `reminders.test.ts` (gom người nhận, PH nhiều con, đơn nghỉ).
- Integration (Postgres local): `push-center.int.test.ts` — sắp đến giờ (GV/HS/PH, đơn nghỉ, chạy lại không trùng), điểm danh (mới/lặp/đổi), lead mới.
- Chưa kiểm thử trực quan trên trình duyệt thật (popup, bảng thả xuống, bố cục mobile) — cần PO xem thử.
