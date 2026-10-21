# UC-015: Hủy hoặc dời buổi học

- **Status:** Approved · **Version:** 1.0 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-021, FR-018, FR-035 · BR-021, BR-028
- **Related features:** FEAT-035 · **Channel:** Cổng quản lý
- **Primary actor:** Staff · **Supporting:** Admin · **Priority:** P1

## 1. Goal and success outcome
Điều chỉnh lịch khi GV ốm, nghỉ lễ… mà không tạo trùng lịch; lý do được lưu và truy vết.

## 2. Preconditions
Buổi ở SCHEDULED và chưa bắt đầu.

## 3. Trigger
`/quan-ly/lop/[id]` → dòng buổi → "Hủy hoặc dời buổi" (khung mở rộng).

## 4. Main success flow — dời buổi
1. Form "Dời buổi": Ngày mới, Bắt đầu, Kết thúc (mặc định giờ hiện tại của buổi), Lý do*.
2. Bấm "Dời buổi" → hệ thống chuyển giờ VN → UTC, kiểm tra tương lai, kiểm tra trùng GV/phòng (bỏ qua chính buổi đó), cập nhật, audit `session.reschedule` {from, to, reason}.
3. "Đã dời buổi học."; lịch tuần của GV/HS/PH hiển thị giờ mới.

## 5. Alternate flows
### A1 — Hủy buổi
1. Form "Hủy buổi": Lý do hủy* → "Hủy buổi" (xác nhận "Hủy buổi học này?") → CANCELLED + `cancelReason`, audit `session.cancel` {reason}. Buổi hiện "Đã hủy" + "Lý do hủy: …" ở lớp và lịch tuần; không còn liên kết điểm danh.

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Thời điểm mới ở quá khứ | Lỗi ô ngày "Chọn thời điểm trong tương lai." | validate |
| E2 | Trùng lịch | "Trùng lịch N buổi…" + danh sách | SCHEDULE_CONFLICT |
| E3 | Buổi không còn SCHEDULED (vd. vừa điểm danh, vừa bị hủy) | "Chỉ dời được buổi chưa diễn ra." / "Chỉ hủy được buổi chưa diễn ra." | INVALID_TRANSITION |
| E4 | Lý do < 3 ký tự | "Nhập lý do." | validate |
| E5 | Giờ kết thúc ≤ bắt đầu | "Giờ kết thúc phải sau giờ bắt đầu." | validate |

## 7. Business rules and validations
BR-021, BR-028. Dời buổi không kiểm tra trùng lịch học sinh (chấp nhận — ghi ở 17 ASSUMPTION-A07).

## 8. Permissions and data effects
`class.manage`. Ghi: class_sessions (`startsAt`, `endsAt` hoặc `status`, `cancelReason`), audit_logs.

## 9. Postconditions
Buổi hủy không tính trong trùng lịch, chuyên cần và cảnh báo vắng.

## 10. Non-functional constraints
Một transaction cho kiểm tra trùng + cập nhật + audit (dời buổi).

## 11. UI/API/data references
SCREEN-014 · API-014 · ENT-008, ENT-017.

## 12. Acceptance criteria / test scenarios
TC-014, TC-047 (hủy buổi → có audit `session.cancel`), TC-UAT-06.

## 13. Open questions / assumptions / history
- Thông báo cho HS/PH khi hủy/dời: Pha 2 (cần kênh thông báo).
