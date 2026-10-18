# ĐỊNH NGHĨA CHỈ SỐ BÁO CÁO & THỐNG KÊ — CORELINK ACADEMY (REPORTING METRICS)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: Business Analyst & Financial Analyst  

---

## 1. CÁC CHỈ SỐ TUYỂN SINH & MARKETING (ADMISSIONS KPIS)

### 1.1. Tỷ lệ Chuyển đổi Phễu Tuyển sinh (Lead Conversion Rate)
- **Định nghĩa**: Đo lường hiệu quả chuyển đổi từ khách hàng tiềm năng mới thành học viên nhập học chính thức.
- **Công thức**:
  $$\text{Tỷ lệ chuyển đổi (\%)} = \left( \frac{\text{Số lượng Lead chuyển thành ENROLLED}}{\text{Tổng số Lead tiếp nhận hợp lệ}} \right) \times 100$$
- **Nguồn dữ liệu CSDL**: Khung nhìn `v_lead_funnel_month` tổng hợp theo tháng và nguồn tiếp thị (`campaigns.source`).

### 1.2. Chi phí Thu hút Học viên Mới (CAC - Cost Per Acquisition)
- **Định nghĩa**: Chi phí trung bình để có một học viên mới ghi danh từ chiến dịch marketing.
- **Công thức**:
  $$\text{CAC} = \frac{\text{Tổng ngân sách chiến dịch đã chi tiêu (VNĐ)}}{\text{Số học viên mới phát sinh từ chiến dịch đó}}$$
- **Nguồn dữ liệu**: Bảng `campaigns.budget_spent` chia cho số lượng `enrollments` có `source_campaign_id`.

---

## 2. CÁC CHỈ SỐ ĐÀO TẠO & HỌC THUẬT (ACADEMIC KPIS)

### 2.1. Tỷ lệ Lấp đầy Lớp học (Class Fill Rate)
- **Định nghĩa**: Tỷ lệ học sinh thực tế đang học so với sức chứa tối đa của phòng học/lớp học.
- **Công thức**:
  $$\text{Tỷ lệ lấp đầy (\%)} = \left( \frac{\text{Số học viên đang ACTIVE trong lớp}}{\text{classes.max\_capacity}} \right) \times 100$$
- **Ngưỡng cảnh báo**: Nếu tỷ lệ lấp đầy < 50% trước 7 ngày khai giảng, hệ thống tạo cảnh báo Giáo vụ cân nhắc gộp lớp hoặc đẩy mạnh tư vấn.
- **Nguồn dữ liệu**: Khung nhìn `v_class_fill`.

### 2.2. Tỷ lệ Chuyên cần Học viên (Attendance Rate)
- **Định nghĩa**: Tỷ lệ số buổi học sinh có mặt so với tổng số buổi học thực tế đã diễn ra.
- **Công thức**:
  $$\text{Tỷ lệ chuyên cần (\%)} = \left( \frac{\text{Số buổi PRESENT} + \text{LATE}}{\text{Tổng số buổi đã diễn ra} - \text{Số buổi EXCUSED}} \right) \times 100$$
- **Nguồn dữ liệu**: Bảng `attendance_records` liên kết với `class_sessions.status = 'COMPLETED'`.

---

## 3. CÁC CHỈ SỐ TÀI CHÍNH & VẬN HÀNH (FINANCIAL KPIS)

### 3.1. Doanh thu Đã Thu (Realized Revenue)
- **Định nghĩa**: Tổng số tiền thực tế đã thu vào tài khoản của trung tâm qua các giao dịch hợp lệ.
- **Công thức**:
  $$\text{Doanh thu} = \sum \text{payments.amount} \quad (\text{với } \text{status} = \text{'SUCCESS'})$$
- **Nguồn dữ liệu**: Bảng `payments`.

### 3.2. Công nợ Học phí Phải Thu (Accounts Receivable)
- **Định nghĩa**: Số tiền học phí còn thiếu cần tiếp tục đôn đốc phụ huynh thanh toán theo các kỳ hạn.
- **Công thức**:
  $$\text{Công nợ} = \sum (\text{tuition\_invoices.total\_amount} - \text{tuition\_invoices.paid\_amount}) \quad (\text{với } \text{status} \in \{\text{'ISSUED'}, \text{'PARTIALLY\_PAID'}\})$$

### 3.3. Chi phí Sử dụng Trí tuệ Nhân tạo (AI Monthly Cost)
- **Định nghĩa**: Tổng chi phí token và thời gian xử lý audio từ các nhà cung cấp AI (Claude, Gemini) trong tháng hiện tại.
- **Công thức**:
  $$\text{Chi phí AI (USD)} = \sum \text{ai\_jobs.cost\_usd} \quad (\text{trong tháng lịch hiện tại})$$
- **Ngưỡng giám sát**: Hạn mức ngân sách tối đa $150/tháng. Khi chi phí đạt $120 (80%), gửi email cảnh báo Super Admin. Khi đạt $150 (100%), ngắt các tính năng AI mở rộng.
- **Nguồn dữ liệu**: Khung nhìn `v_ai_cost_month`.
