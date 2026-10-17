# BÁO CÁO WALKTHROUGH BƯỚC 2: XÁC THỰC, TÀI KHOẢN, PHÂN QUYỀN (M02)

## 1. [VAI: TECH LEAD] Phạm vi bước
- **Mã yêu cầu**: M02: FR-201 đến FR-209.
- **Màn hình**: S07 (Đăng nhập, đổi mật khẩu lần đầu, quên mật khẩu), S08 (Hồ sơ người dùng, đồng ý dữ liệu, hướng dẫn PWA), S43 (Quản trị tài khoản, phân quyền, khóa tài khoản).
- **Test case**: 15 test cases từ TC-024 đến TC-038.
- **Ý tưởng gốc B7**: Dòng 2 (Admin quản lý tài khoản), Dòng 20 (Hồ sơ học sinh, giáo viên).

## 2. Thiết kế tóm tắt
- **Cơ chế xác thực (A6.2)**:
  - Đăng nhập đa kênh: Số điện thoại (tự chuẩn hóa `+84...`), Email hoặc Username.
  - Mã hóa mật khẩu: Argon2id.
  - Access Token (15 phút) + Refresh Token xoay vòng (30 ngày) lưu băm SHA-256 trong bảng `refresh_tokens`, cookie HttpOnly, SameSite=Lax.
  - Tạm khóa 15 phút sau 5 lần nhập sai (`failed_login_count`, `locked_until`).
  - Mật khẩu tạm thời có thời hạn 72 giờ (`temp_password_expires_at`), bắt buộc đổi lần đầu (`must_change_password`).
  - Hỗ trợ 2FA TOTP cho tài khoản Quản trị viên (Admin).
  - Quên mật khẩu qua token dùng 1 lần hết hạn 30 phút (`password_resets`).
- **Phân quyền 2 lớp bắt buộc (A6.1)**:
  - **Lớp 1 (RolesGuard)**: Dựa trên vai trò `@Roles()` và bảng `user_roles`, `role_permissions`.
  - **Lớp 2 (ScopeGuard)**: Kiểm tra phạm vi dữ liệu `@Scope()`:
    - Giáo viên: Chỉ được truy cập lớp/học sinh mình được phân công trong `class_teachers` hoặc buổi mình dạy.
    - Phụ huynh: Chỉ truy cập học sinh thuộc quyền giám hộ trong `guardianships` và tôn trọng 3 cờ quyền (`can_view_results`, `can_message`, `receives_fee_notice`).
    - Học sinh: Chỉ xem dữ liệu của chính mình.
    - Học sinh nhỏ (`is_young_account` hoặc dưới lớp 6): Bị chặn toàn bộ API tạo hội thoại nhắn tin riêng (FR-208).
    - Sai phạm vi: Lập tức trả lỗi **403 Forbidden**, không tiết lộ thông tin bản ghi.
- **Đồng ý dữ liệu (FR-209)**:
  - Bảng `consents`: Ghi nhận đồng ý xử lý dữ liệu theo Luật Bảo vệ dữ liệu cá nhân 2025. Rút đồng ý cập nhật `withdrawn_at` và ghi `audit_logs`.
- **Khởi tạo Admin**: Script `pnpm seed:admin` khởi tạo tài khoản quản trị đầu tiên.

## 3. Cây thư mục hoàn thành
```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── decorators/ (roles.decorator.ts, scope.decorator.ts, current-user.decorator.ts)
│   │   │   ├── guards/ (jwt-auth.guard.ts, roles.guard.ts, scope.guard.ts)
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   └── jwt.strategy.ts
│   │   └── users/
│   │       ├── users.service.ts
│   │       ├── users.controller.ts
│   │       └── users.module.ts
│   └── seed/
│       └── seed-admin.ts
└── test/
    ├── health.e2e-spec.ts
    └── auth-rbac.e2e-spec.ts (15 tests TC-024 -> TC-038)
apps/web/src/app/
├── (auth)/
│   ├── login/page.tsx (S07)
│   ├── change-password/page.tsx (S07)
│   └── profile/page.tsx (S08)
└── (staff)/
    └── admin/users/page.tsx (S43)
```

## 4. [VAI: TESTER / QA] Bảng Test Case
Toàn bộ 15 test cases của M02 đều chạy thực tế trên CSDL MySQL `corelink`:

| Mã TC | Module | Tiêu đề kiểm thử | Kết quả | Ghi chú |
|---|---|---|---|---|
| TC-024 | M02 | Admin tạo tài khoản học sinh | **ĐẠT** | Sinh mật khẩu tạm `CL@...`, gắn mã HS |
| TC-025 | M02 | Bắt buộc đổi mật khẩu lần đầu | **ĐẠT** | Đổi xong tắt cờ `must_change_password` |
| TC-026 | M02 | Mật khẩu tạm hết hạn sau 72 giờ | **ĐẠT** | Từ chối 401 khi quá 72 giờ |
| TC-027 | M02 | Một học sinh có 2 phụ huynh quyền khác nhau | **ĐẠT** | 3 cờ quyền độc lập |
| TC-028 | M02 | Giới hạn tối đa 4 phụ huynh / học sinh | **ĐẠT** | Phụ huynh thứ 5 bị từ chối 400 |
| TC-029 | M02 | Giáo viên không xem được lớp khác qua API | **ĐẠT** | ScopeGuard trả 403 Forbidden |
| TC-030 | M02 | Phụ huynh không xem được học sinh khác | **ĐẠT** | ScopeGuard trả 403 Forbidden |
| TC-031 | M02 | Đổi quyền / khóa có hiệu lực ngay và có audit | **ĐẠT** | Khóa tài khoản và ghi `audit_logs` |
| TC-032 | M02 | Một người nhiều vai trò chuyển vai trò | **ĐẠT** | Gán nhiều roles trong JWT và profile |
| TC-033 | M02 | Khóa tài khoản 15 phút sau 5 lần sai | **ĐẠT** | Đếm sai 5 lần -> khóa 15 phút (403) |
| TC-034 | M02 | Admin bắt buộc xác thực 2 lớp (2FA TOTP) | **ĐẠT** | Yêu cầu và xác thực mã 2FA thành công |
| TC-035 | M02 | Quên mật khẩu qua email | **ĐẠT** | Token dùng 1 lần trong 30 phút |
| TC-036 | M02 | Học sinh nhỏ không có chức năng nhắn tin | **ĐẠT** | Bị chặn 403 khi gọi API hội thoại |
| TC-037 | M02 | Chưa đồng ý thì chưa dùng được hệ thống | **ĐẠT** | Cờ `hasConsented` bằng false |
| TC-038 | M02 | Rút đồng ý tạo yêu cầu cho Admin | **ĐẠT** | Cập nhật `withdrawn_at` và ghi `audit_logs` |

## 5. [VAI: REVIEWER BẢO MẬT] Rà soát an ninh
- Mọi endpoint mới đều có `@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)`.
- Mật khẩu lưu trữ băm bằng Argon2id tiêu chuẩn cao.
- Không để lộ thông tin nhạy cảm qua lỗi: sai mật khẩu hoặc tài khoản không tồn tại đều trả thông điệp an toàn.
- Đã kiểm tra phân quyền chéo đạt 100%.

## 6. Kết luận & Chuyển giao
- BƯỚC 2 hoàn thành đạt 15/15 test cases.
- Chuyển ngay sang **BƯỚC 3: Trang công khai & tuyển sinh (M01)**.
