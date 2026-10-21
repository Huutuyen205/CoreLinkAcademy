# 07 — Sitemap, luồng người dùng và sơ đồ logic

Trạng thái: **đã hiện thực** trong code Pha 1 (2026-10-21); chưa kiểm tra thủ công trên DB thật.

## 1. Sitemap

```text
Công khai
  /                          Trang chủ (FR-001)
  /khoa-hoc                  Danh mục (?mon=&khoi=) (FR-002)
  /khoa-hoc/[slug]           Chi tiết khóa (FR-003)
  /dang-ky-hoc-thu           Form học thử (?khoa=slug) (FR-004)
  /dang-ky-hoc-thu/cam-on
  /dang-nhap                 (FR-010)
Mọi vai trò đã đăng nhập
  /doi-mat-khau              (FR-012)
Staff/Admin  /quan-ly
  /quan-ly                   Tổng quan (FR-034)
  /quan-ly/lead, /quan-ly/lead/[id]                  (FR-006..009)
  /quan-ly/lop, /quan-ly/lop/moi, /quan-ly/lop/[id]  (FR-017..021)
  /quan-ly/buoi/[id]         Điểm danh ngoài khung (FR-024)
  /quan-ly/hoc-vien          Học sinh + phụ huynh, liên kết (FR-014)
  /quan-ly/khoa-hoc, /quan-ly/khoa-hoc/[id], /quan-ly/mon-hoc, /quan-ly/phong   (Admin, FR-015, FR-016)
  /quan-ly/nguoi-dung, /quan-ly/nguoi-dung/[id]         (Admin, FR-013)
  /quan-ly/nhat-ky           (Admin, FR-035)
Giáo viên  /giao-vien
  /giao-vien                 Tổng quan: buổi hôm nay, bài chờ chấm
  /giao-vien/lich            Lịch tuần (FR-022)
  /giao-vien/lop             Danh sách lớp mình dạy
  /giao-vien/lop/[id]        Học sinh, buổi, bài tập, bảng điểm (FR-033)
  /giao-vien/buoi/[id]       Điểm danh (FR-023)
  /giao-vien/bai-tap/moi?lop=, /giao-vien/bai-tap/[id]   Soạn bài (FR-027, FR-028)
  /giao-vien/bai-tap/[id]/bai-nop, /giao-vien/bai-nop/[id] Chấm (FR-031, FR-032)
Học sinh  /hoc-sinh
  /hoc-sinh                  Tổng quan
  /hoc-sinh/lich, /hoc-sinh/bai-tap, /hoc-sinh/bai-tap/[id]
  /hoc-sinh/ket-qua          Điểm đã công bố + chuyên cần (FR-025, FR-033)
Phụ huynh  /phu-huynh
  /phu-huynh                 Chọn con (?con=) → lịch, chuyên cần, điểm (FR-034)
```

## 2. Điều hướng sau đăng nhập

```mermaid
flowchart TD
  A[Gửi form đăng nhập] --> B{Rate/lock?}
  B -- bị khóa --> E[Thông báo khóa 15 phút]
  B -- ok --> C{Đúng mật khẩu và ACTIVE?}
  C -- sai --> D[Tăng bộ đếm, lỗi chung] --> B
  C -- đúng --> F[Tạo phiên, reset bộ đếm]
  F --> G{mustChangePassword?}
  G -- có --> H[/doi-mat-khau/]
  G -- không --> I{Vai trò}
  I -- ADMIN/STAFF --> J[/quan-ly/]
  I -- TEACHER --> K[/giao-vien/]
  I -- STUDENT --> L[/hoc-sinh/]
  I -- PARENT --> M[/phu-huynh/]
```

## 3. Đăng ký học thử (UC-001)

```mermaid
flowchart TD
  S[Gửi form] --> HP{Honeypot có giá trị?}
  HP -- có --> OK[Trang cảm ơn, không lưu]
  HP -- không --> RL{Quá 5 lần/10 phút?}
  RL -- có --> ERR1[Báo thử lại sau]
  RL -- không --> V{Hợp lệ + đồng ý?}
  V -- không --> ERR2[Lỗi từng ô]
  V -- có --> N[Chuẩn hóa SĐT]
  N --> DUP{Lead đang mở trùng SĐT?}
  DUP -- có --> ACT[Thêm hoạt động RESUBMITTED] --> OK2[Trang cảm ơn]
  DUP -- không --> NEW[Tạo lead NEW + CREATED] --> OK2
```

## 4. Mở lớp (UC-005)

```mermaid
flowchart TD
  A[Nhập thông tin lớp] --> V{Hợp lệ?}
  V -- không --> E1[Lỗi validate]
  V -- có --> G[Sinh danh sách buổi BR-023]
  G --> C{Trùng GV/phòng BR-021?}
  C -- có --> E2[Hiển thị xung đột, không lưu]
  C -- không --> T[Transaction: tạo lớp + buổi] --> R[Chi tiết lớp]
```

## 5. Làm bài → chấm → công bố (UC-009, UC-010)

```mermaid
sequenceDiagram
  actor HS as Học sinh
  participant S as Server
  actor GV as Giáo viên
  HS->>S: Mở bài (cần ghi danh ACTIVE, bài PUBLISHED)
  S-->>HS: Câu hỏi KHÔNG kèm đáp án; tạo submission IN_PROGRESS
  HS->>S: Lưu nháp (upsert answers)
  HS->>S: Nộp
  alt đã nộp / quá hạn không cho muộn
    S-->>HS: Từ chối
  else hợp lệ
    S->>S: Tự chấm MCQ/SHORT, status SUBMITTED hoặc GRADED
    S-->>HS: "Đã nộp, chờ công bố"
  end
  GV->>S: Chấm tự luận, nhận xét
  GV->>S: Công bố kết quả
  HS->>S: Xem kết quả
  S-->>HS: Điểm + đáp án + nhận xét
```

## 6. Điểm danh (UC-007)

```mermaid
flowchart TD
  A[Mở buổi] --> B{Vai trò}
  B -- GV --> C{Lớp của mình?}
  C -- không --> X[404]
  C -- có --> D{Trong khung BR-030?}
  D -- không --> RO[Chỉ xem]
  D -- có --> F[Form điểm danh mặc định có mặt]
  B -- STAFF/ADMIN --> D2{Trong khung?}
  D2 -- có --> F
  D2 -- không --> F2[Form + ô lý do bắt buộc + audit]
  F --> S[Lưu upsert] --> Z{Đã qua giờ kết thúc?}
  F2 --> S
  Z -- có --> CMP[Buổi COMPLETED]
```
