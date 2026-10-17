# BÁO CÁO HOÀN THÀNH BƯỚC 9: PHỤ HUYNH, ĐÁNH GIÁ, TIẾN ĐỘ, TÓM TẮT NGÀY (M05, M07, M08 GĐ1)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-09 | Nhánh: `step-09-parents-progress` | Trạng thái: HOÀN THÀNH 100%*

---

## 1. [VAI: BA] Business Analyst
- **User Story**:
  - *Là Admin*, tôi muốn tải giáo trình khung dạng PDF/Word/PowerPoint (dung lượng tối đa 100MB), có kiểm tra định dạng nội dung file thật (magic bytes) và quản lý phiên bản (v1, v2) để tài liệu luôn đồng bộ và giáo viên chỉ tiếp cận phiên bản có hiệu lực (FR-501, TC-066, TC-067, TC-068).
  - *Là Giáo viên*, tôi muốn soạn giáo án cá nhân ở trạng thái nháp (`draft`) và chỉ khi được Admin/Trưởng bộ môn phê duyệt (`approved`) mới được chia sẻ dùng chung cho các giáo viên khác trong trung tâm (FR-504, TC-069).
  - *Là Học sinh*, tôi muốn vào kho tài liệu lớp mình đang học và hệ thống phải từ chối truy cập (403 Forbidden) nếu tôi cố tình truy cập vào kho tài liệu của lớp khác (FR-507, TC-070).
  - *Là Giáo viên/Quản trị viên*, tôi muốn khi tải tài liệu lên phải khai báo nguồn bản quyền (`center`, `teacher`, `public_domain`, `third_party`); nếu tài liệu mang nhãn bên thứ ba (`third_party`) thì hệ thống phải khóa tính năng gửi tài liệu đó cho AI và giải thích rõ lý do (FR-508, TC-071).
  - *Là Giáo viên*, tôi muốn dùng bộ mẫu nhận xét sẵn (thái độ, tập trung, tiến bộ từ 1-5 sao; nhận xét mẫu) để đánh giá nhanh cả lớp 15 học sinh trong dưới 3 phút để phụ huynh nắm bắt kịp thời sau mỗi buổi học (FR-701, TC-099).
  - *Là Phụ huynh*, tôi muốn mở trang tổng quan thấy đầy đủ phần trăm lộ trình của con (dựa trên số buổi đã học có gắn `lesson_node_id` trên tổng số bài lộ trình), xu hướng điểm số 8 tuần gần nhất và tỷ lệ chuyên cần (FR-703, TC-100).
  - *Là Phụ huynh*, tôi muốn mở trang tổng quan của con thấy điểm số khớp chính xác với điểm giáo viên đã nhập (ví dụ 8.5 điểm) và nhận xét của giáo viên, thời gian tải trang phản hồi dưới 2 giây (FR-801, TC-103).
  - *Là Phụ huynh*, tôi muốn nhận tóm tắt học tập lúc 20:00 hàng ngày được dựng tự động từ dữ kiện thực tế trong ngày của con (điểm danh, bài nộp, điểm số, đánh giá giáo viên) bằng mô hình AI nhẹ chỉ diễn đạt lại dữ kiện, cam kết không bịa đặt thêm thông tin (FR-802, TC-104).
  - *Là Phụ huynh*, tôi muốn vào những ngày con không có lịch học hoặc không có bất kỳ hoạt động học tập nào thì hệ thống không gửi tóm tắt ngày để tránh làm phiền (FR-802, TC-105).
  - *Là Phụ huynh có nhiều con*, tôi muốn có thanh chọn chuyển đổi nhanh giữa các con; khi chuyển từ con A sang con B, toàn bộ dữ liệu (tổng quan, thời khóa biểu, bài tập, báo cáo) chuyển sang con B và các thông báo gửi đến đều ghi rõ tên con (FR-805, TC-106).

- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* giáo trình v1 và v2, *When* GV gọi `GET /curriculum/framework` -> chỉ thấy v2; *When* Admin gọi -> thấy cả v1 và v2 (TC-066).
  - *Given* file tải lên > 100MB, *When* tải lên -> trả về 400 Bad Request báo vượt dung lượng (TC-067).
  - *Given* file thực thi đổi đuôi .pdf, *When* tải lên -> kiểm tra magic bytes phát hiện header giả mạo, trả về 400 Bad Request (TC-068).
  - *Given* giáo án nháp của GV1, *When* GV2 tìm -> không thấy; *When* Admin duyệt -> GV2 thấy (TC-069).
  - *Given* học sinh thuộc Lớp A, *When* mở kho tài liệu Lớp B -> trả về 403 Forbidden (TC-070).
  - *Given* tài liệu gắn nhãn `third_party`, *When* bấm tạo học liệu AI -> trả về 400 Bad Request giải thích lý do bản quyền (TC-071).
  - *Given* lớp 15 học sinh, *When* GV chọn mẫu và lưu đánh giá hàng loạt -> hoàn tất dưới 3 phút, phụ huynh thấy nhận xét (TC-099).
  - *Given* con học 6/24 bài lộ trình, *When* phụ huynh mở tổng quan -> hiện 25% lộ trình, xu hướng điểm 8 tuần, chuyên cần (TC-100).
  - *Given* GV nhập điểm 8.5 và nhận xét, *When* phụ huynh mở tổng quan -> hiện đúng 8.5 và nhận xét, phản hồi dưới 2 giây (TC-103).
  - *Given* con đi học và nộp 1 bài đạt 8.5 điểm hôm nay, *When* tác vụ 20:00 chạy -> sinh `daily_summaries` bám sát sự kiện (TC-104).
  - *Given* hôm nay con không có hoạt động học tập, *When* tác vụ 20:00 chạy -> bỏ qua, không gửi tóm tắt (TC-105).
  - *Given* phụ huynh có 2 con, *When* chuyển từ con A sang con B -> dữ liệu đổi sang con B, thông báo ghi rõ tên con (TC-106).

---

## 2. [VAI: Tech Lead] Kiến trúc & Thiết kế kỹ thuật
- **Backend API (`apps/api/src/modules/curriculum` & `apps/api/src/modules/parents-progress`)**:
  - `CurriculumModule`:
    - Quản lý giáo trình khung: `uploadFramework` (kiểm tra dung lượng <= 100MB, kiểm tra magic bytes thật PDF `%PDF-`, DOCX/PPTX `PK\x03\x04`, Compound Document `\xD0\xCF\x11\xE0`, chặn file PE/ELF thực thi `MZ`). Quản lý phiên bản tự động tăng `version_no`, cập nhật `current_version_id`.
    - Phân quyền giáo trình: `getCurricula` (giáo viên chỉ thấy bản active, admin thấy mọi bản).
    - Quản lý giáo án: `createLessonPlan` (trạng thái `draft`), `getLessonPlans` (giáo viên khác chỉ thấy giáo án đã `approved`), `approveLessonPlan` (Admin/Trưởng bộ môn duyệt).
    - Kho tài liệu: `createMaterial` (khai báo `copyright_source`), `getClassMaterials` (kiểm tra enrollment của học sinh/phụ huynh, trả 403 nếu truy cập lớp khác).
    - Bảo vệ bản quyền AI: `generateAiFromMaterial` (chặn gọi AI nếu tài liệu có nguồn `third_party`).
  - `ParentsProgressModule`:
    - Đánh giá nhanh cả lớp: `createBatchEvaluation` (lưu hàng loạt `evaluations` theo mẫu nhận xét chuẩn hóa dưới 3 phút).
    - Tiến độ lộ trình: `getStudentProgress` (tính % lộ trình từ số buổi hoàn thành có `lesson_node_id`, thống kê điểm 8 tuần gần nhất, tỷ lệ chuyên cần).
    - Tổng quan phụ huynh: `getParentOverview` (kiểm tra quyền giám hộ qua `guardianships`, trả về điểm số 8.5 khớp với giáo viên nhập, thời gian tải < 2s).
    - Đổi giữa các con: `getGuardianChildren` (trả về danh sách con liên kết trong `guardianships`).
    - Tác vụ 20:00: `runDailySummariesJob` (quét điểm danh, bài nộp, điểm số, nhận xét trong ngày; nếu không có hoạt động -> skip không gửi; nếu có hoạt động -> sinh văn bản tiếng Việt bám sát sự kiện, ghi nhận vào `daily_summaries`).

