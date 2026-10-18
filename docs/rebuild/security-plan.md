# KẾ HOẠCH BẢO MẬT TOÀN DIỆN — CORELINK ACADEMY (SECURITY PLAN)

**Tài liệu**: Kế hoạch & Tiêu chuẩn Bảo mật Ứng dụng  
**Tiêu chuẩn áp dụng**: OWASP Top 10:2021, Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân  
**Phiên bản**: 2.0  
**Kỹ sư phụ trách**: Security Engineer & Tech Lead  

---

## 1. BẢO VỆ CHỐNG 10 NGUY CƠ BẢO MẬT HÀNG ĐẦU (OWASP TOP 10)

### 1.1. A01:2021 — Broken Access Control (Kiểm soát Truy cập Bị phá vỡ)
- **Giải pháp**: Cơ chế phân quyền 2 lớp (Two-Layer Authorization) trên 100% endpoint backend:
  - Guard cấp 1: Xác thực vai trò người dùng (`@Roles()`).
  - Guard cấp 2: Xác thực phạm vi dữ liệu (`@Scope()`).
  - Tuyệt đối không cho phép người dùng thay đổi ID trong URL để truy cập tài nguyên của người khác (Chống triệt để lỗ hổng IDOR).
  - Phụ huynh chỉ có thể truy vấn bảng điểm của học sinh có quan hệ hợp lệ trong `guardianships`.

### 1.2. A02:2021 — Cryptographic Failures (Lỗi Mã hóa)
- **Giải pháp**:
  - Mật khẩu người dùng được băm bằng thuật toán **Argon2id** với tham số độ phức tạp cao, chống tấn công brute-force phần cứng GPU.
  - Mã QR điểm danh được mã hóa bằng chữ ký số HMAC-SHA256 với khóa bí mật bảo mật trong `.env` (`QR_HMAC_SECRET`) và thời hạn hết hạn 30 giây.
  - Truyền tải toàn bộ dữ liệu qua giao thức bảo mật HTTPS/WSS với chứng chỉ TLS 1.3.

### 1.3. A03:2021 — Injection (Tấn công Chèn mã & SQL Injection)
- **Giải pháp**:
  - Truy vấn cơ sở dữ liệu 100% qua Prisma ORM với Parameterized Queries, loại bỏ hoàn toàn việc ghép chuỗi SQL thủ công.
  - Chống XSS (Cross-Site Scripting): Dữ liệu người dùng gửi lên được làm sạch và validate nghiêm ngặt qua Zod / Class-Validator; Frontend React tự động escape HTML khi render, cấm sử dụng `dangerouslySetInnerHTML` với dữ liệu thô.

### 1.4. A04:2021 — Insecure Design (Thiết kế Không An toàn)
- **Giải pháp**:
  - Hạn mức ngân sách AI (`AiBudgetGuard`): Tự động ngắt các lời gọi AI đắt tiền khi chạm ngưỡng ngân sách $150/tháng để chống tấn công cạn kiệt tài nguyên (Denial of Wallet).
  - Giới hạn tốc độ truy cập (Rate Limiting): Áp dụng 30 req/phút cho các endpoint công khai và 10 req/phút cho endpoint xác thực đăng nhập.

### 1.5. A05:2021 — Security Misconfiguration (Cấu hình Bảo mật Sai)
- **Giải pháp**:
  - Ứng dụng tích hợp `helmet` để thiết lập các HTTP Header bảo mật: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.
  - Cấu hình CORS chặt chẽ: Chỉ cho phép tên miền hợp lệ của Web Frontend kết nối tới API.

### 1.6. A07:2021 — Identification and Authentication Failures (Lỗi Nhận dạng & Xác thực)
- **Giải pháp**:
  - Access Token ngắn hạn (15 phút).
  - Refresh Token xoay vòng (Rotated Refresh Token): Mỗi lần cấp lại Access Token, Refresh Token cũ sẽ bị thu hồi và thay thế bằng token mới.
  - Khóa tài khoản 15 phút sau 5 lần nhập sai mật khẩu liên tiếp để chống tấn công mò mật khẩu từ điển.

---

## 2. BẢO VỆ DỮ LIỆU CÁ NHÂN TRẺ EM (NGHỊ ĐỊNH 13/2023/NĐ-CP)

1. **Thu thập Sự đồng ý (Consent Management)**:
   - Học sinh dưới 16 tuổi khi đăng nhập bắt buộc phải có xác nhận đồng ý từ phụ huynh/người giám hộ hợp pháp.
   - Bản ghi đồng ý được lưu vết có chữ ký thời gian tại bảng `consents`. Khi rút lại sự đồng ý, tài khoản sẽ chuyển sang chế độ tạm khóa và thông báo tới Quản trị viên.
2. **Ẩn danh Dữ liệu Trước khi Gửi Tới AI (Anonymization)**:
   - Toàn bộ lời gọi tới Claude hay Gemini bắt buộc đi qua bộ lọc `Anonymizer`:
     - Tên học sinh → `[HS_1]`
     - Tên phụ huynh → `[PH_1]`
     - Số điện thoại / Email → Được xóa bỏ hoàn toàn
   - Tuyệt đối không để lộ dữ liệu định danh của học sinh Việt Nam ra các máy chủ AI quốc tế.
3. **Chính sách Tệp tin và Hình ảnh Điểm danh**:
   - Ảnh lớp học phục vụ điểm danh được nén và mã hóa trong MinIO S3 với thời hạn lưu trữ tối đa 30 ngày. Job nền `cleanup` sẽ tự động xóa sạch ảnh hết hạn vào lúc 02:00 sáng hằng ngày.
