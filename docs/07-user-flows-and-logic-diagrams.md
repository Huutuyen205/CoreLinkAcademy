# 07 — Sitemap, hành trình người dùng và sơ đồ logic

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) |
| Trạng thái sơ đồ | §1–§3, §5–§10: **đã đối chiếu với code** (chưa chạy trên DB thật — RISK-007). Phần đánh dấu *(bổ sung P3)* là hành vi thêm trong phiên 3 |
| Owner | Trợ lý (BA + Process Analyst) |

## 1. Sitemap

```text
Công khai (PublicShell: header Khóa học · Học thử · Đăng nhập; footer)
  /                               SCREEN-001 Trang chủ (FR-001)
  /khoa-hoc?mon=&khoi=            SCREEN-002 Danh mục (FR-002)
  /khoa-hoc/[slug]                SCREEN-003 Chi tiết khóa (FR-003)
  /dang-ky-hoc-thu?khoa=          SCREEN-004 Form học thử (FR-004)
  /dang-ky-hoc-thu/cam-on         SCREEN-005 Cảm ơn (noindex)
  /dang-nhap                      SCREEN-006 Đăng nhập (noindex)
Mọi vai trò đã đăng nhập
  /doi-mat-khau                   SCREEN-007 (FR-012)
Quản lý — ADMIN, STAFF (AppShell, sidebar)
  /quan-ly                        SCREEN-008 Tổng quan (FR-034)
  /quan-ly/lead                   SCREEN-009 Danh sách lead (FR-006)
  /quan-ly/lead/moi               SCREEN-011 Nhập lead (FR-006)            (bổ sung P3)
  /quan-ly/lead/[id]              SCREEN-010 Chi tiết lead (FR-007..009)
  /quan-ly/lop                    SCREEN-012 Danh sách lớp
  /quan-ly/lop/moi                SCREEN-013 Mở lớp (FR-017, 018)
  /quan-ly/lop/[id]               SCREEN-014 Chi tiết lớp (FR-019..021)
  /quan-ly/buoi/[id]              SCREEN-015 Điểm danh quản lý (FR-024)
  /quan-ly/hoc-vien               SCREEN-016 Học viên + liên kết (FR-013, 014)
  — chỉ ADMIN —
  /quan-ly/nguoi-dung             SCREEN-017 Người dùng (FR-013)
  /quan-ly/nguoi-dung/[id]        SCREEN-018 Chi tiết người dùng
  /quan-ly/khoa-hoc               SCREEN-019 Khóa học (FR-015)
  /quan-ly/khoa-hoc/[id]          SCREEN-020 Sửa khóa
  /quan-ly/mon-hoc                SCREEN-021 Môn học
  /quan-ly/phong                  SCREEN-022 Phòng (FR-016)
  /quan-ly/nhat-ky                SCREEN-023 Nhật ký (FR-035)
Giáo viên — TEACHER (sidebar ≥1024px, thanh đáy < 1024px)
  /giao-vien                      SCREEN-024 Tổng quan
  /giao-vien/lich?tuan=           SCREEN-025 Lịch dạy (FR-022)
  /giao-vien/lop                  SCREEN-026 Lớp của tôi
  /giao-vien/lop/[id]             SCREEN-027 Chi tiết lớp + bảng điểm (FR-033)
  /giao-vien/buoi/[id]            SCREEN-028 Điểm danh (FR-023)
  /giao-vien/bai-tap/moi?lop=     SCREEN-029 Tạo bài (FR-027)
  /giao-vien/bai-tap/[id]         SCREEN-030 Soạn/giao/công bố (FR-027, 028, 032)
  /giao-vien/bai-tap/[id]/bai-nop SCREEN-031 Danh sách bài nộp
  /giao-vien/bai-nop/[id]         SCREEN-032 Chấm bài (FR-031)
Học sinh — STUDENT
  /hoc-sinh?tuan=                 SCREEN-033 Tổng quan
  /hoc-sinh/lich?tuan=            SCREEN-034 Lịch học
  /hoc-sinh/bai-tap               SCREEN-035 Bài tập
  /hoc-sinh/bai-tap/[id]          SCREEN-036 Làm bài / xem kết quả (FR-029..032)
  /hoc-sinh/ket-qua               SCREEN-037 Kết quả + chuyên cần (FR-025, 033)
Phụ huynh — PARENT
  /phu-huynh?con=&tuan=           SCREEN-038 Theo dõi con (FR-034)
Hệ thống
  404 · lỗi · loading             SCREEN-039
```

