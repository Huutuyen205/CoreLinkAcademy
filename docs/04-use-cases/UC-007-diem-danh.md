# UC-007: Điểm danh buổi học

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-023, FR-024 · BR-030, BR-031
- **Related features:** FEAT-025, FEAT-026 · **Channel:** Cổng GV (điện thoại), cổng quản lý
- **Primary actor:** Giáo viên · **Supporting:** Staff/Admin (ngoài khung) · **Priority:** P0

## 1. Goal and success outcome
Điểm danh một buổi 16 HS trong ≤ 30 giây (GOAL-003); sửa sau khung có lý do và truy vết.

## 2. Preconditions
Buổi không bị hủy; GV là GV chính của lớp hoặc GV của buổi (dạy thay); lớp có HS ghi danh ACTIVE.

## 3. Trigger
GV: "Điểm danh" ở "Buổi dạy hôm nay", lịch dạy, hoặc chi tiết lớp → `/giao-vien/buoi/[id]`. Staff: "Điểm danh" ở chi tiết lớp → `/quan-ly/buoi/[id]`.

## 4. Main success flow
1. Tiêu đề "Điểm danh lớp X — buổi n", ngày, giờ, phòng, khóa, nhãn trạng thái buổi.
2. Danh sách đánh số theo tên: mỗi HS là `fieldset` với 4 nút radio lớn (≥ 44px) Có mặt / Muộn / Vắng / Có phép — mặc định bản ghi đã có, nếu chưa có thì "Có mặt" — và ô ghi chú.
3. GV chỉ chỉnh các em vắng/muộn, bấm "Lưu điểm danh" (nút dính đáy màn hình).
4. Hệ thống: kiểm tra khung BR-030, chỉ nhận HS thuộc lớp, upsert từng bản ghi (`markedBy`, `markedAt`); nếu đã qua giờ kết thúc và buổi SCHEDULED → COMPLETED.
5. "Đã lưu điểm danh n học sinh."; lưu lại được nhiều lần trong khung.

## 5. Alternate flows
### A1 — Admin ngoài khung
1. Alert cảnh báo "Ngoài khung điểm danh của giáo viên: cần nhập lý do, thay đổi được ghi vào nhật ký."; form có ô "Lý do sửa ngoài khung thời gian" bắt buộc. (Giáo vụ đã bỏ theo DECISION-D35).
2. Lưu → audit `attendance.override` {reason, before[], after[]}.
### A2 — GV dạy thay
1. GV của buổi (khác GV chính) mở được buổi đó; ở chi tiết lớp chỉ thấy các buổi mình dạy, không thấy bài tập/bảng điểm.
### A3 — HS đã nghỉ sau khi có bản ghi
1. HS không còn ACTIVE nhưng có bản ghi ở buổi này vẫn hiện để sửa lịch sử.

## 6. Exception / failure flows
| ID | Điều kiện | Hành vi | Mã |
|---|---|---|---|
| E1 | GV ngoài khung | Chỉ xem: danh sách tên + nhãn trạng thái/"Chưa điểm danh"; Alert "Ngoài khung điểm danh (30 phút trước giờ học đến 24 giờ sau giờ kết thúc). Bạn chỉ xem được; liên hệ trung tâm nếu cần sửa." Nếu vẫn gửi (sửa HTML): "Đã hết thời gian điểm danh của giáo viên. Liên hệ trung tâm nếu cần sửa." | OUTSIDE_WINDOW |
| E2 | Buổi đã hủy | Alert "Buổi học đã hủy: <lý do>.", không có form; gửi: "Buổi học đã bị hủy, không điểm danh được." | SESSION_CANCELLED |
| E3 | Admin ngoài khung thiếu lý do | Lỗi ô lý do "Sửa điểm danh ngoài khung thời gian cần nhập lý do." | REASON_REQUIRED |
| E4 | Lớp chưa có HS ACTIVE | "Lớp chưa có học sinh đang học." | — |
| E5 | Danh sách gửi lên không có HS hợp lệ | "Không có học sinh nào để điểm danh." | EMPTY |
| E6 | GV lớp khác mở URL | 404 | Forbidden |
| E7 | Trạng thái không hợp lệ (sửa HTML) | "Trạng thái điểm danh không hợp lệ." | validate |

## 7. Business rules and validations
BR-030 khung [startsAt − 30', endsAt + 24h]; BR-031 ngoài khung chỉ quản lý + lý do; ghi chú ≤ 255; lý do ≤ 255; tối đa 200 HS/lần.

## 8. Permissions and data effects
GV own / quản lý. Ghi: attendances (upsert theo `(sessionId, studentId)`), class_sessions.status, audit_logs (ngoài khung). Hai người lưu cùng lúc: bản ghi sau thắng (chấp nhận).

## 9. Postconditions
Mỗi HS trong danh sách gửi có đúng một bản ghi cho buổi; chuyên cần (UC-011/017) cập nhật ngay.

## 10. Non-functional constraints
Dùng tốt ở 360px bằng một tay; radio là `fieldset/legend`; không chỉ dùng màu (nhãn chữ trên nút).

## 11. UI/API/data references
SCREEN-015, SCREEN-028 · API-015 · Q-016 · ENT-008, ENT-010, ENT-017.

## 12. Acceptance criteria / test scenarios
TC-019 (biên khung: đúng `startsAt − 30'` và `endsAt + 24h` được phép, lệch 1 ms ra ngoài thì không), TC-020, TC-UAT-07 (bấm giờ ≤ 30 s), TC-UAT-08 (Staff ngoài khung → có bản ghi audit).

## 13. Open questions / assumptions / history
- Điểm danh QR/GPS: Pha 2. Thông báo vắng cho phụ huynh: Pha 2.
