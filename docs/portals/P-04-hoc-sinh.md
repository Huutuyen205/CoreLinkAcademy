# P-04 — Cổng học sinh

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 (2026-10-21) · Owner: BA + Designer (trợ lý) · Approver: chủ dự án |
| Người dùng | Học sinh lớp 1–12; điện thoại/máy tính bảng; HS nhỏ có thể dùng tài khoản do phụ huynh giữ |
| Mục tiêu | Biết hôm nay học gì, làm và nộp bài, xem điểm và chuyên cần |
| FR | FR-022, 025, 029..033, 034 · UC-009, 016, 017, 018 |

## 1. Điều hướng
Tổng quan · Lịch học · Bài tập · Kết quả (thanh đáy 4 mục ở điện thoại).

## 2. Màn hình

### SCREEN-033 Tổng quan `/hoc-sinh`
"Bài cần làm (n)" (≤ 5: đang học, đang giao, chưa nộp, chưa quá hạn hoặc nhận muộn) + "Tất cả bài tập"; lịch tuần; 5 điểm đã công bố mới nhất.

### SCREEN-034 Lịch học
WeekSchedule hiện GV từng buổi; lớp đang học hoặc bảo lưu.

### SCREEN-035 Bài tập
- **Cần làm:** tên, lớp, hạn, nhãn "Cần làm"/"Đang làm"/"Quá hạn — vẫn nhận nộp muộn".
- **Đã nộp và đã đóng:** "Đã nộp", "Đã có điểm: x" (chỉ khi công bố và đã chấm), "Đang chờ chấm", "Đã đóng", "Quá hạn".

### SCREEN-036 Làm bài / xem kết quả `/hoc-sinh/bai-tap/[id]`
| Tình huống | Hiển thị |
|---|---|
| Được làm | Hướng dẫn; câu hỏi (không đáp án): MCQ radio, ngắn 1 dòng, tự luận nhiều dòng; "Lưu nháp", "Nộp bài" (xác nhận "Sau khi nộp sẽ không sửa được.") |
| Đã nộp, chưa công bố | "Đã nộp bài lúc …. Điểm sẽ hiển thị khi giáo viên công bố kết quả." + bài làm |
| Đã công bố, đã chấm | "Điểm: x/tối đa" + nhận xét; từng câu điểm, bài làm, đáp án đúng, nhận xét |
| Đã công bố, chưa chấm | "Bài của bạn đang chờ giáo viên chấm." — không điểm/đáp án |
| Quá hạn không nhận muộn | "Đã quá hạn nộp và bài không nhận nộp muộn." |
| Bảo lưu/nghỉ hoặc bài đóng | "Bài đã đóng hoặc bạn không còn đang học lớp này." |

### SCREEN-037 Kết quả
"Điểm đã công bố" (bài công bố và đã chấm; liên kết chi tiết) + "Chuyên cần: X%" (theo lớp, 30 buổi gần nhất, chú thích công thức).

## 3. Hành trình
Tổng quan → "Bài cần làm" → làm → lưu nháp → nộp → (sau công bố) Kết quả → xem chi tiết.

## 4. Tình huống biên
| Tình huống | Hành vi |
|---|---|
| Bấm "Nộp bài" ở 2 tab | Tab thứ hai: "Bạn đã nộp bài này." |
| Mở bài lớp khác/bài nháp qua URL | 404 |
| Hết hạn khi đang làm | Không còn form; "Bài chưa được nộp và không còn nhận bài." |
| Không có email/SĐT | Chưa đăng nhập được — Admin bổ sung (D12) |

## 5. Dữ liệu và quyền
Chỉ dữ liệu của chính mình; câu hỏi qua `toStudentQuestion` (không đáp án trước công bố); điểm theo BR-046/047.

## 6. Kiểm thử
TC-026..033, 042; TC-UAT-05, 10, 13.