## 2. Kiểm tra truy cập cho mọi request nội bộ

Mục đích: một sơ đồ cho mọi trang và Server Action nội bộ (NFR-001). Actor: mọi người. UC: tất cả.

```mermaid
flowchart TD
  R[Request trang hoặc Server Action] --> C{"Cookie cl_session hợp lệ?<br/>phiên chưa hết hạn, user ACTIVE"}
  C -- không --> L["Chuyển /dang-nhap"]
  C -- có --> M{mustChangePassword?}
  M -- có, không phải /doi-mat-khau --> P["Chuyển /doi-mat-khau"]
  M -- không --> V{Vai trò thuộc khu vực?}
  V -- không --> H["Chuyển tổng quan của vai trò"]
  V -- có --> Z[Zod validate input]
  Z -- lỗi --> FE[ActionState: fieldErrors + values]
  Z -- ok --> S{Service: assertCan + phạm vi dữ liệu}
  S -- ForbiddenError --> N["Trang 404"]
  S -- DomainError --> DE[ActionState: thông điệp + chi tiết]
  S -- ok --> T[(Transaction MySQL)]
  T -- lỗi bất ngờ --> E["Trang lỗi chung, không lộ stack"]
  T -- ok --> OK[revalidatePath + thông báo hoặc redirect]
```

## 3. Đăng nhập và điều hướng (UC-004)

```mermaid
flowchart TD
  A[Gửi form đăng nhập] --> IP{"Quá 20 lần/10 phút/IP? BR-009"}
  IP -- có --> E0[Quá nhiều lần đăng nhập từ thiết bị này]
  IP -- không --> V{Ô trống?}
  V -- có --> E1[Lỗi dưới ô]
  V -- không --> U{"Tìm user theo email/SĐT"}
  U -- không có --> D[Băm giả] --> E2["Thông tin đăng nhập không đúng<br/>giữ ô email/SĐT"]
  U -- có --> K{Đang khóa tạm?}
  K -- có --> E3[Tạm khóa, thử lại sau 15 phút]
  K -- không --> PW{Đúng mật khẩu?}
  PW -- sai --> CNT[Tăng bộ đếm] --> F5{Lần thứ 5?}
  F5 -- có --> E4[Khóa 15 phút]
  F5 -- không --> E2
  PW -- đúng --> ST{ACTIVE?}
  ST -- không --> E5[Tài khoản đã bị khóa]
  ST -- có --> S[Reset bộ đếm, tạo phiên 7 ngày]
  S --> G{mustChangePassword?}
  G -- có --> CP["/doi-mat-khau"]
  G -- không --> RO{Vai trò}
  RO -- "ADMIN/STAFF" --> Q["/quan-ly"]
  RO -- TEACHER --> T["/giao-vien"]
  RO -- STUDENT --> HS["/hoc-sinh"]
  RO -- PARENT --> PH["/phu-huynh"]
```

## 4. Hành trình theo cổng

### 4.1 Phụ huynh tiềm năng → học viên (xuyên vai trò, swimlane)

