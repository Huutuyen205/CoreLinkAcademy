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
DECISION-D41: trang "Kết quả" đã gộp. Điểm đã công bố: menu "Bài tập" → `/hoc-sinh/bai-tap` (mục "Đã xong và đã đóng"). Chuyên cần, thái độ, nhận xét và đánh giá định kỳ: menu "Lớp học" → `/hoc-sinh/lop/[id]`.

## 4. Main success flow
1. **Điểm** — `/hoc-sinh/bai-tap` (tab Bài tập / Kiểm tra), mục "Đã xong và đã đóng": bài đã nộp hiện "Đã chấm: điểm/tối đa" khi đã công bố **và** đã chấm, "Đang chờ chấm" khi đã công bố nhưng chưa chấm, "Đã nộp — chờ kết quả" khi chưa công bố (BR-046, 047).
2. **Chuyên cần và đánh giá** — `/hoc-sinh/lop/[id]`: "Chuyên cần: X%" của lớp (BR-032), danh sách buổi, mỗi buổi có nhãn điểm danh, thái độ và nhận xét của giáo viên; thẻ "Đánh giá định kỳ" (đã gửi).

## 5. Alternate flows
- **A1** Bấm tên bài → UC-009 A2 (chi tiết từng câu).

## 6. Exception / failure flows
- **E1** Chưa có bài → "Chưa có bài tập nào được giao."; bài đã nộp chưa công bố → hiện "chờ kết quả", không điểm.
- **E2** Chưa có điểm danh → buổi hiện "Chưa điểm danh" / "Chưa diễn ra"; tỷ lệ "Chưa có dữ liệu".

## 7. Business rules and validations
BR-032, BR-046, BR-047.

## 8. Permissions and data effects
Chính mình. Đọc: submissions, assignments, attendances.

## 9. Postconditions
Không đổi dữ liệu.

## 10. Non-functional constraints
Một cột, dùng được ở 360px.

## 11. UI/API/data references
SCREEN-035, 040, 041 (SCREEN-037 đã bỏ, D41) · Q-018, Q-027 · ENT-010, ENT-013, ENT-015.

## 12. Acceptance criteria / test scenarios
TC-021, TC-033, TC-042.

## 13. Open questions / assumptions / history
—
