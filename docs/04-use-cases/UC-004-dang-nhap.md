# UC-004: Đăng nhập, đăng xuất, đổi mật khẩu

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA + Security · **Approver:** chủ dự án
- **Related requirements:** FR-010, FR-011, FR-012 · BR-005, BR-006, BR-009
- **Related features:** FEAT-010..FEAT-012 · **Channel:** Web
- **Primary actor:** Mọi người dùng có tài khoản · **Priority:** P0

## 1. Goal and success outcome
Người dùng vào đúng cổng của vai trò mình một cách an toàn; tài khoản mới buộc đổi mật khẩu tạm.

## 2. Preconditions
Có tài khoản ACTIVE với email hoặc SĐT.

## 3. Trigger
Mở `/dang-nhap` (nút "Đăng nhập" ở header) hoặc bị chuyển tới khi vào trang nội bộ chưa đăng nhập.

## 4. Main success flow
1. Form: "Email hoặc số điện thoại", "Mật khẩu"; ghi chú "Quên mật khẩu? Vui lòng liên hệ quản trị viên…".
2. Người dùng nhập, bấm "Đăng nhập" (nút "Đang đăng nhập…").
3. Hệ thống kiểm tra rate limit IP (BR-009), tìm user (email viết thường hoặc SĐT chuẩn hóa), kiểm tra khóa tạm, kiểm tra mật khẩu (Argon2id), kiểm tra ACTIVE và vai trò không phải STAFF (STAFF đã bỏ theo DECISION-D35).
4. Đặt lại bộ đếm sai, tạo phiên 7 ngày, đặt cookie `cl_session`.
5. Chuyển tới `/quan-ly` (ADMIN), `/giao-vien`, `/hoc-sinh` hoặc `/phu-huynh`.

## 5. Alternate flows
### A1 — Mật khẩu tạm (`mustChangePassword`)
1. Bước 5 chuyển `/doi-mat-khau` với Alert "Bạn đang dùng mật khẩu tạm do học viện cấp…".
2. Nhập mật khẩu hiện tại, mới (≥ 8 ký tự, có chữ và số, khác hiện tại), nhập lại → lưu, bỏ cờ, thu hồi các phiên khác, chuyển tổng quan với "Đã đổi mật khẩu.".
3. Trước khi đổi, mọi trang/action nội bộ đều chuyển về `/doi-mat-khau`.
### A2 — Đã đăng nhập mở `/dang-nhap`
1. Chuyển ngay tới tổng quan (hoặc `/doi-mat-khau`).
### A3 — Đổi mật khẩu chủ động
1. Từ "Đổi mật khẩu" ở thanh bên; thành công như A1-2; có liên kết "Quay lại trang tổng quan".
### A4 — Đăng xuất
1. Bấm "Đăng xuất" → xóa phiên trên server, xóa cookie → `/dang-nhap`.

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Ghi chú |
|---|---|---|---|
| E1 | Không có user hoặc sai mật khẩu (lần 1–4) | "Thông tin đăng nhập không đúng." | Ô email/SĐT giữ nguyên; không tiết lộ tài khoản tồn tại |
| E2 | Sai lần thứ 5 | "Bạn đã nhập sai 5 lần. Tài khoản tạm khóa 15 phút." | `lockedUntil` = now + 15' |
| E3 | Đang bị khóa tạm | "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút." | Không kiểm tra mật khẩu |
| E4 | Đúng mật khẩu nhưng DISABLED | "Tài khoản đã bị khóa. Vui lòng liên hệ học viện." | |
| E5 | > 20 lần/10 phút từ một IP | "Quá nhiều lần đăng nhập từ thiết bị này. Vui lòng thử lại sau 10 phút." | BR-009 |
| E6 | Ô trống | "Nhập email hoặc số điện thoại." / "Nhập mật khẩu." | |
| E7 | Đổi MK: sai MK hiện tại / yếu / không khớp / trùng cũ | Lỗi dưới ô tương ứng | |
| E8 | Phiên hết hạn hoặc bị thu hồi (bị khóa, đổi vai trò, đặt lại MK) | Lần truy cập kế tiếp chuyển `/dang-nhap` | |

## 7. Business rules and validations
BR-005 (khóa tạm), BR-006 (độ mạnh), BR-009 (rate limit IP). Identifier ≤ 191, mật khẩu ≤ 128.

## 8. Permissions and data effects
- Ghi: users (`failedLoginCount`, `lockedUntil`, `passwordHash`, `mustChangePassword`), sessions (tạo/xóa), rate_limit_buckets.
- Không audit đăng nhập (Pha 1) — xem QUESTION-Q05.

## 9. Postconditions
Thành công: đúng một phiên mới; cookie httpOnly. Thất bại: không có phiên.

## 10. Non-functional constraints
Cookie `httpOnly`, `SameSite=Lax`, `Secure` ở production; DB chỉ lưu sha256(token); phép băm giả khi không có user để thời gian phản hồi tương đương.

## 11. UI/API/data references
SCREEN-006, 007 · API-005, 006, 007 · ENT-001, ENT-002, ENT-018.

## 12. Acceptance criteria / test scenarios
TC-009 (đăng nhập 5 vai trò), TC-010 (khóa sau 5 lần), TC-011 (mật khẩu yếu), TC-012 (`mustChangePassword`), TC-043 (rate limit IP), TC-046 (giữ ô email/SĐT).

## 13. Open questions / assumptions / history
- Quên mật khẩu qua email: Pha 2. QUESTION-Q05: audit đăng nhập/giám sát.
- v1.1: thêm E5 (BR-009), giữ giá trị identifier.