```mermaid
sequenceDiagram
  actor K as Khách (phụ huynh)
  participant W as Web công khai
  actor S as Staff
  participant Q as Cổng quản lý
  actor P as Phụ huynh (tài khoản)
  K->>W: Tìm khóa theo môn/khối (UC-013)
  K->>W: Gửi form học thử (UC-001)
  W-->>Q: Lead NEW xuất hiện, ô "Lead mới" +1
  S->>Q: Mở lead, gọi điện, ghi chú (UC-002)
  S->>Q: NEW → CONTACTED → TRIAL_SCHEDULED → TRIAL_DONE
  alt Không theo học
    S->>Q: → LOST + lý do
  else Đồng ý nhập học
    S->>Q: Chuyển thành học viên + chọn lớp (UC-003)
    Q-->>S: Mật khẩu tạm hiển thị một lần
    S-->>P: Gửi thông tin đăng nhập (ngoài hệ thống)
    P->>Q: Đăng nhập, đổi mật khẩu (UC-004)
    P->>Q: Theo dõi con (UC-011)
  end
  Note over Q: Nếu NEW > 24h: nhãn "Quá hạn", ô cảnh báo trên tổng quan
```

### 4.2 Giáo viên — một tuần dạy

1. Đăng nhập → `/giao-vien`: "Buổi dạy hôm nay".
2. Đến giờ (từ 30 phút trước) → "Điểm danh" → mặc định có mặt → chỉnh em vắng → Lưu (≤ 30 s).
3. Tối: `/giao-vien/lop/[id]` → "Tạo bài tập" → thêm câu → "Giao bài cho lớp".
4. Sau hạn: "Bài chờ chấm" → chấm tự luận → "Công bố kết quả".
5. Xem cảnh báo vắng 2 buổi liên tiếp → liên hệ gia đình / trung tâm.

### 4.3 Học sinh — làm bài

1. `/hoc-sinh` → "Bài cần làm" → mở bài → làm → "Lưu nháp" (tùy) → "Nộp bài" (xác nhận).
2. Sau khi GV công bố: `/hoc-sinh/ket-qua` → bấm tên bài → xem điểm, đáp án, nhận xét.

### 4.4 Quản trị viên (Admin) — một ngày (vai trò giáo vụ đã bỏ theo DECISION-D35)

1. `/quan-ly`: xử lý "Lead quá 24 giờ" → `/quan-ly/lead?quahan=1`.
2. Khách gọi điện → "Nhập lead" (UC-020).
3. Mở lớp mới (UC-005) → ghi danh HS (UC-006).
4. GV báo ốm → dời/hủy buổi (UC-015).
5. GV quên điểm danh quá 24h → `/quan-ly/buoi/[id]` sửa với lý do.

## 5. Đăng ký học thử (UC-001)

```mermaid
flowchart TD
  S[Gửi form] --> HP{Honeypot có giá trị?}
  HP -- có --> OK[Trang cảm ơn, không lưu]
  HP -- không --> RL{"Quá 5 lần/10 phút/IP?"}
  RL -- có --> ERR1[Báo thử lại sau 10 phút, giữ giá trị]
  RL -- không --> V{Hợp lệ + đã đồng ý?}
  V -- không --> ERR2[Lỗi từng ô, giữ giá trị]
  V -- có --> SUB{Môn tồn tại?}
  SUB -- không --> ERR3[Lỗi ô môn]
  SUB -- có --> N[Chuẩn hóa SĐT]
  N --> DUP{Lead đang mở trùng SĐT?}
  DUP -- có --> ACT[Thêm hoạt động RESUBMITTED] --> OK2[Trang cảm ơn]
  DUP -- không --> NEW[Tạo lead NEW + CREATED] --> OK2
```

## 6. Nhập lead thủ công (UC-020) *(bổ sung P3)*

```mermaid
flowchart TD
  A[Staff gửi form nhập lead] --> V{Hợp lệ? nguồn ∈ 4 giá trị}
  V -- không --> E1[Lỗi từng ô]
  V -- có --> D{Lead đang mở trùng SĐT?}
  D -- có --> E2["SĐT này đang có lead chưa xử lý xong<br/>+ liên kết lead cũ"]
  D -- không --> C[Tạo lead NEW nguồn đã chọn + CREATED có actor]
  C --> R["/quan-ly/lead/id + Đã tạo lead"]
```

## 7. Chuyển lead thành học viên (UC-003)

