# UC-001: Đăng ký học thử

- **Status:** Approved (baseline 3.1) · **Version:** 1.1 · **Owner:** BA (trợ lý) · **Approver:** chủ dự án
- **Related requirements:** FR-004, FR-005 · BR-001, BR-002, BR-004
- **Related features:** FEAT-004, FEAT-005 · **Channel:** Web công khai
- **Primary actor:** Khách (phụ huynh tiềm năng) · **Supporting:** Hệ thống (rate limit), Staff (nhận lead)
- **Priority:** P0

## 1. Goal and success outcome
Phụ huynh để lại thông tin trong ≤ 2 phút trên điện thoại; học viện có một lead để gọi lại, không trùng lặp.

## 2. Preconditions
- Có ít nhất một môn trong `subjects`.
- Không yêu cầu đăng nhập.

## 3. Trigger
Khách mở `/dang-ky-hoc-thu` (từ header "Học thử", nút trang chủ, hoặc "Đăng ký học thử khóa này" ở trang khóa với `?khoa=<slug>`) và bấm "Gửi đăng ký".

## 4. Main success flow
1. Hệ thống hiển thị form 2 nhóm: *Thông tin phụ huynh* (họ tên*, SĐT*, email), *Thông tin học sinh* (họ tên*, khối*, môn quan tâm*, khóa, ghi chú) và ô đồng ý liên hệ*.
2. Khách nhập thông tin, tích đồng ý, bấm "Gửi đăng ký". Nút chuyển "Đang gửi…" và bị khóa.
3. Hệ thống kiểm tra honeypot (trống), rate limit IP (≤ 5 lần/10 phút).
4. Hệ thống validate và chuẩn hóa SĐT (`0912 345 678` → `+84912345678`).
5. Hệ thống tìm lead đang mở cùng SĐT → không có.
6. Hệ thống tạo lead `NEW` (nguồn `web_form`) + hoạt động `CREATED` ghi thời điểm đồng ý, trong một transaction.
7. Hệ thống chuyển tới `/dang-ky-hoc-thu/cam-on`: "Cảm ơn quý phụ huynh … Trung tâm sẽ liên hệ lại trong thời gian sớm nhất…".

## 5. Alternate flows
### A1 — Vào từ trang chi tiết khóa
1. Ở bước 1, `?khoa=<slug>` là khóa đã xuất bản → chọn sẵn môn và khóa đó. Slug sai/ẩn → bỏ qua, form trống.
### A2 — Trùng lead đang mở (bước 5)
1. Có lead cùng SĐT trạng thái NEW/CONTACTED/TRIAL_SCHEDULED/TRIAL_DONE → thêm hoạt động `RESUBMITTED` (toàn bộ nội dung form mới) vào lead mới nhất, cập nhật `updatedAt`; không tạo lead.
2. Tiếp tục bước 7 (khách không biết là trùng).
### A3 — Lead cũ đã ENROLLED hoặc LOST
1. Không coi là trùng → tạo lead mới (bước 6).
### A4 — Lọc khóa theo môn
1. Khi khách đổi "Môn quan tâm", danh sách "Khóa học" chỉ còn khóa của môn đó (phía client; server vẫn kiểm tra).

## 6. Exception / failure flows
### E1 — Dữ liệu không hợp lệ
- **Hệ thống:** không lưu; trả `fieldErrors` + giá trị đã nhập.
- **Người dùng thấy:** Alert "Vui lòng kiểm tra lại các ô được đánh dấu." và lỗi dưới ô (vd. "Số điện thoại di động Việt Nam không hợp lệ.", "Bạn cần đồng ý để học viện liên hệ tư vấn.").
- **Phục hồi:** sửa ô và gửi lại.
### E2 — Quá rate limit (lần thứ 6 trong 10 phút từ một IP)
- Alert "Bạn đã gửi quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút."; giữ giá trị; không lưu.
### E3 — Honeypot có giá trị (bot)
- Chuyển trang cảm ơn, không lưu, không tăng bộ đếm.
### E4 — Môn không tồn tại (sửa HTML)
- Lỗi ô môn "Chọn môn quan tâm." (`INVALID_SUBJECT`).
### E5 — Lỗi DB
- Trang "Đã có lỗi xảy ra"; không có lead nửa vời (transaction).

## 7. Business rules and validations
- BR-001 chuẩn hóa SĐT · BR-002 rate limit · BR-004 lead đang mở.
- Độ dài: tên 2–120, email ≤ 191, ghi chú ≤ 1000, khối 1..12.

## 8. Permissions and data effects
- **Đọc:** subjects, courses (đã xuất bản). **Ghi:** leads, lead_activities, rate_limit_buckets.
- **Ownership:** không có.
- **Trạng thái:** lead mới = NEW.
- **Thông báo/sự kiện:** không (Pha 1). Lead xuất hiện ở `/quan-ly/lead` và tăng ô "Lead mới".

## 9. Postconditions
- **Thành công:** đúng một lead đang mở cho SĐT đó, có ≥ 1 hoạt động.
- **Thất bại:** DB không đổi (trừ bucket rate limit ở E1/E2).

## 10. Non-functional constraints
360px không cuộn ngang; mọi ô có nhãn; `autoComplete` name/tel/email; `inputMode="tel"`; không log dữ liệu form.

## 11. UI/API/data references
SCREEN-004, SCREEN-005 · API-001 · ENT-011, ENT-012, ENT-018.

## 12. Acceptance criteria / test scenarios
- Given không có lead SĐT `+84912345678`, When gửi `0912.345.678`, Then 1 lead NEW phone `+84912345678` (TC-001, TC-003).
- Given lead TRIAL_SCHEDULED cùng SĐT, When gửi lại, Then số lead không đổi, có thêm RESUBMITTED (TC-003).
- When không tích đồng ý, Then lỗi ô đồng ý (TC-002).
- When gửi 6 lần trong 10 phút cùng IP, Then lần 6 bị chặn (TC-004).
- UAT: hoàn thành trong ≤ 2 phút ở 360px (TC-UAT-01).

## 13. Open questions / assumptions / history
- QUESTION-Q03: thời gian lưu lead LOST.
- 2026-10-21 v1.1: tách file, bổ sung A1–A4, E3–E5.
