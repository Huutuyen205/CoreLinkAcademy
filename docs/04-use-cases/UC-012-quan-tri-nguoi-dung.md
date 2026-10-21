# UC-012: Quản trị người dùng và liên kết phụ huynh

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA + Security · **Approver:** chủ dự án
- **Related requirements:** FR-013, FR-014 · BR-006, BR-007, BR-008, BR-015, BR-051
- **Related features:** FEAT-013..FEAT-016 · **Channel:** Cổng quản lý
- **Primary actor:** Admin · **Supporting:** Staff (tạo HS/PH, liên kết) · **Priority:** P1

## 1. Goal and success outcome
Mọi người dùng có đúng một vai trò, thông tin đăng nhập duy nhất; quyền quản trị không bị mất; học sinh có phụ huynh liên kết.

## 2. Preconditions
Admin (mọi chức năng) hoặc Staff (tạo HS/PH, liên kết).

## 3. Trigger
Admin: `/quan-ly/nguoi-dung`. Staff/Admin: `/quan-ly/hoc-vien`.

## 4. Main success flow — tạo tài khoản
1. Mở "Tạo tài khoản mới" (Admin: chọn 5 vai trò; ở Học viên: chỉ Học sinh/Phụ huynh).
2. Nhập vai trò, họ tên, email và/hoặc SĐT, khối (bắt buộc khi Học sinh).
3. "Tạo tài khoản" → hệ thống sinh mật khẩu tạm, `mustChangePassword`, mã HS nếu là HS, audit `user.create`.
4. Thẻ "Mật khẩu tạm — chỉ hiển thị một lần" với họ tên (mã HS), đăng nhập, mật khẩu. Form trống lại để tạo tiếp.

## 5. Alternate flows
### A1 — Sửa thông tin (Admin, `/quan-ly/nguoi-dung/[id]`)
1. Sửa họ tên, vai trò, email, SĐT, khối → "Đã lưu thông tin.". Đổi vai trò → audit `user.role_change`, đăng xuất người đó; đổi sang HS chưa có mã → sinh mã.
2. Tài khoản của chính mình: ô vai trò chỉ có vai trò hiện tại, gợi ý "Bạn không thể tự đổi vai trò của mình."; không có thẻ "Khóa tài khoản".
### A2 — Khóa / mở khóa
1. "Khóa tài khoản" (xác nhận "Người dùng bị đăng xuất ngay.") → DISABLED, thu hồi phiên, audit `user.disable`. "Mở khóa" → ACTIVE, xóa khóa tạm, audit `user.enable`.
### A3 — Đặt lại mật khẩu
1. "Đặt lại mật khẩu" (xác nhận) → mật khẩu tạm mới, `mustChangePassword`, thu hồi phiên, audit `user.reset_password`; thẻ mật khẩu một lần.
### A4 — Liên kết phụ huynh (Học viên)
1. Mỗi HS: "Phụ huynh (n/4)", danh sách PH + "Bỏ" (xác nhận); chọn "Thêm phụ huynh" → "Liên kết" → "Đã liên kết phụ huynh.".
### A5 — Tìm/lọc
1. Người dùng: tìm tên/email/SĐT/mã HS, lọc vai trò/trạng thái, 25/trang; nhãn "Tạm khóa do sai mật khẩu". Học viên: tìm tên/mã, hiện lớp đang học và cảnh báo "chưa có email/SĐT để đăng nhập".

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Không có email và SĐT | "Cần email hoặc số điện thoại để đăng nhập." | NO_LOGIN |
| E2 | Email/SĐT trùng | "Email đã được dùng." / "Số điện thoại đã được dùng." | DUPLICATE_EMAIL / DUPLICATE_PHONE |
| E3 | HS không chọn khối | "Chọn khối lớp cho học sinh." | validate |
| E4 | Admin tự đổi vai trò / tự khóa (gửi trực tiếp) | "Bạn không thể tự đổi vai trò của chính mình." / "…tự khóa…" | CANNOT_MODIFY_SELF |
| E5 | Staff tạo ADMIN/STAFF/TEACHER (gửi trực tiếp) | 404 | Forbidden |
| E6 | PH thứ 5 | "Mỗi học sinh có tối đa 4 phụ huynh." | MAX_GUARDIANS |
| E7 | Liên kết trùng | "Phụ huynh này đã được liên kết." | ALREADY_LINKED |
| E8 | Đặt lại MK khi không có email/SĐT | "Tài khoản chưa có email/SĐT. Hãy bổ sung trước khi đặt lại mật khẩu." | NO_LOGIN |
| E9 | Staff mở `/quan-ly/nguoi-dung` | Chuyển về `/quan-ly` | — |

## 7. Business rules and validations
BR-006, BR-007, BR-008, BR-015 (mật khẩu tạm), BR-051 (bảo vệ Admin, thu hồi phiên).

## 8. Permissions and data effects
`user.manage`, `user.createLearner`, `guardian.manage`. Ghi: users, sessions (xóa), guardianships, audit_logs. Không xóa cứng user (khóa thay cho xóa).

## 9. Postconditions
Email, SĐT, mã HS duy nhất; luôn còn ít nhất Admin đang thao tác.

## 10. Non-functional constraints
Mật khẩu tạm không lưu rõ, không log; chỉ có trong response một lần.

## 11. UI/API/data references
SCREEN-016, 017, 018 · API-008, API-009 · Q-028..Q-031 · ENT-001, ENT-002, ENT-003, ENT-017.

## 12. Acceptance criteria / test scenarios
TC-036, TC-037, TC-038; TC-UAT-12.

## 13. Open questions / assumptions / history
- ASSUMPTION-A04 (Staff tạo HS/PH). Nhập tài khoản hàng loạt từ Excel: Pha 2.