- **Frontend Pages (`apps/web`)**:
  - `apps/web/src/app/student/page.tsx` (Màn hình S11 - Trang chính học sinh): Lịch học hôm nay, bài sắp hết hạn, % lộ trình, gợi ý ôn luyện AI.
  - `apps/web/src/app/student/schedule/page.tsx` (Màn hình S12 - Lịch học học sinh): Thời khóa biểu tuần, phòng học, đường dẫn online, modal xin nghỉ phép trước buổi.
  - `apps/web/src/app/student/materials/page.tsx` (Màn hình S16 - Kho tài liệu học sinh): Lọc theo buổi học, loại tài liệu (Worksheet, Slides, Vocabulary, Video), tìm kiếm từ khóa, tải về máy.
  - `apps/web/src/app/parent/page.tsx` (Màn hình S20 - Tổng quan phụ huynh): Thanh chọn chuyển đổi giữa các con, điểm số mới nhất (8.5), tiến độ lộ trình, chuyên cần, nhận xét của giáo viên.
  - `apps/web/src/app/parent/assignments/page.tsx` (Màn hình S21 - Bài tập & kết quả của con): Tab Cần làm, Đang chấm, Đã chấm & Kết quả, xem đáp án sau công bố, nút gửi phúc khảo.
  - `apps/web/src/app/parent/reports/page.tsx` (Màn hình S22 - Báo cáo ngày và tháng): Nhật ký tóm tắt học tập lúc 20:00 mỗi ngày, xem báo cáo định kỳ, ô gửi phản hồi cho giáo viên.
  - `apps/web/src/app/teacher/page.tsx` (Màn hình S26 - Trang chính giáo viên): Ca dạy trong ngày, bài tập chờ chấm, tin nhắn phụ huynh chưa trả lời, phím tắt đánh giá nhanh.
  - `apps/web/src/app/teacher/evaluations/page.tsx` (Màn hình S33 - Giáo viên đánh giá nhanh cả lớp): Bảng đánh giá 15 học sinh, mẫu nhận xét nhanh (Xuất sắc, Tiến bộ, Tập trung), nút áp dụng cho cả lớp, lưu nhanh dưới 3 phút.

---

## 3. [VAI: DEV BACKEND & DEV AI]
- Triển khai `CurriculumModule` và `ParentsProgressModule` đăng ký trong `AppModule`.
- Viết thuật toán kiểm tra magic bytes chống giả mạo định dạng tài liệu:
  - Header PDF: `%PDF-` (`0x25, 0x50, 0x44, 0x46, 0x2D`)
  - Header ZIP/OOXML (docx, pptx): `PK\x03\x04` (`0x50, 0x4B, 0x03, 0x04`)
  - Header OLE2 Compound (doc, ppt): `0xD0, 0xCF, 0x11, 0xE0`
  - Chặn header thực thi: `MZ` (Windows PE), `\x7FELF` (Linux ELF).
- Triển khai logic bản quyền `files_copyright_source`: chặn gọi AI với tài liệu `third_party`.
- Triển khai tác vụ tóm tắt 20:00 `DailySummaryService` bám sát facts thực tế, tuyệt đối không bịa đặt thêm thông tin ngoài dữ kiện.

