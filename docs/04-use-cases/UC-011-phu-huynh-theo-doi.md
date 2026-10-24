# UC-011: Phụ huynh theo dõi con

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-022, FR-025, FR-033, FR-034 · BR-032, BR-046, BR-047
- **Related features:** FEAT-038 · **Channel:** Cổng phụ huynh (điện thoại)
- **Primary actor:** Phụ huynh · **Priority:** P0

## 1. Goal and success outcome
Phụ huynh tự xem lịch học, chuyên cần và điểm đã công bố của từng con mà không cần hỏi giáo viên (GOAL-004).

## 2. Preconditions
Tài khoản PARENT đã đổi mật khẩu tạm; có ≥ 1 liên kết với HS ACTIVE.

## 3. Trigger
Đăng nhập → `/phu-huynh`.

## 4. Main success flow
1. "Xin chào, <tên>" + mô tả "Lịch học, chuyên cần và điểm đã công bố của con.".
2. Nếu > 1 con: thanh chọn con (nút dạng viên thuốc, con đang chọn đánh dấu `aria-current`); mặc định con đầu tiên theo tên.
3. Tên con + khối.
4. Lịch tuần của con (tuần hiện tại, chuyển tuần), hiện GV từng buổi.
5. Thẻ "Chuyên cần: X%" (tỷ lệ từng lớp nếu nhiều lớp, 10 buổi gần nhất).
6. Thẻ "Điểm đã công bố": tên bài, lớp, thời điểm công bố, nộp muộn, điểm/tối đa, nhận xét (chỉ bài đã chấm — BR-047).

## 5. Alternate flows
### A1 — Chọn con khác
1. Bấm tên con → `/phu-huynh?con=<id>`; giữ được khi chuyển tuần (`?con=&tuan=`).
### A2 — Chưa có dữ liệu
1. Không buổi trong tuần → "Không có buổi học nào trong tuần này."; chưa điểm danh → "Chưa có buổi nào được điểm danh."; chưa công bố → "Chưa có kết quả nào được công bố.".

## 6. Exception / failure flows
| ID | Điều kiện | Hành vi |
|---|---|---|
| E1 | `?con=` là HS không liên kết (IDOR) | 404 |
| E2 | Chưa liên kết con nào (hoặc mọi con bị khóa) | EmptyState "Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ trung tâm để được hỗ trợ ghép hồ sơ con." |
| E3 | Truy cập trang khu khác (vd. `/hoc-sinh`) | Chuyển về `/phu-huynh` |

## 7. Business rules and validations
BR-032 tỷ lệ chuyên cần; BR-046/BR-047 hiển thị điểm; chỉ đọc.

## 8. Permissions and data effects
Đọc: guardianships, class_sessions, attendances, submissions/assignments đã công bố. Không ghi.

## 9. Postconditions
Không thay đổi dữ liệu.

## 10. Non-functional constraints
Một cột trên điện thoại; vùng chạm ≥ 44px; mọi trạng thái có chữ.

## 11. UI/API/data references
SCREEN-038 · Q-013, Q-018, Q-027, Q-032 · ENT-003, ENT-008, ENT-010, ENT-015.

## 12. Acceptance criteria / test scenarios
TC-034 (policy), TC-UAT-11 (PH1 thấy 2 con HS1, HS3; chọn HS3 thấy lịch ANH-THCS-K1), TC-UAT-13 (PH2 mở `?con=<HS1>` → 404).

## 13. Open questions / assumptions / history
- Thông báo cho phụ huynh khi con vắng/điểm mới: Pha 2.
