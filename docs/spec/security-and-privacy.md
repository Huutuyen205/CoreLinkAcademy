# BẢO MẬT & BẢO VỆ DỮ LIỆU CÁ NHÂN — CORELINK ACADEMY (SECURITY & PRIVACY)

**Dự án**: CoreLink Academy  
**Tiêu chuẩn áp dụng**: OWASP Top 10:2021, Nghị định 13/2023/NĐ-CP  
**Phiên bản**: 2.0  
**Tác giả**: Security Engineer & Lead Architect  

---

## 1. MÔ HÌNH NGUY CƠ BẢO MẬT & CƠ CHẾ PHÒNG VỆ (THREAT MODELING)

| Nguy cơ (OWASP Top 10) | Kịch bản tấn công tiềm ẩn | Cơ chế phòng vệ của CoreLink Academy |
|---|---|---|
| **A01: Broken Access Control** | Người dùng sửa `studentId` hoặc `invoiceId` trên URL để xem trộm điểm hoặc hóa đơn của người khác (IDOR). | **RBAC 2 lớp**: Layer 1 kiểm tra vai trò; Layer 2 kiểm tra quyền sở hữu bản ghi thực tế trong CSDL qua quan hệ `guardianships` hoặc `class_teachers`. Trả về `403 Forbidden` không tiết lộ tồn tại. |
| **A02: Cryptographic Failures** | Lộ lọt mật khẩu hoặc giải mã được mã QR điểm danh để điểm danh hộ từ xa. | Mật khẩu băm bằng **Argon2id** với tham số bộ nhớ cao. Mã QR điểm danh ký số động bằng **HMAC-SHA256** tự động xoay mới mỗi 30 giây. |
| **A03: Injection (SQL / XSS)** | Chèn mã SQL độc hại qua ô tìm kiếm hoặc chèn thẻ `<script>` vào nội dung bài tập. | Sử dụng **Prisma ORM** với truy vấn tham số hóa 100% (Parameterized Queries). Frontend React tự động làm sạch và escape chuỗi HTML khi render. Cấm dùng `dangerouslySetInnerHTML`. |
| **A04: Insecure Design** | Tấn công cạn kiệt tài chính (Denial of Wallet) bằng cách gửi liên tục câu hỏi dài tới mô hình AI đắt tiền. | Tích hợp **AiBudgetGuard** ($150/tháng). Tự động ngắt khi vượt hạn mức. Giới hạn tốc độ truy cập (Rate Limit) 30 req/phút cho các endpoint công khai. |
| **A05: Security Misconfiguration**| Để lộ stack trace hoặc thông tin phiên bản máy chủ khi xảy ra lỗi hệ thống. | Tích hợp **Helmet**, cấu hình CORS chặt chẽ chỉ cho phép domain web; bộ lọc lỗi tập trung (Global Exception Filter) chỉ trả về mã lỗi và thông báo thân thiện chuẩn RFC 7807. |
| **A07: Auth Failures** | Tấn công mò mật khẩu từ điển (Brute Force) vào tài khoản Giáo vụ. | Tự động khóa tài khoản **15 phút sau 5 lần** nhập sai mật khẩu liên tiếp. Bắt buộc xác thực 2 yếu tố (2FA TOTP) đối với tài khoản Quản trị viên. |

---

## 2. BẢO VỆ DỮ LIỆU CÁ NHÂN TRẺ EM (NGHỊ ĐỊNH 13/2023/NĐ-CP)

1. **Thu thập Sự đồng ý Minh bạch (Consent Management)**:
   - Học sinh dưới 16 tuổi khi đăng nhập bắt buộc phải có sự xác nhận đồng ý từ phụ huynh/người giám hộ hợp pháp qua biểu mẫu thỏa thuận quyền riêng tư.
   - Bản ghi đồng ý được lưu trữ có dấu thời gian trong bảng `consents`.
2. **Bộ lọc Ẩn danh PII (Anonymizer Engine)**:
   - Toàn bộ nội dung câu hỏi, bài tập hoặc bài thi trước khi gửi tới API của Claude 3.5 Sonnet hoặc Gemini 1.5 Flash đều bắt buộc đi qua lớp `Anonymizer`:
     - Tên học sinh -> Chuyển thành `[HS_1]`
     - Tên phụ huynh -> Chuyển thành `[PH_1]`
     - Tên giảng viên -> Chuyển thành `[GV_1]`
     - Số điện thoại / Email / Tên trường -> Được làm sạch hoàn toàn
   - Sau khi nhận kết quả từ AI, hệ thống mới ghép lại thông tin thật trước khi lưu vào CSDL nội bộ. Tuyệt đối không để lộ dữ liệu cá nhân của học sinh Việt Nam ra các máy chủ AI bên ngoài.
3. **Quy định Lưu trữ Hình ảnh Điểm danh**:
   - Ảnh chụp lớp học phục vụ điểm danh được nén và lưu trữ an toàn trong bucket MinIO S3 với chính sách vòng đời tối đa **30 ngày**. Job nền tự động dọn dẹp ảnh hết hạn hằng đêm để bảo vệ quyền riêng tư hình ảnh của học sinh.

---

## 3. QUẢN TRỊ KHÓA BÍ MẬT & BIẾN MÔI TRƯỜNG (SECRETS MANAGEMENT)

1. **Nguyên tắc Tuyệt đối**:
   - Không bao giờ commit file `.env` chứa bí mật thực tế vào Git.
   - Mọi biến môi trường được khai báo mẫu trong `.env.example` với các giá trị placeholder an toàn.
2. **Kiểm tra Môi trường Khởi động (Startup Validation)**:
   - Module cấu hình NestJS sử dụng schema Zod để kiểm tra tính hợp lệ của tất cả các biến môi trường bắt buộc (`DATABASE_URL`, `JWT_SECRET`, `QR_HMAC_SECRET`). Nếu thiếu biến môi trường thiết yếu, ứng dụng từ chối khởi động và in thông báo rõ ràng mà không để lộ giá trị bí mật.
