# MA TRẬN TRẠNG THÁI & CHUYỂN DỊCH NGHIỆP VỤ — CORELINK ACADEMY (STATE MACHINES)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: Solution Architect  

---

## 1. STATE MACHINE: KHÁCH TIỀM NĂNG (LEAD LIFECYCLE)

```
[NEW] (Khách gửi form website)
  │
  ├─► [CONTACTED] (Nhân viên đã gọi điện lần 1)
  │     │
  │     ├─► [CONSULTING] (Đang tư vấn lộ trình học tập)
  │     │     │
  │     │     ├─► [PLACEMENT_BOOKED] (Đặt lịch test đầu vào)
  │     │     │     │
  │     │     │     └─► [PLACEMENT_COMPLETED] (Đã có điểm test)
  │     │     │           │
  │     │     │           └─► [OFFER_SENT] (Gửi báo giá học phí & xếp lớp)
  │     │     │                 │
  │     │     │                 └─► [ENROLLED] (Đã nộp học phí -> Trở thành Học sinh)
  │     │     │
  │     └─► [LOST] (Khách từ chối, yêu cầu bắt buộc ghi lý do)
  │
  └─► [UNQUALIFIED / DUPLICATE] (Số máy sai hoặc trùng lặp)
```

- **Quy tắc Transition**:
  - Không cho phép chuyển thẳng từ `NEW` sang `ENROLLED` mà không qua bước xác nhận thông tin.
  - Chuyển sang `ENROLLED` kích hoạt side effect: Tạo User, Student, Guardian, Enrollment và Invoice trong một transaction.

---

## 2. STATE MACHINE: GHI DANH HỌC VIÊN (ENROLLMENT LIFECYCLE)

```
[DRAFT] (Đăng ký tạm thời / Giữ chỗ)
  │
  ▼
[PENDING_PAYMENT] (Chờ thanh toán học phí theo hạn)
  │
  ├─► [ACTIVE] (Đã thanh toán đủ hoặc theo đợt -> Được vào lớp)
  │     │
  │     ├─► [ON_HOLD] (Bảo lưu khóa học tối đa 90 ngày) ──► [ACTIVE] (Quay lại học)
  │     │
  │     ├─► [TRANSFER_REQUESTED] (Đề xuất chuyển lớp) ──► [ACTIVE] (Sang lớp mới)
  │     │
  │     ├─► [WITHDRAWN] (Thôi học / Hoàn phí theo chính sách)
  │     │
  │     └─► [COMPLETED] (Hoàn thành toàn bộ chương trình học)
  │
  └─► [CANCELLED] (Quá hạn thanh toán giữ chỗ -> Giải phóng sĩ số lớp)
```

- **Side effects**:
  - `ACTIVE`: Tự động thêm học sinh vào danh sách điểm danh của tất cả các `class_sessions` thuộc lớp.
  - `ON_HOLD` / `WITHDRAWN`: Giải phóng một chỗ trong sĩ số thực tế của lớp để học sinh trong hàng đợi (Waitlist) có thể được bổ sung.

---

## 3. STATE MACHINE: LỚP HỌC (CLASS LIFECYCLE)

```
[DRAFT] (Giáo vụ đang thiết lập chương trình & phòng học)
  │
  ▼
[OPEN_FOR_ENROLLMENT] (Mở tuyển sinh, hiển thị trên website)
  │
  ├─► [IN_PROGRESS] (Ngày khai giảng chính thức, bắt đầu giảng dạy)
  │     │
  │     └─► [COMPLETED] (Kết thúc toàn bộ số buổi học quy định)
  │           │
  │           └─► [ARCHIVED] (Lưu trữ hồ sơ học tập)
  │
  └─► [CANCELLED] (Hủy lớp do không đủ sĩ số tối thiểu)
```

- **Quy tắc Transition**:
  - Chỉ cho phép chuyển sang `IN_PROGRESS` khi đã có giáo viên đứng lớp hợp lệ và không có xung đột phòng học.

---

## 4. STATE MACHINE: BUỔI HỌC CỤ THỂ (CLASS SESSION LIFECYCLE)

```
[SCHEDULED] (Đã lên lịch định kỳ)
  │
  ├─► [IN_PROGRESS] (Giáo viên đã quét QR + GPS xác thực mở lớp)
  │     │
  │     └─► [COMPLETED] (Giáo viên kết thúc buổi dạy, hoàn tất điểm danh)
  │
  ├─► [RESCHEDULED] (Dời lịch học do giáo viên xin nghỉ / lễ)
  │
  └─► [CANCELLED] (Hủy buổi học có thông báo cho phụ huynh) ──► [MAKEUP] (Học bù)
```

- **Quy tắc**:
  - Chỉ các buổi học ở trạng thái `COMPLETED` mới được đưa vào bảng tính lương giảng dạy của giáo viên (`teacher_payrolls`).

---

## 5. STATE MACHINE: HÓA ĐƠN & THANH TOÁN (INVOICE LIFECYCLE)

```
[DRAFT] (Lập dự thảo học phí)
  │
  ▼
[ISSUED] (Phát hành hóa đơn, có hạn thanh toán)
  │
  ├─► [PARTIALLY_PAID] (Học viên nộp tiền đợt 1) ──► [PAID] (Hoàn tất thanh toán)
  │
  ├─► [PAID] (Thanh toán 100% học phí trọn gói)
  │     │
  │     └─► [REFUNDED] (Hoàn phí khi học viên thôi học hợp lệ)
  │
  ├─► [OVERDUE] (Quá hạn thanh toán quy định)
  │
  └─► [VOID] (Hủy hóa đơn do sai sót lập chứng từ)
```

- **Quy tắc**:
  - Không cho phép chuyển hóa đơn về `VOID` nếu đã phát sinh bất kỳ giao dịch thanh toán thành công nào trong bảng `payments`.
