# UC-010: Chấm và công bố kết quả

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-031, FR-032, FR-033 · BR-042, BR-043, BR-046, BR-047
- **Related features:** FEAT-032..FEAT-034 · **Channel:** Cổng GV
- **Primary actor:** Giáo viên chính · **Priority:** P0

## 1. Goal and success outcome
GV chấm tự luận, chỉnh điểm tự chấm khi cần, công bố một lần cho cả lớp; mọi sửa điểm sau công bố được truy vết.

## 2. Preconditions
Bài ≠ DRAFT; có bài nộp SUBMITTED/GRADED.

## 3. Trigger
"Bài chờ chấm" ở tổng quan GV, hoặc trang bài → "Bài nộp (n)" → "Chấm bài"/"Xem / sửa điểm".

## 4. Main success flow
1. `/giao-vien/bai-tap/[id]/bai-nop`: mọi HS ghi danh (ACTIVE/PAUSED/COMPLETED): trạng thái ("Chưa mở bài", "Đang làm", "Chờ chấm", "Đã chấm", "Nộp muộn"), nộp lúc, điểm.
2. Mở `/giao-vien/bai-nop/[id]`: từng câu — "Câu n · tối đa x điểm · tự chấm: y", nội dung, bài làm, đáp án (MCQ/SHORT), ô điểm (tự luận bắt buộc; khách quan "Sửa điểm (tùy chọn)", để trống = giữ điểm tự chấm), nhận xét câu; nhận xét chung.
3. GV nhập điểm, bấm "Lưu điểm" → GRADED, tổng điểm (BR-043), "Đã lưu điểm.".
4. Khi chấm xong, ở trang bài bấm "Công bố kết quả" (xác nhận "Học sinh và phụ huynh sẽ thấy điểm, đáp án và nhận xét. Tiếp tục?") → `resultsPublishedAt` = now; "Đã công bố kết quả. Học sinh và phụ huynh đã xem được điểm.".
5. Bảng điểm ở chi tiết lớp cập nhật.

## 5. Alternate flows
### A1 — Còn bài chưa chấm khi công bố (DECISION-D15)
1. Thẻ "Giao bài" hiện "Còn N bài chưa chấm. Các bài này hiện 'Đang chờ chấm' với học sinh cho tới khi bạn chấm xong."; vẫn cho công bố.
2. Sau công bố, chấm thêm bài → bài đó hiện điểm ngay cho HS/PH (đã công bố) và ghi audit (sửa sau công bố).
### A2 — Sửa điểm sau công bố
1. Màn chấm hiện cảnh báo "Kết quả đã công bố. Mọi thay đổi điểm sẽ được ghi vào nhật ký."; lưu → audit `grade.update_after_publish` {before{score, answers[]}, after{score, grades[]}}.
### A3 — Bài chỉ có câu khách quan
1. Bài nộp đã GRADED khi nộp; GV chỉ cần công bố (có thể chỉnh điểm từng câu nếu muốn).

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Điểm câu < 0 hoặc > tối đa | "Điểm phải từ 0 đến N." (dưới ô) | POINTS_OUT_OF_RANGE |
| E2 | Điểm lệch bước 0,25 | "Điểm theo bước 0,25." | POINTS_OUT_OF_RANGE |
| E3 | Thiếu điểm câu tự luận | "Nhập điểm câu tự luận." | POINTS_OUT_OF_RANGE |
| E4 | Bài nộp IN_PROGRESS | Trang hiện "Học sinh chưa nộp bài."; gửi → "Học sinh chưa nộp bài." | NOT_SUBMITTED |
| E5 | Công bố bài nháp | "Bài chưa được giao nên chưa thể công bố kết quả." | NOT_PUBLISHED |
| E6 | `answerId` không thuộc bài nộp (sửa HTML) | 404 | Forbidden |
| E7 | GV khác | 404 | Forbidden |

## 7. Business rules and validations
BR-042 (0 ≤ điểm ≤ tối đa, bước 0,25; nhập "7,5" được hiểu 7.5), BR-043 (tổng = Σ teacherPoints ?? autoPoints ?? 0, làm tròn 2 chữ số), BR-046, BR-047.

## 8. Permissions and data effects
GV chính. Ghi: answers (`teacherPoints`, `feedback`), submissions (`status = GRADED`, `score`, `teacherComment`, `gradedAt`, `gradedById`), assignments (`resultsPublishedAt`), audit_logs.

## 9. Postconditions
Sau công bố: HS/PH thấy điểm của bài GRADED; công bố không hoàn tác ở Pha 1.

## 10. Non-functional constraints
Bảng điểm cuộn ngang trong khung riêng trên điện thoại (ngoại lệ có chủ đích của NFR-002).

## 11. UI/API/data references
SCREEN-027, 030, 031, 032 · API-019, API-020 · Q-021, Q-022, Q-023 · ENT-013, ENT-015, ENT-016, ENT-017.

## 12. Acceptance criteria / test scenarios
TC-030, TC-031, TC-033, TC-042; TC-UAT-10.

## 13. Open questions / assumptions / history
- Thu hồi công bố, công bố từng HS: Pha 2. DECISION-D15 (cho công bố khi còn bài chưa chấm, hiển thị "Đang chờ chấm").