```mermaid
sequenceDiagram
  actor S as Staff
  participant A as convertLeadAction
  participant SV as leads/service
  participant DB as MySQL (1 transaction)
  S->>A: Gửi form chuyển
  A->>A: requireRole(ADMIN, STAFF), Zod
  A->>SV: convertLead(actor, input)
  SV->>SV: Sinh + băm 2 mật khẩu tạm
  loop tối đa 3 lần nếu va chạm mã HS
    SV->>DB: BEGIN
    SV->>DB: Đọc lead (trạng thái chuyển được?)
    alt không
      SV-->>A: INVALID_TRANSITION (ROLLBACK)
    end
    SV->>DB: Tìm user theo SĐT PH
    alt là PARENT
      Note over SV: Dùng lại
    else vai trò khác
      SV-->>A: PHONE_TAKEN_BY_OTHER_ROLE (ROLLBACK)
    else chưa có
      SV->>DB: Tạo PARENT (mustChangePassword)
    end
    SV->>DB: Tạo STUDENT (mã HS), guardianship
    opt chọn lớp
      SV->>DB: SELECT lớp FOR UPDATE, kiểm tra BR-020..022, 029, tạo enrollment
    end
    SV->>DB: Lead ENROLLED, hoạt động CONVERTED, audit lead.convert
    SV->>DB: COMMIT
  end
  SV-->>A: mã HS + thông tin đăng nhập
  A-->>S: Thẻ "Mật khẩu tạm — chỉ hiển thị một lần"
```

## 8. Mở lớp (UC-005) và ghi danh (UC-006)

```mermaid
flowchart TD
  A[Nhập thông tin lớp] --> V{Hợp lệ?}
  V -- không --> E1[Lỗi validate]
  V -- có --> R{"Khóa/GV/phòng hợp lệ?<br/>sĩ số ≤ sức chứa phòng"}
  R -- không --> E2[Lỗi ô tương ứng]
  R -- có --> G[Sinh danh sách buổi BR-023]
  G --> C{"Trùng GV/phòng BR-021?"}
  C -- có --> E3[Danh sách xung đột, không lưu]
  C -- không --> T[Transaction: tạo lớp + buổi]
  T -- mã lớp trùng --> E4[Mã lớp đã tồn tại]
  T -- ok --> R2[Chi tiết lớp]
```

```mermaid
flowchart TD
  A[Chọn HS → Ghi danh] --> L[Với từng HS: BEGIN, khóa dòng lớp]
  L --> C1{"Lớp COMPLETED/CANCELLED?"}
  C1 -- có --> X1[CLASS_CLOSED]
  C1 -- không --> C2{"Đã có ghi danh khác DROPPED?"}
  C2 -- có --> X2[ALREADY_ENROLLED]
  C2 -- không --> C3{Sĩ số ≥ capacity?}
  C3 -- có --> X3[CLASS_FULL]
  C3 -- không --> C4{HS ACTIVE?}
  C4 -- không --> X4[STUDENT_DISABLED]
  C4 -- có --> C5{Trùng lịch lớp khác HS đang học?}
  C5 -- có --> X5[SCHEDULE_CONFLICT + ví dụ]
  C5 -- không --> W{Có bản ghi DROPPED?}
  W -- có --> RE[Kích hoạt lại ACTIVE]
  W -- không --> NEW[Tạo ACTIVE]
  RE --> NX[HS kế tiếp]
  NEW --> NX
  X1 & X2 & X3 & X4 & X5 --> STOP[Dừng: Đã ghi danh k HS. Dừng lại: lý do]
```

## 9. Điểm danh (UC-007)

