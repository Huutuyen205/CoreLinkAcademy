# KẾ HOẠCH KIỂM THỬ TOÀN DIỆN & TÌNH HUỐNG BIÊN — CORELINK ACADEMY (TEST PLAN)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: Lead QA Automation Engineer & Security Engineer  

---

## 1. CÁC TẦNG KIỂM THỬ HỆ THỐNG (TESTING LAYERS)

1. **Kiểm tra Tĩnh & Kiểu dữ liệu (Static Checks)**:
   - `pnpm --recursive typecheck`: Đảm bảo 100% không có lỗi TypeScript strict mode trên toàn bộ 5 packages/apps.
2. **Kiểm thử Đơn vị (Unit Tests)**:
   - Kiểm tra logic tính toán chiết khấu học phí, tỷ lệ chuyên cần, bộ lọc ẩn danh `Anonymizer`, sinh mã HMAC QR.
3. **Kiểm thử Tích hợp API & Cơ sở Dữ liệu (API Integration Tests)**:
   - Sử dụng Jest + Supertest kết nối trực tiếp MySQL 8.4 LTS tại `localhost:3306`.
4. **Kiểm thử Luồng Đầu-Cuối (End-to-End Tests)**:
   - 154 Test Cases nghiệp vụ (TC-001 đến TC-154) bao phủ toàn bộ luồng từ khách gửi form tuyển sinh đến khi hoàn tất thanh toán và cấp bằng.

---

## 2. KIỂM THỬ CÁC TÌNH HUỐNG BIÊN ĐẶC BIỆT (EDGE CASE MATRIX)

| Tình huống biên (Edge Case) | Rủi ro tiềm ẩn | Cơ chế kiểm thử & Xử lý của CoreLink |
|---|---|---|
| **Bấm submit đúp khi đăng ký hoặc thu tiền** | Tạo 2 đơn ghi danh hoặc thu tiền 2 lần cho cùng một học viên. | Sử dụng **Idempotency-Key** và khóa duy nhất trong CSDL. Thao tác lặp lại trả về kết quả ban đầu mà không tạo bản ghi mới. |
| **Hai nhân viên cùng ghi danh suất cuối cùng của lớp** | Lớp học bị vượt quá sĩ số tối đa (`max_capacity`). | Sử dụng **Prisma Transaction kết hợp khóa dòng bi quan (Pessimistic Locking)**. Yêu cầu thứ hai sẽ bị từ chối với mã lỗi `409 Conflict`. |
| **Giá khóa học hoặc chính sách giảm giá thay đổi sau khi ghi danh** | Hóa đơn cũ bị biến đổi số tiền, sai lệch báo cáo kế toán. | Hệ thống **Snapshot toàn bộ dòng chi phí** tại thời điểm lập hóa đơn vào `tuition_invoices`. Thay đổi danh mục về sau không ảnh hưởng hóa đơn cũ. |
| **Đổi lịch học khi giáo viên hoặc phòng học đã có lịch trùng** | Giảng viên phải dạy 2 nơi cùng lúc hoặc 2 lớp dùng chung 1 phòng. | Thuật toán quét xung đột 3 chiều tự động chặn và trả về danh sách buổi học va chạm chi tiết. |
| **Callback thanh toán từ ngân hàng gửi đến 2 lần** | Học viên được cộng tiền gấp đôi vào hóa đơn. | Kiểm tra mã giao dịch đối tác trong bảng `payments`. Giao dịch trùng tự động trả về `200 OK` mà không ghi sổ lần hai. |
| **Học sinh nộp bài thi muộn khi đồng hồ hết giờ** | Gian lận làm bài quá thời gian quy định. | Server kiểm tra mốc thời gian bắt đầu phiên làm bài. Mọi câu trả lời gửi lên sau khi hết giờ bị từ chối và tự động chốt bài nộp. |
| **Người dùng sửa ID trên URL để xem điểm người khác** | Lỗ hổng bảo mật truy cập chéo dữ liệu (IDOR). | Policy kiểm tra quan hệ `guardianships` và `class_teachers` từ chối `403 Forbidden` và không tiết lộ sự tồn tại của bản ghi. |
| **Học sinh nhỏ tuổi cố tình gửi tin nhắn văn bản** | Vi phạm chính sách an toàn thông tin trẻ em. | API kiểm tra cờ `students.is_young_account`. Nếu là học sinh tiểu học, API trả về `403 Forbidden` ngay lập tức. |

---

## 3. LỆNH CHẠY KIỂM THỬ TIÊU CHUẨN

```powershell
# 1. Typecheck toàn bộ workspace
pnpm --recursive typecheck

# 2. Chạy unit tests
pnpm --recursive test

# 3. Chạy toàn bộ integration tests API & Database
pnpm --filter @corelink/api test:e2e

# 4. Kiểm tra khả năng build production của Next.js và NestJS
pnpm --recursive build
```
