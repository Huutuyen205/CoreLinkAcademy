# UC-018: Xem tổng quan theo vai trò và cảnh báo vắng

- **Status:** Approved · **Version:** 1.0 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-026, FR-034 · BR-003, BR-033
- **Related features:** FEAT-039..FEAT-041, FEAT-043 · **Channel:** Mọi cổng nội bộ
- **Primary actor:** Admin, Staff, Giáo viên, Học sinh (Phụ huynh: UC-011) · **Priority:** P0

## 1. Goal and success outcome
Sau đăng nhập, mỗi vai trò thấy ngay việc cần làm hôm nay.

## 2. Preconditions
Đã đăng nhập, đã đổi mật khẩu tạm.

## 3. Trigger
Đăng nhập thành công hoặc bấm "Tổng quan".

## 4. Main success flow
**Admin/Staff (`/quan-ly`):**
1. "Xin chào, <tên>" — "Tổng quan tuyển sinh và đào tạo.".
2. 4 ô: Lead mới → `/quan-ly/lead?status=NEW`; Lead quá 24 giờ chưa xử lý → `?quahan=1` (viền + số màu cảnh báo khi > 0); Lớp đang tuyển → `/quan-ly/lop?status=OPEN`; Lớp đang học → `?status=IN_PROGRESS`.
3. Thẻ "Cảnh báo vắng không phép 2 buổi liên tiếp": tên HS + liên kết "Lớp X".

**Giáo viên (`/giao-vien`):**
1. "Buổi dạy hôm nay" (giờ, lớp, khóa, phòng, "Điểm danh" hoặc nhãn "Đã hủy") + liên kết "Lịch tuần".
2. "Bài chờ chấm (tổng)": 20 bài nộp cũ nhất — tên HS (liên kết chấm), bài, lớp, thời điểm nộp.
3. "Cảnh báo vắng 2 buổi liên tiếp" của lớp mình.

**Học sinh (`/hoc-sinh`):**
1. "Bài cần làm (n)": ≤ 5 bài (ACTIVE, PUBLISHED, chưa nộp, chưa quá hạn hoặc cho muộn) + "Tất cả bài tập".
2. Lịch tuần.
3. "Điểm đã công bố" 5 bài mới nhất.

## 5. Alternate flows
- **A1** Thông báo sau chuyển trang (`?thongbao=doi-mat-khau` → "Đã đổi mật khẩu.") — chỉ chuỗi định sẵn, không in tham số URL.

## 6. Exception / failure flows
- Mỗi thẻ có trạng thái rỗng: "Không có học sinh nào cần chú ý.", "Hôm nay bạn không có buổi dạy.", "Không có bài nào chờ chấm.", "Bạn không có bài nào cần làm.".

## 7. Business rules and validations
BR-003, BR-033; "hôm nay" = ngày theo giờ VN.

## 8. Permissions and data effects
Chỉ đọc theo phạm vi. Q-007, Q-013, Q-014, Q-017, Q-024, Q-025, Q-027.

## 9. Postconditions
Không đổi dữ liệu.

## 10. Non-functional constraints
4 ô số liệu: 2 cột ở điện thoại, 4 cột ≥ 1024px; số liệu thật từ DB (không số trang trí).

## 11. UI/API/data references
SCREEN-008, 024, 033.

## 12. Acceptance criteria / test scenarios
TC-022, TC-UAT-03 (seed có 1 lead quá hạn, 1 cảnh báo vắng HS2 lớp TOAN9-K1).

## 13. Open questions / assumptions / history
—
