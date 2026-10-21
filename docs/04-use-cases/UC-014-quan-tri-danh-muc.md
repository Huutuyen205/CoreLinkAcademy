# UC-014: Quản trị môn, khóa học và phòng học

- **Status:** Approved · **Version:** 1.0 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-015, FR-016 · BR-050
- **Related features:** FEAT-022..FEAT-024 · **Channel:** Cổng quản lý
- **Primary actor:** Admin · **Priority:** P1

## 1. Goal and success outcome
Danh mục công khai đúng và đầy đủ; dữ liệu nền (môn, khóa, phòng) không bị xóa khi đang được dùng.

## 2. Preconditions
Admin.

## 3. Trigger
Menu "Khóa học", "Môn học", "Phòng học".

## 4. Main success flow — khóa học
1. `/quan-ly/khoa-hoc`: bảng khóa (tên, môn, khối, lớp đã mở, Đã xuất bản/Ẩn, Nổi bật).
2. "Thêm khóa học": môn, tên, slug, trình độ, từ khối, đến khối, số buổi, phút/buổi, học phí tham khảo (trống = Liên hệ), tóm tắt, mô tả, mục tiêu (mỗi dòng một ý), lộ trình ("Tiêu đề | chi tiết" mỗi dòng), Xuất bản, Nổi bật.
3. "Tạo khóa học" → chuyển trang sửa "Đã lưu."; trang công khai cập nhật ngay.

## 5. Alternate flows
- **A1 Sửa khóa** `/quan-ly/khoa-hoc/[id]`: "Lưu khóa học"; nếu đã xuất bản có liên kết "Xem trang công khai".
- **A2 Ẩn khóa:** bỏ "Xuất bản" → không còn ở trang công khai (lớp hiện có không bị ảnh hưởng).
- **A3 Xóa khóa:** chỉ khi chưa có lớp (xác nhận "Xóa vĩnh viễn khóa học này?"); lead đang tham chiếu khóa → bỏ tham chiếu; → danh sách "Đã xóa khóa học.".
- **A4 Môn học** `/quan-ly/mon-hoc`: mỗi môn một thẻ "Tên · n khóa" sửa tại chỗ (tên, slug, thứ tự, mô tả); "Thêm môn"; **"Xóa môn"** khi n = 0 (xác nhận) → "Đã xóa môn học.".
- **A5 Phòng** `/quan-ly/phong`: thẻ mỗi phòng (tên, sức chứa) sửa tại chỗ; "Xóa phòng" khi chưa dùng; "Thêm phòng".

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Slug trùng | Lỗi ô "Slug đã tồn tại." | DUPLICATE_SLUG |
| E2 | Slug sai định dạng | "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang." | validate |
| E3 | Khối đến < khối từ | "Khối đến phải ≥ khối từ." | validate |
| E4 | Học phí không hợp lệ | "Học phí không hợp lệ." | validate |
| E5 | Xóa khóa có lớp | "Khóa đã có lớp nên không xóa được. Hãy tắt xuất bản để ẩn khóa." | HAS_CLASSES |
| E6 | Xóa môn có khóa | "Môn đang có khóa học nên không xóa được." | HAS_COURSES |
| E7 | Tên phòng trùng | "Tên phòng đã tồn tại." | DUPLICATE_NAME |
| E8 | Xóa phòng đang dùng | "Phòng đang được dùng cho lớp/buổi học nên không xóa được." | IN_USE |
| E9 | Staff/vai trò khác | Chuyển về tổng quan | — |

## 7. Business rules and validations
BR-050. Môn: tên 2–80, slug ≤ 80, thứ tự 0–999. Khóa: xem 02 FR-015. Phòng: tên 1–60, sức chứa 1–500. Ô checkbox giữ trạng thái khi lỗi validate (GAP-08).

## 8. Permissions and data effects
`catalog.manage`, `room.manage`. Ghi: subjects, courses, rooms, leads (bỏ tham chiếu khi xóa). Không audit.

## 9. Postconditions
Không có khóa mồ côi môn; không có lớp mồ côi khóa/phòng.

## 10. Non-functional constraints
Mọi thay đổi gọi `revalidatePath("/", "layout")` để trang công khai đọc dữ liệu mới.

## 11. UI/API/data references
SCREEN-019..022 · API-010, API-022 · Q-033 · ENT-004, ENT-005, ENT-006.

## 12. Acceptance criteria / test scenarios
TC-041 (xóa môn có khóa → HAS_COURSES), TC-UAT-14.

## 13. Open questions / assumptions / history
- Ảnh minh họa khóa học (cần upload): Pha 2.
