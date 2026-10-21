# UC-006: Ghi danh và đổi trạng thái ghi danh

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-019, FR-020 · BR-020, BR-021, BR-022, BR-026
- **Related features:** FEAT-020, FEAT-021 · **Channel:** Cổng quản lý
- **Primary actor:** Staff · **Supporting:** Admin · **Priority:** P0

## 1. Goal and success outcome
Học sinh được xếp vào lớp còn chỗ, không trùng lịch học; trạng thái học tập (đang học, bảo lưu, nghỉ, hoàn thành) phản ánh thực tế.

## 2. Preconditions
Lớp ở OPEN hoặc IN_PROGRESS; học sinh có tài khoản STUDENT ACTIVE.

## 3. Trigger
`/quan-ly/lop/[id]` → thẻ "Ghi danh học sinh".

## 4. Main success flow
1. Staff tìm theo tên hoặc mã HS (form GET `?q=`), hệ thống liệt kê ≤ 100 HS ACTIVE chưa có ghi danh còn hiệu lực ở lớp này: "Họ tên · HS26xxxx · lớp 9". Nhãn nhóm: "Chọn học sinh (còn N chỗ)".
2. Staff tích một hoặc nhiều HS (≤ 50), bấm "Ghi danh".
3. Với từng HS, một transaction: khóa dòng lớp → kiểm tra (BR-022 lớp đóng → đã ghi danh → BR-020 sĩ số → HS ACTIVE → BR-021 trùng lịch với lớp khác HS đang ACTIVE, chỉ xét buổi chưa kết thúc) → tạo ghi danh ACTIVE.
4. "Đã ghi danh k học sinh." HS xuất hiện ở bảng "Học sinh (n)".

## 5. Alternate flows
### A1 — HS từng nghỉ (DROPPED) ở lớp này
1. Bản ghi cũ được kích hoạt lại: ACTIVE, `enrolledAt = now` (unique `(classId, studentId)`).
### A2 — Đổi trạng thái ghi danh
1. Ở dòng HS, chọn "Chuyển sang" (chỉ hiện trạng thái hợp lệ) → "Lưu" → "Đã cập nhật.".
2. ACTIVE → PAUSED (bảo lưu, vẫn giữ chỗ) / DROPPED (nghỉ, nhả chỗ) / COMPLETED; PAUSED → ACTIVE / DROPPED. DROPPED, COMPLETED hiện "Trạng thái cuối".
### A3 — Ghi danh khi chuyển lead
1. Xem UC-003 bước 4 (cùng hàm `enrollInTx`).

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Lớp COMPLETED/CANCELLED | "Lớp đã kết thúc hoặc đã hủy, không ghi danh thêm được." | CLASS_CLOSED |
| E2 | HS đã có ghi danh ACTIVE/PAUSED/COMPLETED | "Học sinh đã ghi danh lớp này." | ALREADY_ENROLLED |
| E3 | Sĩ số (ACTIVE + PAUSED) ≥ capacity | "Lớp đã đủ sĩ số." | CLASS_FULL |
| E4 | HS bị khóa (sửa HTML/đổi trạng thái giữa chừng) | "Tài khoản học sinh đang bị khóa, không ghi danh được." | STUDENT_DISABLED |
| E5 | Trùng lịch lớp khác HS đang học | "Lịch lớp trùng với lớp khác học sinh đang học. Ví dụ: lớp X lúc HH:mm dd/MM/yyyy (N buổi trùng)." | SCHEDULE_CONFLICT |
| E6 | Ghi danh nhiều HS, HS thứ k lỗi | "Đã ghi danh k−1 học sinh. Dừng lại: <thông điệp E1–E5>" | — |
| E7 | Không chọn HS | "Chọn ít nhất một học sinh." | validate |
| E8 | Đổi trạng thái sai luồng / đồng thời | "Không thể chuyển ghi danh sang trạng thái này." / "Ghi danh vừa được cập nhật. Vui lòng tải lại trang." | INVALID_TRANSITION / STALE |

## 7. Business rules and validations
BR-020, BR-021, BR-022, BR-026 (trạng thái ghi danh).

## 8. Permissions and data effects
`enrollment.manage`. Ghi: enrollments. Hai Staff lấy chỗ cuối cùng cùng lúc: khóa dòng lớp → người sau nhận CLASS_FULL.

## 9. Postconditions
Sĩ số ≤ capacity tại mọi thời điểm; mỗi (lớp, HS) một bản ghi.

## 10. Non-functional constraints
Transaction cho từng HS; ghi danh đã thành công trước lỗi không bị hoàn tác (thông báo nêu rõ số đã ghi danh).

## 11. UI/API/data references
SCREEN-014 · API-013 · Q-010 · ENT-009.

## 12. Acceptance criteria / test scenarios
TC-016 (đủ sĩ số), TC-017 (lớp đóng), TC-018 (chuyển trạng thái), TC-044 (HS bị khóa), TC-UAT-06.

## 13. Open questions / assumptions / history
- Chuyển lớp (đổi từ lớp A sang B giữ lịch sử) = DROPPED lớp A + ghi danh lớp B; tính năng "chuyển lớp" một bước: Pha 2.
- v1.1: E4 (GAP-10), A1.
