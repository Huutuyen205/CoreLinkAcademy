# UC-019: Xem nhật ký audit

- **Status:** Approved · **Version:** 1.0 · **Owner:** BA + Security · **Approver:** chủ dự án
- **Related requirements:** FR-035 · NFR-011
- **Related features:** FEAT-042 · **Channel:** Cổng quản lý
- **Primary actor:** Admin · **Priority:** P1

## 1. Goal and success outcome
Admin truy vết ai đã làm thao tác nhạy cảm nào, khi nào, trên đối tượng nào, giá trị trước/sau.

## 2. Preconditions
Admin.

## 3. Trigger
Menu "Nhật ký" → `/quan-ly/nhat-ky`.

## 4. Main success flow
1. Mô tả "Các thao tác nhạy cảm. Nhật ký không thể sửa hoặc xóa."
2. Lọc "Loại thao tác" (10 loại, nhãn tiếng Việt) → "Lọc"; "Bỏ lọc".
3. Bảng 50/trang, mới nhất trước: Thời điểm, Người thực hiện ("Hệ thống" nếu không có), Thao tác, Đối tượng ("User · <id>"), Chi tiết ("Xem" mở JSON).

## 5. Alternate flows
- **A1** Phân trang giữ bộ lọc.

## 6. Exception / failure flows
- **E1** Chưa có bản ghi → "Chưa có bản ghi nhật ký.".
- **E2** Staff mở URL → chuyển `/quan-ly`.
- **E3** `?action=` không thuộc danh sách → bỏ qua lọc.

## 7. Business rules and validations
Append-only; chi tiết không chứa mật khẩu/token (chỉ id, trạng thái, lý do, điểm).

## 8. Permissions and data effects
`audit.read`. Chỉ đọc audit_logs.

## 9. Postconditions
Không đổi dữ liệu.

## 10. Non-functional constraints
Chi tiết JSON cuộn trong khung tối đa 15rem, xuống dòng.

## 11. UI/API/data references
SCREEN-023 · Q-034 · ENT-017.

## 12. Acceptance criteria / test scenarios
TC-036 (Staff không đọc audit), TC-UAT-08 (bản ghi `attendance.override` có before/after).

## 13. Open questions / assumptions / history
- QUESTION-Q11: thời gian lưu audit.
