# MA TRẬN PHÂN QUYỀN & PHẠM VI DỮ LIỆU — CORELINK ACADEMY (ROLES & PERMISSIONS)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: Security Engineer & Solution Architect  

---

## 1. PHÂN QUYỀN 2 LỚP (TWO-LAYER ACCESS CONTROL ARCHITECTURE)

Hệ thống bắt buộc áp dụng cơ chế phân quyền 2 lớp trên 100% các endpoint nghiệp vụ:

```
[Incoming Request]
       │
       ▼
[Layer 1: Role-Based Guard (@Roles)]
- Kiểm tra JWT Token hợp lệ
- Kiểm tra vai trò của người dùng có thuộc danh sách Role được phép
- Nếu không khớp ──► Trả về 403 Forbidden
       │
       ▼ (Hợp lệ)
[Layer 2: Data-Scope Policy Guard (@Scope)]
- Kiểm tra quan hệ sở hữu giữa Actor và Tài nguyên (Object-Level Authorization)
- Teacher Policy: Chỉ được xem/sửa lớp mình dạy
- Guardian Policy: Chỉ được xem con mình trong `guardianships`
- Student Policy: Chỉ xem dữ liệu của chính mình
- Staff Policy: Chỉ xem dữ liệu thuộc cơ sở (`branch_id`) của mình
- Nếu vi phạm phạm vi ──► Trả về 403 Forbidden (Chống IDOR triệt để)
```

---

## 2. MA TRẬN QUYỀN HẠN CHI TIẾT THEO VAI TRÒ (RBAC MATRIX)

Ký hiệu:
- **C** (Create): Tạo mới
- **R** (Read): Xem dữ liệu
- **U** (Update): Cập nhật / sửa đổi
- **D** (Delete / Archive): Xóa mềm hoặc lưu trữ
- **A** (Approve): Phê duyệt nghiệp vụ

| Nhóm Tài nguyên & Endpoint | Super Admin | Giám đốc Trung tâm | Giáo vụ (Academic) | Tuyển sinh (CRM) | Kế toán (Finance) | Giảng viên | Học viên | Phụ huynh |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Quản trị Người dùng & Vai trò** | CRUD | R | X | X | X | X | X | X |
| **Cấu hình Hệ thống & Chi nhánh** | CRUD | RU | X | X | X | X | X | X |
| **Khách tiềm năng & Phễu CRM** | CRUD | CRUD | R | CRUD | R | X | X | X |
| **Chương trình & Khóa học** | CRUD | CRUD | CRUD | R | R | R | R (Công khai)| R (Công khai)|
| **Lớp học & Thời khóa biểu** | CRUD | CRUD | CRUD | R | R | R (Lớp mình)| R (Lớp mình)| R (Lớp con)|
| **Điểm danh & Chuyên cần** | CRUD | CRUD | CRUD (Sửa có log)| X | X | Mở lớp + Điểm danh| Quét QR | R (Lịch sử con)|
| **Ngân hàng Câu hỏi & Đề thi** | CRUD | CRUD | CRUD | X | X | CRUD (Duyệt)| Xem đề thi | X |
| **Làm bài & Chấm bài Tự luận** | CRUD | R | R | X | X | Chấm & Khóa điểm| Làm bài tập | Xem điểm con |
| **Học phí, Hóa đơn & Biên nhận**| CRUD | R | R | R | CRUD | X | Xem học phí | Thanh toán |
| **Bảng lương Giảng viên** | CRUD | RA | R (Buổi dạy)| X | CRUD | R & Khiếu nại| X | X |
| **Bản tin Lớp học (Một chiều)** | CRUD | CRUD | CRUD | X | X | Đăng bài | Đọc bài | Đọc bài |
| **Nhật ký Kiểm toán (Audit Logs)**| R | X | X | X | X | X | X | X |

---

## 3. CHÍNH SÁCH PHẠM VI DỮ LIỆU CỤ THỂ (OBJECT-LEVEL DATA SCOPE)

### 3.1. Chính sách Giảng viên (Teacher Data Scope Policy)
- Giảng viên chỉ có quyền truy cập dữ liệu học sinh, bài tập và điểm danh của các lớp mà mình được phân công giảng dạy trong bảng `class_teachers` hoặc là người đứng lớp trong `class_sessions.teacher_id`.
- Mọi nỗ lực truy cập vào mã lớp khác đều bị từ chối với mã lỗi `403 Forbidden` mà không tiết lộ bản ghi đó có tồn tại hay không.

### 3.2. Chính sách Phụ huynh (Parent Data Scope Policy)
- Phụ huynh chỉ được xem thông tin học tập của các học sinh có liên kết hợp lệ trong bảng `guardianships`.
- Tuân thủ nghiêm ngặt 3 cờ phân quyền do gia đình thiết lập:
  - `can_view_results = 1`: Mới được xem điểm thi và báo cáo tháng.
  - `can_message = 1`: Mới được gửi tin nhắn tới giáo viên chủ nhiệm.
  - `receives_fee_notice = 1`: Mới nhận thông báo học phí và link thanh toán.

### 3.3. Chính sách Học sinh Nhỏ tuổi (Young Student Policy)
- Học sinh có cờ `students.is_young_account = 1` (học sinh tiểu học) bị hệ thống tự động chặn 100% các API nhắn tin trao đổi để bảo vệ an toàn thông tin trẻ em trên không gian mạng.
