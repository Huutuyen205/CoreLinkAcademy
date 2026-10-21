# UC-016: Xem lịch tuần

- **Status:** Approved · **Version:** 1.0 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-022 · NFR-005
- **Related features:** FEAT-027 · **Channel:** Cổng GV, HS, PH
- **Primary actor:** Giáo viên, Học sinh, Phụ huynh · **Priority:** P0

## 1. Goal and success outcome
Mỗi người thấy đúng các buổi của mình trong tuần theo giờ Việt Nam, biết buổi nào bị hủy.

## 2. Preconditions
Đã đăng nhập đúng vai trò.

## 3. Trigger
GV: "Lịch dạy" (`/giao-vien/lich`). HS: "Lịch học" (`/hoc-sinh/lich`) và tổng quan. PH: `/phu-huynh` (theo con).

## 4. Main success flow
1. Hệ thống xác định tuần (Thứ Hai 00:00 → Thứ Hai tuần sau 00:00 giờ VN) từ `?tuan=` hoặc hôm nay.
2. Tiêu đề "Tuần dd/MM – dd/MM/yyyy" + nút Tuần trước / Tuần này / Tuần sau.
3. Desktop: 7 cột Thứ Hai..Chủ nhật; điện thoại: chỉ các ngày có buổi. Ngày hôm nay có viền màu chính và nhãn ẩn "(hôm nay)" cho trình đọc màn hình.
4. Mỗi buổi: "HH:mm–HH:mm", mã lớp, tên khóa, phòng, "GV <tên>" (HS/PH), nhãn "Đã học"/"Đã hủy" khi khác "Theo lịch".
5. GV bấm một buổi không hủy → trang điểm danh.

## 5. Alternate flows
- **A1** `?tuan=` sai định dạng → tuần hiện tại.
- **A2** HS có ghi danh PAUSED vẫn thấy lịch lớp đó; DROPPED/COMPLETED thì không.
- **A3** GV dạy thay thấy buổi mình dạy ở lớp khác.

## 6. Exception / failure flows
- **E1** Không có buổi → "Không có buổi học nào trong tuần này."
- **E2** PH `?con=` không phải con → 404.

## 7. Business rules and validations
NFR-005; buổi CANCELLED vẫn hiện (mờ, nhãn "Đã hủy").

## 8. Permissions and data effects
Đọc class_sessions theo phạm vi (Q-013). Không ghi.

## 9. Postconditions
Không đổi dữ liệu.

## 10. Non-functional constraints
Không cuộn ngang ở 360px; nút chuyển tuần cao ≥ 44px.

## 11. UI/API/data references
SCREEN-025, 033, 034, 038 · Q-013 · ENT-008.

## 12. Acceptance criteria / test scenarios
`time.test.ts` (tuần VN, `parseWeekParam`), TC-UAT-05.

## 13. Open questions / assumptions / history
- Xuất lịch iCal/Google Calendar: Pha 2.
