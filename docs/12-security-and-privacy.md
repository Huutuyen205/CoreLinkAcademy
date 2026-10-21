# 12 — Bảo mật và quyền riêng tư

Không có hệ thống nào an toàn tuyệt đối; tài liệu này nêu các biện pháp đã chọn và rủi ro còn lại.

## 1. Tài sản cần bảo vệ
Thông tin liên hệ phụ huynh (lead, user), dữ liệu học sinh vị thành niên (điểm, chuyên cần), tài khoản Admin, đáp án bài tập trước khi công bố.

## 2. Threat model (rút gọn)

| ID | Mối đe dọa | Biện pháp |
|---|---|---|
| T-01 | Spam form học thử / làm đầy DB | Rate limit theo IP trong DB (BR-002), honeypot, giới hạn độ dài trường |
| T-02 | Dò mật khẩu | Argon2id, khóa 15 phút sau 5 lần sai, thông báo lỗi chung |
| T-03 | Đánh cắp phiên | Token ngẫu nhiên 32 byte, DB chỉ lưu sha256; cookie `httpOnly`, `SameSite=Lax`, `Secure` ở production; hết hạn 7 ngày; đăng xuất xóa bản ghi |
| T-04 | IDOR (đổi ID trên URL để xem lớp/con người khác) | Policy phạm vi dữ liệu trên server cho mọi đọc/ghi; trả 404 |
| T-05 | Server Action bị gọi trực tiếp không qua UI | Mỗi action tự kiểm tra phiên + vai trò + phạm vi; không tin tham số ẩn |
| T-06 | Lộ đáp án trước công bố | Hàm `toStudentQuestion()` loại bỏ trường đáp án; chỉ trả đáp án khi `resultsPublishedAt` có giá trị |
| T-07 | CSRF | Server Actions chỉ nhận POST + kiểm tra Origin của Next.js; cookie SameSite=Lax |
| T-08 | XSS | React escape mặc định; không dùng `dangerouslySetInnerHTML` với dữ liệu người dùng |
| T-09 | Học sinh tự sửa điểm/nộp lại | Không có action nào cho học sinh ghi điểm; nộp là một chiều (BR-045) |
| T-10 | Mất quyền Admin cuối cùng | Admin không tự khóa/hạ vai trò |
| T-11 | Lộ secret | Chỉ đọc từ `.env`; `.env` trong `.gitignore`; không in secret ra log |

## 3. Header bảo mật
`next.config.ts` đặt: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. CSP chi tiết: Pha 2 (QUESTION-Q05).

## 4. Riêng tư
- Form học thử có ô đồng ý liên hệ bắt buộc, lưu thời điểm đồng ý trong hoạt động CREATED.
- Thu thập tối thiểu: không hỏi ngày sinh, địa chỉ, trường học của trẻ.
- Thời hạn lưu lead LOST: TBD (QUESTION-Q03); đề xuất 12 tháng.

## 5. Kiểm tra trước release
Xem [18-release-checklist.md](18-release-checklist.md).
