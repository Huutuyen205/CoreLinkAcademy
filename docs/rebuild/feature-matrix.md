# MA TRẬN CHỨC NĂNG & PHÂN QUYỀN VAI TRÒ — CORELINK ACADEMY (FEATURE MATRIX)

**Tài liệu**: Ma trận Phân quyền & Khả năng Thực thi  
**Phiên bản**: 2.0  
**Ngày cập nhật**: 18/10/2026  

---

## 1. MA TRẬN PHÂN QUYỀN THEO VAI TRÒ (RBAC MATRIX)

Ký hiệu:
- **C** (Create): Quyền tạo mới
- **R** (Read): Quyền xem dữ liệu
- **U** (Update): Quyền cập nhật / chỉnh sửa
- **D** (Delete / Archive): Quyền xóa hoặc lưu trữ
- **A** (Approve): Quyền phê duyệt
- **X**: Không có quyền truy cập (API trả về 403 Forbidden)

| Nhóm Nghiệp vụ & Chức năng | Super Admin | Giáo vụ / Academic | Tuyển sinh / CRM | Kế toán / Finance | Giáo viên | Học viên | Phụ huynh | Khách |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Trang chủ, Khóa học, Blog** | CRUD | R | R | R | R | R | R | R |
| **Đăng ký tư vấn / Học thử** | CRUD | R | CRUD | R | X | X | X | C |
| **Chatbot Tuyển sinh 24/7** | Quản trị KB | X | R (Lead) | X | X | X | X | Tương tác |
| **Kiểm tra đầu vào (Placement)**| CRUD | CRUD | CRUD | X | X | Làm bài | X | Làm bài (Token) |
| **Quản lý Lead & Phễu CRM** | CRUD | R | CRUD | R | X | X | X | X |
| **Chuyển đổi Lead → Học viên** | CRUD | CRU | CRU | R | X | X | X | X |
| **Quản trị Tài khoản & Phân vai**| CRUD | R (theo chi nhánh) | X | X | X | X | X | X |
| **Đồng ý dữ liệu Nghị định 13** | CRUD | R | R | R | R | Xem/Đồng ý | Xem/Đồng ý | X |
| **Cấu trúc Lớp & Thời khóa biểu**| CRUD | CRUD | R | R | R (Lớp mình)| R (Lớp mình)| R (Lớp con)| X |
| **Phát hiện xung đột lịch** | CRU | CRU | X | X | Đề xuất đổi | X | X | X |
| **Điểm danh QR & Định vị GPS** | CRUD | CRUD (Sửa có log)| X | X | Mở buổi + Điểm danh | Quét QR vào lớp | Nhận thông báo | X |
| **Ngân hàng Câu hỏi & Đề thi** | CRUD | CRUD | X | X | CRU (Duyệt) | Làm bài tập | X | X |
| **Chấm bài thi Tự luận & AI** | CRUD | R | X | X | Chấm & Phê duyệt | Xem kết quả | Xem kết quả | X |
| **Gói Học phí & Hóa đơn** | CRUD | R | R | CRUD | X | Xem học phí | Thanh toán | X |
| **Bảng lương Giáo viên** | CRUD | R (Xác nhận buổi)| X | CRUD | Xem & Khiếu nại| X | X | X |
| **Cổng Phụ huynh & Nhật ký ngày**| CRUD | R | R | R | Soạn nhận xét | X | Xem các con | X |
| **Bản tin Lớp học (Một chiều)** | CRUD | CRUD | X | X | Đăng bản tin | Đọc bản tin | Đọc bản tin | X |
| **Kho Tài liệu & Học liệu số** | CRUD | CRUD | X | X | Tải lên & Chia sẻ | Đọc & Tải | Xem | X |
| **AI Speaking Coach** | Quản trị | X | X | X | R | Luyện nói | X | X |
| **AI Flashcard Từ vựng** | Quản trị | X | X | X | R | Ôn tập | X | X |
| **Báo cáo Phễu & Doanh thu** | Toàn hệ thống | Theo chi nhánh | Báo cáo Lead | Báo cáo Thu/Chi | X | X | X | X |
| **Nhật ký Kiểm toán (Audit Logs)**| Xem toàn bộ | X | X | X | X | X | X | X |

---

## 2. PHÂN LOẠI TRẠNG THÁI KHẢ NĂNG THỰC HIỆN (CAPABILITY STATUS)

Theo đúng quy định nghiêm ngặt tại Phần XII của Master Prompt:

### Nhóm 1: Hoàn thành (Completed & Production-Verified)
- **Hệ thống Xác thực & RBAC 2 Lớp (Auth & RBAC)**: Đã triển khai đầy đủ JWT xoay vòng, Argon2id, guard kiểm tra phạm vi dữ liệu, 15/15 test case PASS.
- **Quản lý Đào tạo & Điểm danh (Academic & Attendance)**: Quản lý lớp, buổi học, phòng học, mã QR HMAC động 30s, GPS check-in (150m), ảnh lớp học.
- **Khảo thí & Chấm điểm (Assessment & Testing)**: Ngân hàng câu hỏi CEFR, làm bài thi online, tính điểm trắc nghiệm tức thời, hỗ trợ AI chấm tự luận có giáo viên chốt điểm.
- **Học phí & Quản lý Thu chi (Finance & Invoicing)**: Lập hóa đơn, biên nhận tuần tự chống trùng lặp qua khóa dòng bi quan, quản lý kỳ lương giáo viên.
- **Cổng Phụ huynh (Parent Portal)**: Theo dõi học tập nhiều con, báo cáo ngày 20:00, nhận thông báo tức thời.
- **Chatbot Tuyển sinh RAG (Admissions AI Chatbot)**: Tìm kiếm tri thức được phê duyệt, budget guard $150/tháng, 30/30 câu hỏi bẫy kiểm thử an toàn.

### Nhóm 2: Đang triển khai & Tái thiết kế Giao diện (In Progress / Redesign)
- **Tái thiết kế Hệ thống Giao diện Thương hiệu Giáo dục (Design System Overhaul)**:
  - Thay thế toàn bộ phong cách dark cyberpunk bằng bảng màu giáo dục tiêu chuẩn: Nền sáng `#F7F9FC`, Xanh dương giáo dục `#2563EB`, Xanh ngọc `#0F9D8A`, Vàng ấm `#F4B942`, Surface trắng `#FFFFFF`.
  - Nâng cấp Landing Page S01 theo chuẩn thương mại của các tổ chức giáo dục hàng đầu.
- **AI Speaking Coach & Vocabulary Flashcard**:
  - Giao diện phòng luyện âm trực quan bằng Web Audio API, chấm ngữ điệu tức thời và hệ thống thẻ học ghi nhớ ngắt quãng (Spaced Repetition).

### Nhóm 3: Kế hoạch Phát triển Tương lai (Future Roadmap)
- **Ứng dụng Di động Native Độc lập (Native iOS/Android App)**:
  - Hiện tại đã có phiên bản PWA chuẩn mực (Web App Manifest, Service Worker, Responsive từ 360px). Gói ứng dụng Capacitor/React Native sẽ được triển khai khi có yêu cầu phát hành lên App Store/Google Play.
- **Tích hợp Cổng thanh toán Quốc tế (Stripe/PayPal)**:
  - Hiện tại hỗ trợ VietQR chuyển khoản tự động và VNPay. Cổng quốc tế sẽ kích hoạt khi trung tâm mở rộng tuyển sinh du học sinh nước ngoài.