```mermaid
flowchart TD
  A[Mở buổi] --> B{Vai trò}
  B -- GV --> C{"GV chính hoặc GV của buổi?"}
  C -- không --> X[404]
  C -- có --> CX{Buổi CANCELLED?}
  B -- "ADMIN" --> CX
  CX -- có --> CA[Alert buổi đã hủy, không form]
  CX -- không --> D{Trong khung BR-030?}
  D -- có --> F[Form, mặc định có mặt]
  D -- không, GV --> RO[Chỉ xem + hướng dẫn liên hệ trung tâm]
  D -- không, quản lý --> F2[Form + ô lý do bắt buộc]
  F --> S[Lưu: lọc HS thuộc lớp, upsert]
  F2 --> RS{Có lý do?}
  RS -- không --> ER[REASON_REQUIRED]
  RS -- có --> S2[Lưu + audit before/after]
  S --> Z{Đã qua giờ kết thúc và SCHEDULED?}
  S2 --> Z
  Z -- có --> CMP[Buổi COMPLETED]
  Z -- không --> DONE[Đã lưu điểm danh n học sinh]
  CMP --> DONE
```

## 10. Bài tập: làm → chấm → công bố (UC-008..UC-010)

```mermaid
sequenceDiagram
  actor GV as Giáo viên
  participant S as Server
  actor HS as Học sinh
  actor PH as Phụ huynh
  GV->>S: Tạo bài DRAFT, thêm câu, giao (≥1 câu, hạn tương lai)
  HS->>S: Mở bài (ghi danh ACTIVE, bài PUBLISHED)
  S-->>HS: Câu hỏi qua toStudentQuestion() — KHÔNG có đáp án; tạo IN_PROGRESS
  HS->>S: Lưu nháp (upsert answers)
  HS->>S: Nộp
  alt đã nộp / quá hạn không cho muộn / không còn ACTIVE / bài đóng
    S-->>HS: Từ chối có thông điệp
  else hợp lệ
    S->>S: updateMany where IN_PROGRESS; tự chấm MCQ/SHORT
    S-->>HS: SUBMITTED (có tự luận) hoặc GRADED; "chờ công bố"
  end
  GV->>S: Chấm tự luận, nhận xét → GRADED
  GV->>S: Công bố (thẻ báo "Còn N bài chưa chấm" nếu có)
  HS->>S: Xem kết quả
  alt bài nộp GRADED (BR-047)
    S-->>HS: Điểm + đáp án + nhận xét
  else còn SUBMITTED
    S-->>HS: "Đang chờ giáo viên chấm" — không điểm, không đáp án
  end
  PH->>S: Xem điểm của con (chỉ bài đã công bố + đã chấm)
  GV->>S: Sửa điểm sau công bố → audit grade.update_after_publish
```

## 11. Phụ huynh theo dõi con (UC-011)

```mermaid
flowchart TD
  A["/phu-huynh?con="] --> B{Có con liên kết ACTIVE?}
  B -- không --> E[EmptyState liên hệ trung tâm]
  B -- có --> C{?con= có giá trị?}
  C -- không --> D[Chọn con đầu tiên]
  C -- có --> F{Thuộc danh sách con?}
  F -- không --> X[404]
  F -- có --> D2[Con đã chọn]
  D --> G[Lịch tuần + chuyên cần + điểm đã công bố & đã chấm]
  D2 --> G
  G --> H{Dữ liệu rỗng?}
  H -- có --> EM[Thông điệp rỗng từng thẻ]
```

## 12. Hủy/dời buổi (UC-015)

```mermaid
flowchart TD
  A[Dời buổi] --> V{Hợp lệ + thời điểm mới ở tương lai?}
  V -- không --> E1[Lỗi ô]
  V -- có --> T[BEGIN]
  T --> S{Buổi còn SCHEDULED?}
  S -- không --> E2[INVALID_TRANSITION]
  S -- có --> C{"Trùng GV/phòng, bỏ qua chính buổi?"}
  C -- có --> E3[SCHEDULE_CONFLICT + danh sách]
  C -- không --> U[Cập nhật giờ + audit session.reschedule] --> OK[Đã dời buổi học]
  B[Hủy buổi + xác nhận] --> S2{SCHEDULED?}
  S2 -- không --> E2
  S2 -- có --> U2[CANCELLED + lý do + audit session.cancel] --> OK2[Đã hủy buổi học]
```
