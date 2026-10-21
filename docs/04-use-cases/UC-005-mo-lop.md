# UC-005: Mở lớp và quản lý trạng thái lớp

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-017, FR-018, FR-020 (hệ quả kết thúc lớp) · BR-021, BR-023, BR-024, BR-025
- **Related features:** FEAT-017, FEAT-018, FEAT-019 · **Channel:** Cổng quản lý
- **Primary actor:** Staff · **Supporting:** Admin · **Priority:** P0

## 1. Goal and success outcome
Tạo lớp với đủ buổi học đúng giờ Việt Nam, không trùng giáo viên/phòng.

## 2. Preconditions
Có ≥ 1 khóa học (kể cả chưa xuất bản) và ≥ 1 giáo viên ACTIVE.

## 3. Trigger
`/quan-ly/lop` → "Mở lớp mới".

## 4. Main success flow
1. Form 2 cột: Khóa học ("Tên (N buổi)"), Mã lớp (gợi ý "TOAN9-K1"), Giáo viên, Phòng ("Chưa xếp phòng" hoặc "P.101 (16 chỗ)"), Ngày bắt đầu (hôm nay), Các thứ trong tuần (checkbox Thứ Hai..Chủ nhật), Giờ bắt đầu (18:00), Giờ kết thúc (19:30), Số buổi, Sĩ số tối đa (16).
2. Staff điền và bấm "Mở lớp".
3. Hệ thống validate, kiểm tra khóa/GV/phòng, sĩ số ≤ sức chứa phòng.
4. Sinh N buổi theo BR-023 (ngày có thứ đã chọn, từ ngày bắt đầu).
5. Kiểm tra trùng GV/phòng (BR-021) với buổi chưa hủy hiện có.
6. Transaction: tạo lớp OPEN + N buổi SCHEDULED (index 1..N).
7. Chuyển `/quan-ly/lop/[id]` với "Đã mở lớp và sinh lịch học."

## 5. Alternate flows
### A1 — Không xếp phòng
1. Chỉ kiểm tra trùng giáo viên; buổi không có phòng.
### A2 — Đổi trạng thái lớp (thẻ "Trạng thái lớp", có xác nhận)
- OPEN → IN_PROGRESS (bắt đầu học).
- OPEN/IN_PROGRESS → COMPLETED: mọi ghi danh ACTIVE → COMPLETED (BR-025).
- OPEN/IN_PROGRESS → CANCELLED: buổi SCHEDULED trong tương lai → CANCELLED "Lớp bị hủy" (BR-025).
- COMPLETED/CANCELLED: trạng thái cuối, thẻ ẩn.
### A3 — Xóa lớp
1. Chỉ khi lớp chưa có ghi danh nào (kể cả DROPPED) → thẻ "Xóa lớp" (xác nhận "Xóa lớp và toàn bộ buổi học?") → xóa lớp, buổi, bài tập (cascade) → `/quan-ly/lop` "Đã xóa lớp.".

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Trùng lịch | "Trùng lịch N buổi. Vui lòng đổi giờ, giáo viên hoặc phòng." + danh sách ≤ 30 dòng "Giáo viên/Phòng đã có lớp X lúc HH:mm dd/MM/yyyy" | SCHEDULE_CONFLICT |
| E2 | Sĩ số > sức chứa phòng | Lỗi ô sĩ số "Phòng chỉ chứa N học sinh." | CAPACITY_OVER_ROOM |
| E3 | Mã lớp đã tồn tại | Lỗi ô mã lớp | DUPLICATE_CODE |
| E4 | Giờ kết thúc ≤ giờ bắt đầu; chưa chọn thứ; số ngoài khoảng | Lỗi ô | validate |
| E5 | Khóa/GV/phòng không hợp lệ (GV bị khóa, id sai) | Lỗi ô tương ứng | INVALID |
| E6 | Đổi trạng thái sai luồng | "Không thể chuyển lớp sang trạng thái này." | INVALID_TRANSITION |
| E7 | Xóa lớp có ghi danh | "Lớp đã có ghi danh, chỉ có thể hủy lớp." | HAS_ENROLLMENTS |
| E8 | Chưa có khóa hoặc GV | Alert cảnh báo thay cho form | — |

## 7. Business rules and validations
BR-021, BR-023, BR-024 (sức chứa phòng), BR-025 (hệ quả trạng thái lớp). Mã lớp viết hoa `[A-Z0-9._-]` 2–30; số buổi 1–200; sĩ số 1–100; ít nhất một thứ.

## 8. Permissions and data effects
`class.manage`. Ghi: classes, class_sessions; khi đổi trạng thái: enrollments/class_sessions. Không audit.

## 9. Postconditions
Lớp có đúng `totalSessions` buổi; không buổi nào chồng giờ với buổi chưa hủy của cùng GV/phòng tại thời điểm tạo.

## 10. Non-functional constraints
Giờ nhập là giờ VN; DB lưu UTC (NFR-005). Transaction đảm bảo không có lớp không buổi.

## 11. UI/API/data references
SCREEN-012, 013, 014 · API-011, API-012 · Q-008, Q-009, Q-012 · ENT-007, ENT-008.

## 12. Acceptance criteria / test scenarios
- TC-013: Thứ Hai/Tư/Sáu 18:00–19:30 từ Thứ Tư 2026-10-21, 5 buổi → 21, 23, 26, 28, 30/10 lúc 11:00Z; chỉ Chủ nhật từ 21/10 → 25/10 và 01/11 (`schedule.test.ts`).
- Ranh giới BR-021: buổi kết thúc 12:30 và buổi bắt đầu 12:30 không trùng.
- TC-014: trùng khoảng, bỏ qua buổi hủy. TC-015 (integration): trùng GV → danh sách xung đột, không lưu.

## 13. Open questions / assumptions / history
- Ngày nghỉ lễ không tự bỏ qua — Staff dời/hủy buổi (UC-015). Ý tưởng lịch nghỉ lễ: Pha 2.
- v1.1: A2, A3, bảng ngoại lệ.
