# KẾ HOẠCH BƯỚC 2: XÁC THỰC, TÀI KHOẢN, PHÂN QUYỀN (M02)

## 1. [VAI: BA] Danh sách User Story & Tiêu chí chấp nhận
- **US-01 (FR-201, FR-207)**: Đăng nhập đa kênh (SĐT/email/username) + Argon2id + Access Token (15p) + Refresh Token xoay vòng trong cookie httpOnly.
- **US-02 (FR-201)**: Mật khẩu tạm hết hạn sau 72 giờ; bắt buộc đổi mật khẩu lần đầu (`must_change_password`).
- **US-03 (FR-207)**: Khóa 15 phút sau 5 lần đăng nhập sai (`failed_login_count`, `locked_until`).
- **US-04 (FR-207)**: Quên mật khẩu qua token một lần (30 phút, `password_resets`), hỗ trợ 2FA TOTP cho Admin.
- **US-05 (FR-202)**: Liên kết phụ huynh - học sinh (tối đa 4 phụ huynh, 3 cờ quyền bật/tắt riêng: `can_view_results`, `can_message`, `receives_fee_notice`).
- **US-06 (FR-206, A6.1)**: Phân quyền 2 lớp bắt buộc:
  - Lớp 1: RoleGuard (`@Roles(RoleCode.ADMIN, ...)`) dựa vào `user_roles` và `role_permissions`.
  - Lớp 2: ScopePolicy (`@Scope()`) kiểm tra phạm vi dữ liệu:
    - Teacher: chỉ lớp trong `class_teachers` hoặc buổi mình dạy.
    - Guardian: chỉ học sinh trong `guardianships` và quyền tương ứng.
    - Student: chỉ dữ liệu của chính mình.
    - Staff: theo `branch_id`.
    - Sai phạm vi: trả 403 Forbidden.
- **US-07 (FR-208)**: Tài khoản học sinh nhỏ (`is_young_account=1` hoặc học sinh dưới lớp 6): chặn API nhắn tin riêng.
- **US-08 (FR-209)**: Bản ghi đồng ý dữ liệu (`consents`, scope `data_processing`), rút đồng ý cập nhật `withdrawn_at`.

## 2. [VAI: TECH LEAD] Thiết kế Endpoints & DTOs
- `POST /api/v1/auth/login`: `{ credential, password, twoFactorCode? }` -> Set-Cookie refreshToken, trả `{ accessToken, user }`.
- `POST /api/v1/auth/refresh`: Đọc cookie refreshToken -> Xoay vòng token trong bảng `refresh_tokens` -> Trả `{ accessToken }`.
- `POST /api/v1/auth/logout`: Thu hồi refresh token của thiết bị hiện tại hoặc mọi thiết bị (`revoked_at`).
- `POST /api/v1/auth/password/change`: `{ currentPassword, newPassword }` -> Đổi mật khẩu, tắt `must_change_password`.
- `POST /api/v1/auth/password/forgot`: `{ email }` -> Tạo bản ghi `password_resets`, gửi link reset (mailpit/log).
- `POST /api/v1/auth/password/reset`: `{ token, newPassword }` -> Đặt lại mật khẩu.
- `GET /api/v1/auth/me`: Lấy thông tin user hiện tại kèm roles, permissions, consents.
- `POST /api/v1/me/consents`: Ghi nhận đồng ý xử lý dữ liệu.
- `POST /api/v1/me/consents/withdraw`: Rút đồng ý xử lý dữ liệu.
- `GET /api/v1/users`: [Admin/Academic] Danh sách người dùng, lọc vai trò, tìm kiếm.
- `POST /api/v1/users`: [Admin/Academic] Tạo tài khoản mới, sinh mật khẩu tạm 72h.
- `PATCH /api/v1/users/:id`: [Admin] Sửa thông tin / khóa tài khoản.
- `POST /api/v1/students/:id/guardians`: [Admin] Liên kết phụ huynh với học sinh kèm cờ quyền.
- `PATCH /api/v1/guardianships/:id`: [Admin] Cập nhật 3 cờ quyền của phụ huynh.
- `GET /api/v1/roles`: [Admin] Danh sách vai trò và quyền hạn.

## 3. Phân công triển khai
- [DEV BACKEND]:
  - `apps/api/src/modules/auth`: AuthService, AuthController, JwtStrategy, LocalStrategy, RolesGuard, ScopeGuard, decorators `@Roles`, `@CurrentAuth`, `@Scope`.
  - `apps/api/src/modules/users`: UsersService, UsersController, DTOs validate Zod/class-validator.
  - Script `pnpm seed:admin` khởi tạo Admin đầu tiên.
  - Test suites: Auth unit test, RBAC unit test, bộ test truy cập chéo tự động cho TC-024..TC-038.
- [DEV FRONTEND]:
  - Màn hình S07 (Đăng nhập, Quên mật khẩu, Đổi mật khẩu lần đầu).
  - Màn hình S08 (Hồ sơ người dùng, Đổi mật khẩu, Điều khoản đồng ý dữ liệu).
  - Màn hình S43 (Admin Quản lý tài khoản, gán vai trò, phân quyền).
- [REVIEWER BẢO MẬT]:
  - Kiểm tra Argon2id hashing parameters.
  - Kiểm tra cookie httpOnly + Secure + SameSite=Lax.
  - Kiểm tra kiểm soát truy cập chéo 100% trả 403.
