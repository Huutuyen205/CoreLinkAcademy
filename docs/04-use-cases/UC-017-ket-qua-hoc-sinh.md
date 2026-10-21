# UC-017: Học sinh xem kết quả và chuyên cần

- **Status:** Approved · **Version:** 1.0 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-025, FR-033 · BR-032, BR-046, BR-047
- **Related features:** FEAT-036, FEAT-037 · **Channel:** Cổng HS
- **Primary actor:** Học sinh · **Priority:** P0

## 1. Goal and success outcome
HS tự theo dõi điểm đã công bố và tỷ lệ đi học của mình.

## 2. Preconditions
STUDENT đã đăng nhập.

## 3. Trigger
Menu "Kết quả" → `/hoc-sinh/ket-qua`; tổng quan hiện 5 điểm mới nhất.

## 4. Main success flow
1. Thẻ "Điểm đã công bố": bài đã công bố **và** đã chấm, mới công bố trước; mỗi dòng: tên bài (liên kết tới bài), lớp, "công bố HH:mm dd/MM/yyyy", "· nộp muộn", "điểm/tối đa", nhận xét chung.
2. Thẻ "Chuyên cần: X%": tỷ lệ từng lớp (nếu > 1 lớp), chú thích công thức, 30 bản ghi gần nhất.

## 5. Alternate flows
- **A1** Bấm tên bài → UC-009 A2 (chi tiết từng câu).

## 6. Exception / failure flows
- **E1** Chưa có kết quả → "Chưa có kết quả nào được công bố.".
- **E2** Chưa có điểm danh → "Chưa có buổi nào được điểm danh."; tỷ lệ "Chưa có dữ liệu".

## 7. Business rules and validations
BR-032, BR-046, BR-047.

## 8. Permissions and data effects
Chính mình. Đọc: submissions, assignments, attendances.

## 9. Postconditions
Không đổi dữ liệu.

## 10. Non-functional constraints
Hai cột ≥ 1024px, một cột dưới đó.

## 11. UI/API/data references
SCREEN-033, 037 · Q-018, Q-027 · ENT-010, ENT-013, ENT-015.

## 12. Acceptance criteria / test scenarios
TC-021, TC-033, TC-042.

## 13. Open questions / assumptions / history
—
