# P-04 — Cổng học sinh

| Mục | Giá trị |
|---|---|
| Phiên bản | 2.0 (2026-10-24, DECISION-D41) · Owner: BA + Designer (trợ lý) · Approver: chủ dự án |
| Người dùng | Học sinh lớp 1–12; điện thoại/máy tính bảng; HS nhỏ có thể dùng tài khoản do phụ huynh giữ |
| Mục tiêu | Biết hôm nay học gì, xem lớp và tiến độ, làm và nộp bài, xem điểm, chuyên cần, nhận xét |
| FR | FR-022, 025, 029..033, 034, 039, 042, 049, 053, 060 · UC-009, 016, 017, 018 |

> Cổng phụ huynh dùng lại toàn bộ các trang này cho con đang chọn (DECISION-D42, xem [P-05](P-05-phu-huynh.md)); các trang `/phu-huynh/lich|lop|bai-tap|buoi` giống hệt.

## 1. Điều hướng
Đúng 4 mục (cả menu bên và thanh đáy điện thoại): **Lịch học · Lớp học · Bài tập · Tin nhắn**. Thông báo ở chuông trên thanh đầu. `/hoc-sinh` chuyển thẳng sang Lịch học (không có trang tổng quan).

## 2. Màn hình

### SCREEN-034 Lịch học `/hoc-sinh/lich`
Lịch tuần (lưới khung giờ, hiện GV từng buổi) hoặc lịch tháng; lớp đang học hoặc bảo lưu; bấm buổi → `/hoc-sinh/buoi/[id]` (điểm danh, thái độ, nhận xét, nhật ký buổi, tài liệu, đơn xin nghỉ). Nút "Thêm vào lịch điện thoại".

### SCREEN-040 Lớp học `/hoc-sinh/lop`
Thẻ cho từng lớp em đang/đã học (lớp đang học xếp trước): mã lớp, nhãn trạng thái, khóa học, lịch học, GV + phòng, **thanh tiến độ** buổi đã học / tổng buổi (không tính buổi hủy), "Đã nộp x/y bài tập". Bấm thẻ → chi tiết lớp.

### SCREEN-041 Chi tiết lớp `/hoc-sinh/lop/[id]?tab=`
| Tab | Nội dung |
|---|---|
| **Chi tiết lớp** (mặc định) | Thẻ thông tin: "mã lớp - phòng", GV, khóa học, lịch học, **chuyên cần** của lớp (BR-032), thanh tiến độ. Thẻ "Buổi đang học / sắp tới". Danh sách **Buổi học**: mỗi dòng "Buổi n · ngày giờ", nhãn **điểm danh** (Có mặt / Muộn / Vắng / Có phép; "Chưa điểm danh" / "Chưa diễn ra"), nhãn **thái độ** và **nhận xét** của GV; bấm → chi tiết buổi. Thẻ "Đánh giá định kỳ" (chỉ khi GV đã gửi) |
| **Tài liệu học tập** (`?tab=tai-lieu`) | Tài liệu, giáo trình chia sẻ cho lớp (không có giáo án), kèm tệp tải về; bấm tên → `/tai-lieu/[id]` |

Lớp em không có ghi danh (hoặc đã nghỉ học) → 404.

### SCREEN-035 Bài tập `/hoc-sinh/bai-tap?loai=`
Bốn tab, số trên tab = số bài **cần làm**:
| Tab (`loai`) | Nguồn | Chia mục |
|---|---|---|
| **Bài tập** (`bai-tap`, mặc định) | `assignments` không phải kiểm tra | "Cần làm" — tên, lớp, hạn, nhãn "Chưa nộp / Đang làm / Cần nộp lại / Quá hạn — vẫn nhận nộp muộn", nút **Làm bài**. "Đã xong và đã đóng" — "Đã chấm: x/y", "Đang chờ chấm", "Đã nộp — chờ kết quả", "Đã đóng", "Quá hạn" |
| **Kiểm tra** (`kiem-tra`) | `assignments.isTest` | Như trên |
| **Bổ sung** (`bo-sung`) | Đề luyện tập GV giao riêng (`practice_sets.forStudentId`, FR-060) | "Cần làm" (chưa làm) / "Đã làm" (cao nhất, làm lại được) |
| **Tự ôn luyện** (`on-luyen`) | Đề luyện tập chung (FR-053) | Ô tìm + lọc Môn, Chuyên đề, Dạng bài, Mức độ; lưới đề; nút "Lịch sử luyện tập" |

