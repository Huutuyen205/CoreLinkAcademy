# UC-009: Làm và nộp bài

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-029, FR-030, FR-032 · BR-040, BR-041, BR-044, BR-045, BR-046, BR-047
- **Related features:** FEAT-030, FEAT-031 · **Channel:** Cổng HS (điện thoại/máy tính)
- **Primary actor:** Học sinh · **Supporting:** Hệ thống (tự chấm) · **Priority:** P0

## 1. Goal and success outcome
HS làm bài online, lưu nháp được, nộp đúng một lần; câu khách quan được chấm ngay.

## 2. Preconditions
HS có ghi danh ở lớp của bài; bài PUBLISHED hoặc CLOSED.

## 3. Trigger
"Bài cần làm" ở tổng quan hoặc `/hoc-sinh/bai-tap` → bấm tên bài.

## 4. Main success flow
1. Trang bài: tên, "Lớp X · hạn nộp HH:mm dd/MM/yyyy (nhận nộp muộn) · n câu", hướng dẫn.
2. Lần mở đầu khi được làm → hệ thống tạo submission IN_PROGRESS.
3. Form câu hỏi (không có đáp án): MCQ là nhóm radio, SHORT ô một dòng (≤ 500), ESSAY ô nhiều dòng (≤ 20.000). Thanh nút dính đáy: "Lưu nháp", "Nộp bài".
4. HS làm, bấm "Lưu nháp" → "Đã lưu nháp." (câu trả lời được giữ).
5. HS bấm "Nộp bài" → xác nhận "Nộp bài? Sau khi nộp sẽ không sửa được." → hệ thống khóa bài (chỉ một request thắng), tự chấm MCQ/SHORT, trạng thái SUBMITTED (có tự luận) hoặc GRADED (chỉ khách quan).
6. "Đã nộp bài. Điểm sẽ hiển thị khi giáo viên công bố kết quả."; trang chuyển sang chế độ xem bài làm (không đáp án, không điểm).

## 5. Alternate flows
### A1 — Nộp muộn
1. `now > dueAt` và bài cho nộp muộn → nộp được, `isLate = true`, nhãn "Nộp muộn", thông báo "Đã nộp bài (nộp muộn).". Danh sách hiển thị "Quá hạn — vẫn nhận nộp muộn".
### A2 — Xem kết quả sau công bố
1. Bài đã công bố **và** bài nộp GRADED → Alert "Điểm: x/tối đa" + nhận xét chung; từng câu "điểm/tối đa", bài làm, đáp án đúng (MCQ: nội dung lựa chọn; SHORT: các đáp án), nhận xét câu.
2. Bài đã công bố nhưng bài nộp còn SUBMITTED → "Bài của bạn đang chờ giáo viên chấm." — không hiện điểm/đáp án (BR-047).
### A3 — Mở lại từ thiết bị khác
1. Câu trả lời đã lưu nháp được điền sẵn.

## 6. Exception / failure flows
| ID | Điều kiện | Hành vi | Mã |
|---|---|---|---|
| E1 | Nộp lần 2 (2 tab, bấm 2 lần) | "Bạn đã nộp bài này." | ALREADY_SUBMITTED |
| E2 | Quá hạn, không cho muộn, chưa mở bài | Alert "Đã quá hạn nộp và bài không nhận nộp muộn."; không tạo submission | PAST_DUE |
| E3 | Quá hạn khi đang làm (đã có IN_PROGRESS) | Không hiện form; Alert "Bài chưa được nộp và không còn nhận bài." | PAST_DUE |
| E4 | Ghi danh không còn ACTIVE (bảo lưu/nghỉ) | Không có form; Alert "Bài đã đóng hoặc bạn không còn đang học lớp này."; gửi trực tiếp → "Bạn không còn đang học lớp này nên không làm bài được." | NOT_ACTIVE |
| E5 | Bài CLOSED | Như E4; gửi → "Bài đã đóng." | CLOSED |
| E6 | Bài DRAFT / HS không ghi danh lớp | 404 | Forbidden |
| E7 | Lựa chọn MCQ ngoài phạm vi (sửa HTML) | Coi như bỏ trống | — |

## 7. Business rules and validations
BR-040 (MCQ), BR-041 (chuẩn hóa trả lời ngắn), BR-044 (nộp muộn), BR-045 (một bài nộp, không hoàn tác), BR-046/047 (hiển thị kết quả). Câu bỏ trống = 0 điểm.

## 8. Permissions and data effects
`submission.work` + ghi danh. Ghi: submissions (tạo, `status`, `submittedAt`, `isLate`, `score` nếu GRADED), answers (upsert `response`, `autoPoints`).

## 9. Postconditions
Đúng một submission/HS/bài; sau nộp không còn đường ghi `response`.

## 10. Non-functional constraints
Payload/HTML không chứa `correctOption`/`acceptedAnswers` trước công bố (T-06, TC-032). Nút bị khóa khi đang gửi.

## 11. UI/API/data references
SCREEN-035, SCREEN-036 · API-018 · Q-025, Q-026 · ENT-015, ENT-016.

## 12. Acceptance criteria / test scenarios
TC-026..TC-029, TC-032, TC-033, TC-042; TC-UAT-10 (xem source trang làm bài không có đáp án).

## 13. Open questions / assumptions / history
- Giới hạn thời gian làm bài (đếm ngược): Pha 2.
- v1.1: A2 theo BR-047 (GAP-03).
