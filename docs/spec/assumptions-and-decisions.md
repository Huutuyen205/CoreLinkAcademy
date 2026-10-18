# TÀI LIỆU GIẢ ĐỊNH & QUYẾT ĐỊNH KIẾN TRÚC (ASSUMPTIONS & DECISIONS)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Ngày cập nhật**: 18/10/2026  

---

## 1. QUYẾT ĐỊNH KIẾN TRÚC KỸ THUẬT (ARCHITECTURAL DECISIONS - ADR)

### ADR-01: Kiến trúc Modular Monolith thay vì Microservices
- **Bối cảnh**: Hệ thống phục vụ trung tâm đào tạo với quy mô 100 - 1000 học sinh, có nhu cầu tính nhất quán giao dịch cao giữa đăng ký lớp, xếp lịch và thu học phí.
- **Quyết định**: Áp dụng kiến trúc **Modular Monolith** trên nền tảng NestJS 11 và Next.js 15.
- **Lý do & Ưu điểm**:
  - Đơn giản hóa quy trình phát triển, kiểm thử E2E và triển khai cục bộ/máy chủ đơn.
  - Sử dụng giao dịch cơ sở dữ liệu ACID (Prisma Transactions) an toàn mà không cần đến distributed transactions phức tạp (2PC hay Saga).
  - Loại bỏ hoàn toàn độ trễ mạng giữa các dịch vụ nội bộ.

### ADR-02: Tiếp cận Database-First trên MySQL 8.4 LTS
- **Bối cảnh**: Schema CSDL gồm 84 bảng đã được chuẩn hóa 3NF, tối ưu hóa kiểu dữ liệu, ràng buộc toàn vẹn và khóa ngoại trong `db/000_schema.sql`.
- **Quyết định**: Duy trì nguyên tắc **Database-First** (`prisma db pull` -> `prisma generate`).
- **Quy tắc**: Tuyệt đối không can thiệp sửa trực tiếp `db/000_schema.sql`. Mọi thay đổi cấu trúc bảng về sau bắt buộc phải viết qua script migration có đánh số thứ tự trong `db/migrations/` và thực thi có kiểm soát.

### ADR-03: Định hướng Giao diện Thương hiệu Giáo dục Sáng sủa (Educational Brand Identity)
- **Bối cảnh**: Giao diện trước đây sử dụng dark-mode nền tối cyberpunk `#060911` gây cảm giác giống công cụ AI hoặc ứng dụng tiền số, không tạo được niềm tin giáo dục.
- **Quyết định**: Chuyển đổi toàn diện sang bảng màu giáo dục tiêu chuẩn:
  - Nền canvas sáng `#F7F9FC`, thẻ bề mặt trắng `#FFFFFF`, viền `#E2E8F0`.
  - Màu chủ đạo xanh dương giáo dục `#2563EB`, xanh ngọc phát triển `#0F9D8A`, vàng ấm `#F4B942`.
  - Typography: Google Fonts Plus Jakarta Sans (nội dung) và Outfit (tiêu đề).

---

## 2. CÁC ĐIỂM CHỜ XÁC NHẬN CHÍNH THỨC TỪ TRUNG TÂM (PENDING CONFIRMATIONS)

Để hệ thống vận hành liên tục mà không bị gián đoạn, đội ngũ kỹ thuật đã thiết lập các giá trị mặc định an toàn và cấu hình hóa:

| # | Hạng mục cần xác nhận | Phương án mặc định đang áp dụng | Cấu hình trong hệ thống |
|---|---|---|---|
| 1 | **Nhóm trao đổi lớp học** | Sử dụng **Bảng tin lớp học một chiều** (Chỉ giáo viên đăng bài, phụ huynh bấm xác nhận "Đã đọc"). Không tạo nhóm chat hỗn loạn | `settings.classes.enable_class_board = true` |
| 2 | **Bản tóm tắt học tập ngày** | Tự động tổng hợp dữ kiện buổi học và gửi tới Cổng phụ huynh vào lúc **20:00** sau mỗi buổi học | `settings.notifications.daily_summary_time = "20:00"` |
| 3 | **Cơ chế xác thực buổi học** | Giáo viên mở lớp học offline bắt buộc quét mã QR + định vị GPS trong bán kính **150 mét** so với cơ sở | `branches.checkin_radius_m = 150` |
| 4 | **Chính sách bảo lưu học phí** | Thời hạn bảo lưu tối đa **90 ngày**, yêu cầu phụ huynh gửi đơn trước 48 giờ trước ngày bắt đầu bảo lưu | `settings.academic.max_leave_days = 90` |
| 5 | **Sĩ số lớp học tối đa** | Mặc định **12 học viên/lớp** đối với luyện thi IELTS và **15 học viên/lớp** đối với Cambridge | `classes.max_capacity = 12` |
| 6 | **Giới hạn số lượng phụ huynh** | Tối đa **4 tài khoản phụ huynh** được liên kết với một học sinh (Ràng buộc bằng Trigger DB) | `trg_guardianships_limit` |
| 7 | **Hạn mức chi tiêu AI hàng tháng**| Giới hạn an toàn **$150/tháng**. Đạt 80% cảnh báo Admin; đạt 100% ngắt các tính năng AI đắt tiền | `settings.ai.monthly_budget_usd = 150` |
| 8 | **Chính sách hoàn phí khi thôi học**| Hoàn lại 70% học phí phần buổi chưa học nếu có lý do chính đáng và đơn nộp trước 7 ngày | `settings.finance.refund_rate_default = 0.70` |

---

## 3. GIẢ ĐỊNH VẬN HÀNH & PHÁP LÝ

1. **Tuân thủ Nghị định 13/2023/NĐ-CP**:
   - Đối với học sinh dưới 16 tuổi, hệ thống chỉ kích hoạt tài khoản khi có bản ghi đồng ý (`consents`) được xác nhận bởi phụ huynh/người giám hộ hợp pháp.
2. **Ẩn danh Dữ liệu Trí tuệ Nhân tạo (Anonymization Policy)**:
   - Mọi tương tác gửi tới Claude 3.5 Sonnet hoặc Gemini 1.5 Flash bắt buộc phải đi qua lớp `Anonymizer`, xóa bỏ hoặc thay thế toàn bộ tên thật, số điện thoại, email và trường học của học viên bằng các mã ẩn danh `[HS_1]`, `[PH_1]`.
3. **Quy tắc Bất biến trong Tài chính**:
   - Các bản ghi giao dịch thu học phí và biên nhận thanh toán tuyệt đối không bị xóa cứng (No hard delete). Các khoản điều chỉnh được ghi nhận dưới dạng bút toán đảo hoặc hoàn tiền có liên kết giao dịch gốc.