### SCREEN-036 Làm bài / xem kết quả `/hoc-sinh/bai-tap/[id]`
| Tình huống | Hiển thị |
|---|---|
| Được làm | Hướng dẫn; câu hỏi (không đáp án): MCQ radio, ngắn 1 dòng, tự luận nhiều dòng; "Lưu nháp", "Nộp bài" (xác nhận "Sau khi nộp sẽ không sửa được.") |
| Đã nộp, chưa công bố | "Đã nộp bài lúc …. Điểm sẽ hiển thị khi giáo viên công bố kết quả." + bài làm |
| Đã công bố, đã chấm | "Điểm: x/tối đa" + nhận xét; từng câu điểm, bài làm, đáp án đúng, nhận xét |
| Đã công bố, chưa chấm | "Bài của bạn đang chờ giáo viên chấm." — không điểm/đáp án |
| Quá hạn không nhận muộn | "Đã quá hạn nộp và bài không nhận nộp muộn." |
| Bảo lưu/nghỉ hoặc bài đóng | "Bài đã đóng hoặc bạn không còn đang học lớp này." |

### Đã bỏ (D41)
- SCREEN-033 Tổng quan → chuyển sang Lịch học. SCREEN-037 Kết quả → điểm ở Bài tập; chuyên cần, thái độ, nhận xét, đánh giá định kỳ ở Chi tiết lớp.
- `/on-luyen` (danh sách) và `/tai-lieu` (danh sách) của học sinh chuyển về tab Tự ôn luyện và Lớp học; trang chi tiết (`/on-luyen/[id]`, `/tai-lieu/[id]`) giữ nguyên.
- Biểu đồ tiến độ điểm và bảng điểm tổng hợp theo môn/kỳ không còn ở cổng học sinh (vẫn có ở cổng phụ huynh).

## 3. Hành trình
Đăng nhập → Lịch học → (Lớp học → lớp → buổi / tài liệu) hoặc (Bài tập → "Cần làm" → làm → lưu nháp → nộp → sau công bố xem "Đã chấm: x/y" → xem chi tiết).

## 4. Tình huống biên
| Tình huống | Hành vi |
|---|---|
| Bấm "Nộp bài" ở 2 tab | Tab thứ hai: "Bạn đã nộp bài này." |
| Mở bài/lớp khác lớp mình hoặc bài nháp qua URL | 404 |
| Hết hạn khi đang làm | Không còn form; "Bài chưa được nộp và không còn nhận bài." |
| Không có email/SĐT | Chưa đăng nhập được — Admin bổ sung (D12) |
| Mở `/hoc-sinh/ket-qua` (đã bỏ) | 404; thông báo cũ đã được sửa link sang `/hoc-sinh/lop` bằng migration `20261030090000` |

## 5. Dữ liệu và quyền
Chỉ dữ liệu của chính mình; `getClassForStudent` / `listMyClasses` chỉ trả lớp có ghi danh ACTIVE, PAUSED, COMPLETED; câu hỏi qua `toStudentQuestion` (không đáp án trước công bố); điểm theo BR-046/047; tài liệu theo `documentVisibilityWhere` (không bao giờ thấy giáo án).

## 6. Kiểm thử
TC-026..033, 042; TC-UAT-05, 10, 13. Kiểm tra tay: học sinh khác lớp mở `/hoc-sinh/lop/<id lớp khác>` → 404.
