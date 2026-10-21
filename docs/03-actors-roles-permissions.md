# 03 — Actors, vai trò và phân quyền

Xác thực (authentication) = biết ai đang đăng nhập (phiên cookie). Phân quyền (authorization) = vai trò + phạm vi dữ liệu, **luôn kiểm tra phía server** trong mỗi server action/trang (`src/server/auth/policy.ts`). Ẩn nút trên UI không phải là phân quyền.

Mỗi tài khoản có đúng **một** vai trò (DECISION-D04).

## 1. Vai trò

| ID | Vai trò | Mã |
|---|---|---|
| ROLE-001 | Quản trị viên | `ADMIN` |
| ROLE-002 | Giáo vụ / Tư vấn | `STAFF` |
| ROLE-003 | Giáo viên | `TEACHER` |
| ROLE-004 | Học sinh | `STUDENT` |
| ROLE-005 | Phụ huynh | `PARENT` |
| ACT-000 | Khách (chưa đăng nhập) | — |

## 2. Ma trận quyền

C = tạo, R = xem, U = sửa, D = xóa/ẩn, X = thao tác đặc biệt. "own" = trong phạm vi của mình (mục 3).

| Tài nguyên | Khách | Admin | Staff | Teacher | Student | Parent |
|---|---|---|---|---|---|---|
| Môn/khóa đã xuất bản | R | CRUD | R | R | R | R |
| Lead | C (qua form) | CRUD, X chuyển | CRU, X chuyển | — | — | — |
| Người dùng | — | CRUD, X khóa/vai trò | C học sinh/phụ huynh, R | R own (học sinh lớp mình) | R self | R self + con |
| Liên kết PH–HS | — | CRUD | CRUD | — | — | R own |
| Phòng | — | CRUD | R | — | — | — |
| Lớp, buổi | — | CRUD | CRUD | R own | R own | R own (con) |
| Ghi danh | — | CRUD | CRUD | R own | R own | R own (con) |
| Điểm danh trong khung | — | U | U | CU own | R own | R own (con) |
| Điểm danh ngoài khung | — | U + lý do | U + lý do | — | — | — |
| Bài tập | — | R | R | CRUD own | R own (PUBLISHED/CLOSED) | — |
| Bài nộp | — | R | R | R/U chấm own | CRU own (đến khi nộp) | — |
| Điểm đã công bố | — | R | R | R own | R own | R own (con) |
| Audit log | — | R | — | — | — | — |

## 3. Phạm vi dữ liệu (ownership)

| Vai trò | Được truy cập |
|---|---|
| ADMIN | Tất cả |
| STAFF | Tất cả dữ liệu đào tạo và tuyển sinh; không quản lý vai trò và không xem audit |
| TEACHER | Lớp có `classes.teacherId = me`, hoặc buổi có `class_sessions.teacherId = me`; học sinh ghi danh vào các lớp đó |
| STUDENT | Chính mình; lớp có ghi danh của mình (ACTIVE để làm bài; mọi trạng thái để xem lịch sử) |
| PARENT | Học sinh có liên kết trong `guardianships`; chỉ đọc |

Sai phạm vi → trả trang 404 (không tiết lộ bản ghi có tồn tại hay không). Sai vai trò → 403/chuyển về dashboard của mình.

## 4. Điều cấm

- Học sinh/phụ huynh không bao giờ nhận `correctOption`/`acceptedAnswers`/điểm trước khi bài được công bố.
- Không ai xóa audit log.
- Admin không tự khóa hoặc tự hạ vai trò của chính mình (tránh mất quyền quản trị cuối cùng).

## 5. Cách kiểm thử

- Unit test cho từng hàm policy: đúng vai trò + đúng phạm vi → cho phép; đúng vai trò + khác phạm vi → từ chối; sai vai trò → từ chối.
- Kiểm thử thủ công bằng tài khoản seed (giáo viên A không mở được lớp của giáo viên B qua URL trực tiếp).
