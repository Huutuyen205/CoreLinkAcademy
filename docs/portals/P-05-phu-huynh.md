# P-05 — Cổng phụ huynh

| Mục | Giá trị |
|---|---|
| Phiên bản | 2.0 (2026-10-24, DECISION-D42) · Owner: BA + Designer (trợ lý) · Approver: chủ dự án |
| Người dùng | Phụ huynh có con đang học; điện thoại |
| Mục tiêu | Xem lịch, lớp, tiến độ, điểm, chuyên cần của từng con **và làm bài thay con ngay trên máy của mình** (GOAL-004) |
| FR | FR-022, 025, 029..033, 034, 039, 042, 044, 049, 053, 060 · UC-009, 011, 016, 017 |

## 1. Nguyên tắc
Cổng phụ huynh **kế thừa cổng học sinh** ([P-04](P-04-hoc-sinh.md)) cho **con đang chọn**: cùng trang, cùng bố cục, cùng mã nguồn (`src/components/learner-portal/`); chỉ khác ở các điểm dưới đây.

| Khác học sinh | Phụ huynh |
|---|---|
| Thanh trên | Có **ô chọn con** (xem §2) |
| Menu / thanh đáy (5 mục) | **Lịch học · Lớp học · Bài tập · Đơn xin nghỉ · Tin nhắn** (học sinh không có Đơn xin nghỉ) |
| Làm bài | Làm, lưu nháp, nộp, tải ảnh bài làm, làm đề Bổ sung / Tự ôn luyện **thay con**; bài lưu dưới tên học sinh; nộp bài có audit |
| Hỏi giáo viên về bài | Không có (phụ huynh nhắn qua Tin nhắn theo quy tắc D30) |
| Tài liệu | Theo quyền phụ huynh (cờ cho phép phụ huynh xem) |
| Chi tiết buổi | Có thêm "Xin nghỉ buổi này" |
| Tin nhắn | Quy tắc nhắn của phụ huynh (trung tâm, giáo viên, nhóm lớp con học, học sinh là con mình) |

## 2. Ô chọn con (`ChildSwitcher`)
- Nằm trên thanh trên (desktop: cạnh chuông; điện thoại: giữa tìm kiếm và chuông). Hiện tên con đang chọn + mũi tên.
- **Rê chuột vào** (hoặc bấm / Tab trên điện thoại) → bảng xổ ra, mỗi con một ô: ảnh/chữ cái đầu, họ tên, "Lớp n"; con đang chọn đánh dấu ✓. Bấm một con để chuyển.
- Chuyển con = `GET /phu-huynh/chon-con?con=<id>&den=<đường dẫn>` → lưu cookie `cl_child` (1 năm) rồi chuyển tới `den`. Từ trang chi tiết (lớp, bài, buổi, đề luyện) về danh sách cùng mục vì trang cũ thuộc con khác.
- Mặc định (chưa chọn / cookie sai) = con đầu tiên theo tên. Con bị khóa không còn trong danh sách.
- Chỉ có một con: ô vẫn hiện (hiển thị con đó).

## 3. Màn hình
| Màn hình | Đường dẫn | Ghi chú |
|---|---|---|
| Vào cổng | `/phu-huynh` | Chuyển sang Lịch học. `?con=` (liên kết cũ) đổi sang con đó. Chưa liên kết con → "Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ trung tâm để được hỗ trợ ghép hồ sơ con." |
| Lịch học | `/phu-huynh/lich` | Như SCREEN-034; "Thêm vào lịch điện thoại" xuất lịch của con |
| Lớp học, chi tiết lớp | `/phu-huynh/lop`, `/phu-huynh/lop/[id]` | Như SCREEN-040, 041 (tiến độ, buổi + điểm danh + nhận xét, đánh giá định kỳ, tài liệu) |
| Bài tập | `/phu-huynh/bai-tap?loai=` | Như SCREEN-035 (Bài tập · Kiểm tra · Bổ sung · Tự ôn luyện; Cần làm / Đã xong) |
| Làm bài | `/phu-huynh/bai-tap/[id]` | Như SCREEN-036; phụ huynh nộp thay con |
| Buổi học | `/phu-huynh/buoi/[id]` | Như học sinh + form "Xin nghỉ buổi này" |
| Đơn xin nghỉ | `/phu-huynh/don-nghi` | Gửi đơn (chọn buổi sắp tới 30 ngày của con đang chọn + lý do), xem trạng thái, rút đơn chờ duyệt |
| Đề luyện của con | `/on-luyen/[id]`, `/on-luyen/ket-qua/[id]`, `/on-luyen/lich-su` | Dùng chung; hoạt động theo con đang chọn |

## 4. Hành trình
Nhận mật khẩu tạm từ trung tâm → đăng nhập bằng SĐT → đổi mật khẩu → Lịch học của con đầu tiên → (đổi con ở thanh trên) → Lớp học / Bài tập → làm bài thay con hoặc xem "Đã chấm x/y" → Đơn xin nghỉ khi con vắng.

## 5. Tình huống biên
| Tình huống | Hành vi |
|---|---|
| Cookie `cl_child` là học sinh không liên kết | Bỏ qua, dùng con đầu tiên |
| `/phu-huynh/chon-con?con=<không phải con mình>` | 404 |
| `den` là địa chỉ ngoài (`//host`, `https://…`) | Về Lịch học |
| Mở lớp/bài của con A khi đang chọn con B | 404 |
| Mở `/hoc-sinh/*` bằng tài khoản phụ huynh | Chuyển về `/phu-huynh` |
| Con bị khóa tài khoản | Không còn trong danh sách con |
| Thông báo cũ `/phu-huynh/buoi/<id>?con=<id>` | Tự đổi sang con đó rồi mở buổi |
| Thông báo `/phu-huynh/bai-tap` (không kèm con) | Mở theo con đang chọn |

## 6. Dữ liệu và quyền
Chỉ con có liên kết trong `guardianships` (`listMyChildren`, kiểm tra mỗi request); service học sinh nhận "học sinh hiệu lực" dựng từ con đang chọn (`requireLearner`); ghi audit khi nộp bài/đề thay con.

## 7. Kiểm thử
TC-034; TC-UAT-11, 13. Kiểm tay: đổi con rồi mở lại URL lớp của con cũ → 404; phụ huynh nộp bài → bài hiện "Đã nộp" ở tài khoản học sinh; Nhật ký có dòng `submission.parent_submit`.