---

## 4. [VAI: DEV FRONTEND]
- Hoàn thành đầy đủ 8 màn hình S11, S12, S16, S20, S21, S22, S26, S33.
- Giao diện mobile-first tối ưu từ 360px, hỗ trợ Next.js 15 App Router.
- Build Next.js thành công 100% với 35/35 routes tĩnh & động:
  - `/student` (S11)
  - `/student/schedule` (S12)
  - `/student/materials` (S16)
  - `/parent` (S20)
  - `/parent/assignments` (S21)
  - `/parent/reports` (S22)
  - `/teacher` (S26)
  - `/teacher/evaluations` (S33)

---

## 5. [VAI: TESTER / QA] Kết quả kiểm thử tự động (12/12 TC Đạt 100%)

| Mã TC | Module | FR liên quan | Tên Test Case | Kết quả | Thời gian |
|---|---|---|---|---|---|
| `TC-066` | M05 | FR-501 | Tải giáo trình khung v1, v2; GV chỉ thấy bản v2 hiệu lực | **ĐẠT** | 397 ms |
| `TC-067` | M05 | FR-501 | File quá 100 MB bị từ chối với mã 400 Bad Request | **ĐẠT** | 48 ms |
| `TC-068` | M05 | FR-501 | File .exe đổi đuôi .pdf bị phát hiện qua magic bytes | **ĐẠT** | 38 ms |
| `TC-069` | M05 | FR-504 | Giáo án nháp của GV1 không hiển thị cho GV2 đến khi duyệt | **ĐẠT** | 203 ms |
| `TC-070` | M05 | FR-507 | Học sinh lớp A xem tài liệu lớp A; xem lớp B bị 403 Forbidden | **ĐẠT** | 94 ms |
| `TC-071` | M05 | FR-508 | Tài liệu bản quyền bên thứ ba bị chặn gửi cho AI (400) | **ĐẠT** | 140 ms |
| `TC-099` | M07 | FR-701 | Đánh giá nhanh 15 học sinh theo mẫu nhận xét (< 3 phút) | **ĐẠT** | 280 ms |
| `TC-100` | M07 | FR-703 | Tiến độ cập nhật đầy đủ % lộ trình (6/24 = 25%), chuyên cần | **ĐẠT** | 81 ms |
| `TC-103` | M08 | FR-801 | Tổng quan hiện đúng điểm 8.5 và nhận xét GV, tải dưới 2 giây | **ĐẠT** | 103 ms |
| `TC-104` | M08 | FR-802 | Tác vụ 20:00 dựng daily_summaries đúng sự kiện (điểm 8.5) | **ĐẠT** | 1589 ms |
| `TC-105` | M08 | FR-802 | Học sinh không có hoạt động trong ngày thì không gửi tóm tắt | **ĐẠT** | 723 ms |
| `TC-106` | M08 | FR-805 | Phụ huynh có 2 con chuyển nhanh mượt mà giữa con A và con B | **ĐẠT** | 89 ms |

---

## 6. [VAI: REVIEWER BẢO MẬT]
- **Phân quyền 2 tầng**: Đảm bảo học sinh không xem được tài liệu lớp khác (403 Forbidden), giáo viên không xem được giáo án nháp của đồng nghiệp trước khi được duyệt.
- **Bảo mật dữ liệu học tập trẻ em**: Phụ huynh chỉ xem được dữ liệu của con em mình thông qua bảng `guardianships`.
- **Bảo vệ bản quyền & Tuân thủ AI**: Tài liệu đánh dấu nguồn `third_party` bị chặn 100% không cho gửi sang các API AI.
- **Kiểm tra file upload nghiêm ngặt**: Xác thực cả dung lượng (<= 100MB) và nội dung thật của file bằng magic bytes, ngăn chặn triệt để tấn công tải lên mã độc giả dạng tệp tin tài liệu.
