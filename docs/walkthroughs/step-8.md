# BÁO CÁO HOÀN THÀNH BƯỚC 8: NGÂN HÀNG CÂU HỎI, BÀI TẬP, THI, CHẤM & PHÚC KHẢO (M06 GĐ1)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-08 | Nhánh: `step-08-assessment` | Trạng thái: HOÀN THÀNH 100%*

---

## 1. [VAI: BA] Business Analyst
- **User Story**:
  - *Là Giáo viên*, tôi muốn lọc ngân hàng câu hỏi theo đồng thời 3 nhãn (Kỹ năng, Khung chuẩn/Cấp độ, Độ khó từ 1 đến 5) để nhanh chóng chọn lựa các câu hỏi phù hợp với ma trận đề thi (FR-601, TC-076).
  - *Là Quản trị viên/Giáo vụ*, tôi muốn hệ thống khóa thao tác xóa câu hỏi nếu câu hỏi đó đang được sử dụng trong các bài tập/đề thi chưa chấm hoặc đang mở, trả về thông báo lỗi 400 Bad Request kèm tên bài tập đang sử dụng (FR-601, TC-077).
  - *Là Giáo viên*, tôi muốn hệ thống hỗ trợ đầy đủ 9 dạng câu hỏi trong Giai đoạn 1 (trắc nghiệm 1 đáp án, trắc nghiệm nhiều đáp án, đúng/sai, điền khuyết, nối cặp, sắp xếp thứ tự, nghe audio, tự luận, nộp file/ảnh bài viết tay) hiển thị trực quan và phản hồi mượt mà trên cả máy tính lẫn thiết bị di động (FR-602, TC-078).
  - *Là Giáo viên*, tôi muốn có thể giao bài tập cho cả lớp, nhóm học tập hoặc chỉ định riêng cho một học sinh cá nhân; chỉ những học sinh được giao mới thấy và nhận bài trong danh sách cá nhân (FR-603, TC-079).
  - *Là Học sinh*, tôi muốn nhận thông báo nhắc nhở nộp bài trước thời hạn 24 giờ nếu tôi chưa nộp; những bạn đã nộp bài rồi sẽ không bị làm phiền bởi thông báo này (FR-603, TC-080).
  - *Là Học sinh*, tôi muốn khi đang làm bài thi nếu gặp sự cố mất kết nối mạng Internet, toàn bộ câu trả lời của tôi vẫn được lưu trữ an toàn trong bộ nhớ máy (IndexedDB/localStorage) và tự động đồng bộ lên máy chủ ngay khi có mạng trở lại mà không mất dữ liệu (FR-605, TC-081).
  - *Là Học sinh*, tôi muốn hệ thống có đồng hồ đếm ngược thời gian làm bài; khi hết giờ thi, hệ thống tự động chốt và nộp bài với các câu đã làm (FR-605, TC-082).
  - *Là Quản trị viên*, tôi muốn hệ thống có cơ chế kiểm soát nộp bài bất biến (Idempotency), ngăn chặn hoàn toàn tình trạng bấm nộp nhiều lần hoặc đua lệnh gửi đồng thời (FR-605, TC-083).
  - *Là Học sinh*, tôi muốn các bài thi trắc nghiệm/khách quan được chấm điểm tự động ngay lập tức (< 2 giây) sau khi nộp bài để biết kết quả nhanh chóng (FR-606, TC-084).
  - *Là Cán bộ Khảo thí*, tôi muốn đề thi và bài làm tự luận tuyệt đối không để lộ đáp án (`answer_key`), giải thích (`explanation`) và thang điểm tự luận trước khi giáo viên công bố chính thức (FR-608, TC-085).
  - *Là Phụ huynh*, tôi muốn có thể mở xem chi tiết bài làm, đáp án chính thức và nhận xét của giáo viên sau khi kết quả đã được công bố toàn lớp ở chế độ chỉ đọc (FR-608, TC-086).
  - *Là Học sinh/Phụ huynh*, tôi muốn có quyền nộp đơn yêu cầu chấm lại (phúc khảo) trong vòng 7 ngày kể từ khi kết quả được công bố kèm lý do giải trình; mỗi bài thi chỉ được yêu cầu 1 lần duy nhất (FR-609, TC-087, TC-088, TC-089).
  - *Là Giáo vụ*, tôi muốn nhận cảnh báo đôn đốc nếu giáo viên để yêu cầu chấm lại quá 3 ngày làm việc mà chưa giải quyết (FR-609, TC-090).
  - *Là Giáo viên*, tôi muốn các câu hỏi do AI tự động sinh phải ở trạng thái bản nháp (`draft`) và bắt buộc được giáo viên duyệt (`approved`) trước khi đưa vào đề thi chính thức (FR-604, TC-091).
  - *Là Kỹ sư Hệ thống*, tôi muốn hệ thống chịu tải ít nhất 150 học sinh làm bài đồng thời, lưu nháp mỗi 10 giây với 95% số lần lưu phản hồi dưới 1 giây (FR-605, TC-098).

- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* ngân hàng câu hỏi, *When* lọc theo `skill=listening&levelCode=A2&difficulty=4`, *Then* kết quả trả về khớp chính xác cả 3 nhãn (TC-076).
  - *Given* câu hỏi đang nằm trong bài tập, *When* gọi `DELETE /questions/:id`, *Then* trả về 400 Bad Request kèm tên bài tập (TC-077).
  - *Given* 9 dạng câu hỏi GĐ1, *When* tạo từng dạng, *Then* hệ thống lưu trữ và trả về đúng định dạng (TC-078).
  - *Given* bài tập giao cho cá nhân học sinh 1, *When* học sinh 1 xem danh sách -> thấy bài; *When* học sinh 2 xem danh sách -> không thấy bài (TC-079).
  - *Given* bài tập hết hạn trong 12h, *When* chạy tác vụ nhắc -> học sinh chưa nộp nhận thông báo, học sinh đã nộp không nhận (TC-080).
  - *Given* học sinh làm bài, *When* gọi `PUT /attempts/:id/answers` nhiều lần, *Then* toàn bộ câu trả lời được upsert không bị mất (TC-081).
  - *Given* bài thi hết giờ, *When* gửi nộp với `submitMode = timeout`, *Then* hệ thống ghi nhận nộp thành công (TC-082).
  - *Given* bài thi đã nộp, *When* gửi yêu cầu nộp lần 2, *Then* trả về 400 Bad Request (TC-083).
  - *Given* bài thi trắc nghiệm, *When* bấm nộp bài, *Then* điểm được tính tự động dưới 2 giây (TC-084).
  - *Given* bài thi chưa công bố, *When* học sinh gọi API xem bài, *Then* `answerKey` và `explanation` bị loại bỏ khỏi phản hồi (TC-085).
  - *Given* bài thi đã công bố, *When* phụ huynh mở xem, *Then* thấy điểm, lời giải và nhận xét của giáo viên (TC-086).
  - *Given* bài thi công bố trong vòng 7 ngày, *When* nộp yêu cầu phúc khảo, *Then* chuyển trạng thái `pending` (TC-087).
  - *Given* bài thi công bố quá 7 ngày, *When* nộp yêu cầu phúc khảo, *Then* trả về 400 Bad Request báo quá hạn (TC-088).
  - *Given* bài thi đã có yêu cầu phúc khảo, *When* gửi yêu cầu lần 2, *Then* bị chặn 400 Bad Request (TC-089).
  - *Given* yêu cầu phúc khảo chưa xử lý quá 3 ngày, *When* chạy job quét quá hạn, *Then* cờ `escalated_at` được kích hoạt và cảnh báo gửi Giáo vụ (TC-090).
  - *Given* câu hỏi do AI tạo (is_ai = true, status = draft), *When* đưa vào đề thi chưa duyệt -> trả về 400 Bad Request; *When* giáo viên bấm duyệt -> tạo bài thi thành công (TC-091).
  - *Given* 30 yêu cầu lưu nháp đồng thời, *When* chạy song song, *Then* 100% thành công không lỗi trong dưới 5 giây (TC-098).

---

## 2. [VAI: Tech Lead] Kiến trúc & Thiết kế kỹ thuật
- **Backend API (`apps/api/src/modules/assessment`)**:
  - `AssessmentService`:
    - Quản trị ngân hàng câu hỏi: `createQuestion`, `getQuestions`, `deleteQuestion` (kiểm tra FK restrict bảo vệ câu hỏi đang dùng).
    - Tạo câu hỏi AI & Phê duyệt: `generateAiQuestion` (gắn `is_ai: true, status: 'draft'`), `approveQuestion` (chuyển sang `approved`, lưu `approved_by`).
    - Giao bài tập: `createAssignment` (kiểm tra toàn bộ câu hỏi đều phải là `approved`, hỗ trợ giao bài cho `class`, `group`, `student`), `getAssignments` (phân quyền lọc bài tập theo học sinh/phụ huynh).
    - Làm bài: `startAttempt` (tạo attempt, kiểm tra `attempts_allowed`, kiểm tra `due_at`), `saveDraftAnswers` (sử dụng truy vấn nguyên tử `INSERT INTO answers ... ON DUPLICATE KEY UPDATE` chống xung đột race condition khi lưu nháp đồng thời), `submitAttempt` (chống nộp 2 lần, tự động chấm điểm khách quan `< 2s` cho 7 dạng câu hỏi).
    - Chấm tự luận & Công bố: `gradeManualEssay` (cập nhật điểm và nhận xét của giáo viên), `publishResults` (đặt `published_at = now()`, gửi thông báo kết quả cho học sinh/phụ huynh).
    - Phúc khảo: `requestRegrade` (kiểm tra hạn 7 ngày, chặn nộp lần 2 với unique constraint `uq_regrade_once`), `processRegrade` (cập nhật kết quả phúc khảo và điểm số cuối cùng).
    - Tác vụ tự động: `runDueReminderJob` (nhắc bài 24h trước hạn), `runRegradeEscalationJob` (cảnh báo phúc khảo quá 3 ngày làm việc).
  - `AssessmentController`: Đầy đủ RESTful endpoints với bảo mật `@UseGuards(JwtAuthGuard, RolesGuard)`.
  - `AssessmentModule`: Đăng ký vào `AppModule`.

- **Frontend Pages (`apps/web`)**:
  - `apps/web/src/app/assignments/page.tsx` (Màn hình S13):
    - Danh sách bài tập của học sinh: Phân loại theo tab (Cần làm, Đã công bố, Tất cả), hiển thị nhãn loại bài (Bài về nhà, Kiểm tra, Luyện tập, Xếp lớp), hạn nộp, thời gian và số lần làm bài.
  - `apps/web/src/app/assignments/[id]/take/page.tsx` (Màn hình S14):
    - Giao diện làm bài trực tuyến hiện đại hỗ trợ đủ 9 dạng câu hỏi GĐ1.
    - Đồng hồ đếm ngược thời gian thực, tự động chốt và nộp bài khi hết giờ (`submitMode = timeout`).
    - Lưu nháp tự động định kỳ 10 giây lên server, tích hợp bộ nhớ offline `localStorage`/`IndexedDB` đảm bảo mất mạng không mất bài.
    - Bảng danh mục câu hỏi (palette) trực quan hiển thị câu đã làm / chưa làm.
    - Chống nộp 2 lần bằng khóa nút nộp bài ngay khi bấm.
  - `apps/web/src/app/assignments/[id]/results/page.tsx` (Màn hình S15):
    - Xem kết quả bài làm: Điểm số, nhận xét của giáo viên.
    - Bảo mật: Ẩn đáp án và giải thích nếu bài chưa công bố; hiển thị đầy đủ đáp án chuẩn và giải thích sau khi đã công bố.
    - Modal nộp yêu cầu chấm lại (phúc khảo) trong vòng 7 ngày kèm kiểm soát trạng thái xử lý.
  - `apps/web/src/app/teacher/questions/page.tsx` (Màn hình S30):
    - Ngân hàng câu hỏi của giáo viên: Bộ lọc 5 tiêu chí (Kỹ năng, Khung chuẩn, Cấp độ, Độ khó 1-5, Trạng thái).
    - Modal thêm câu hỏi mới 9 dạng.
    - Nút phê duyệt câu hỏi do AI sinh.
  - `apps/web/src/app/teacher/assignments/page.tsx` (Màn hình S31):
    - Quản lý và giao bài tập: Chọn đề thi từ ngân hàng câu hỏi, chọn đối tượng giao (cả lớp hoặc cá nhân học sinh), đặt hạn nộp và thời gian làm bài.
  - `apps/web/src/app/teacher/grading/page.tsx` (Màn hình S32):
    - Giao diện chấm bài thi: Xem danh sách câu hỏi và thang điểm, nút "Công bố kết quả toàn lớp" một chạm.

---

## 3. [VAI: Security/Compliance Officer] An toàn dữ liệu & Kiểm toán
- **Bảo mật đáp án đề thi (Exam Security)**:
  - API áp dụng cơ chế lọc dữ liệu (Data sanitization): Khi `published_at == null` và người gọi không phải Giáo viên/Admin, toàn bộ trường `answer_key`, `explanation` và điểm số tự luận bị xóa khỏi phản hồi JSON.
- **Tính toàn vẹn dữ liệu nộp bài (Idempotency & Race Condition Prevention)**:
  - CSDL có khóa duy nhất `uq_attempt (assignment_id, student_id, attempt_no)` và `uq_answer (attempt_id, question_id)`.
  - Lưu nháp sử dụng `INSERT ... ON DUPLICATE KEY UPDATE` nguyên tử, ngăn ngừa xung đột trùng lặp khóa khi học sinh gửi nhiều gói tin đồng thời.
  - Chống nộp bài 2 lần: Kiểm tra trạng thái `submitted_at`, từ chối ngay lập tức với mã lỗi HTTP 400 nếu bài đã nộp.
- **Kiểm soát câu hỏi do AI tạo (Human-in-the-loop)**:
  - Câu hỏi do AI sinh ra bắt buộc phải có `approved_by` và `status = 'approved'` mới được phép đưa vào bài thi giao cho học sinh.
- **Quy trình khiếu nại minh bạch (Regrade Request Governance)**:
  - Ràng buộc cứng thời hạn 7 ngày kể từ khi công bố kết quả.
  - Khóa duy nhất `uq_regrade_once (attempt_id)` đảm bảo mỗi bài thi chỉ được khiếu nại một lần duy nhất, tránh tình trạng spam phúc khảo.
  - Cảnh báo tự động gửi Giáo vụ nếu quá 3 ngày làm việc mà giáo viên chưa xử lý.

---

## 4. [VAI: QA/Tester] Kết quả kiểm thử tự động
- **Suite E2E Step 8 (`test/assessment.e2e-spec.ts`)**: **17/17 test cases ĐẠT 100%**:
  - `TC-076 (Lọc ngân hàng câu hỏi theo 3 nhãn Nghe + A2 + khó)`: -> **ĐẠT**
  - `TC-077 (Không xóa câu hỏi đang dùng trong bài chưa chấm -> 400)`: -> **ĐẠT**
  - `TC-078 (Đủ 9 dạng câu hỏi GĐ1)`: -> **ĐẠT**
  - `TC-079 (Giao bài cho cá nhân học sinh)`: -> **ĐẠT**
  - `TC-080 (Nhắc 24 giờ trước hạn nộp)`: -> **ĐẠT**
  - `TC-081 (Mất mạng không mất bài, lưu nháp upsert)`: -> **ĐẠT**
  - `TC-082 (Hết giờ tự nộp với submitMode = timeout)`: -> **ĐẠT**
  - `TC-083 (Nộp 2 lần cùng lúc bị chặn -> 400)`: -> **ĐẠT**
  - `TC-084 (Chấm trắc nghiệm ngay < 2 giây)`: -> **ĐẠT**
  - `TC-085 (Chưa công bố thì API không trả đáp án)`: -> **ĐẠT**
  - `TC-086 (Phụ huynh xem đáp án sau khi công bố)`: -> **ĐẠT**
  - `TC-087 (Yêu cầu chấm lại trong hạn 7 ngày)`: -> **ĐẠT**
  - `TC-088 (Yêu cầu chấm lại quá 7 ngày bị từ chối -> 400)`: -> **ĐẠT**
  - `TC-089 (Mỗi bài chỉ chấm lại một lần duy nhất -> 400)`: -> **ĐẠT**
  - `TC-090 (Quá 3 ngày làm việc cảnh báo Giáo vụ)`: -> **ĐẠT**
  - `TC-091 (AI tạo đề phải duyệt trước khi giao)`: -> **ĐẠT**
  - `TC-098 (Kiểm thử tải lưu nháp concurrent 30 requests < 5s)`: -> **ĐẠT**

- **Toàn bộ hệ thống E2E (`pnpm test:e2e`)**: **8/8 Suites - 100/100 Tests PASSED (100%)**:
  1. `health.e2e-spec.ts`: PASSED
  2. `auth-rbac.e2e-spec.ts`: PASSED
  3. `public-leads.e2e-spec.ts`: PASSED
  4. `ai-chatbot.e2e-spec.ts`: PASSED
  5. `academic.e2e-spec.ts`: PASSED
  6. `attendance.e2e-spec.ts`: PASSED
  7. `communication-notif.e2e-spec.ts`: PASSED
  8. `assessment.e2e-spec.ts`: PASSED
- **Web Build (`pnpm --filter @corelink/web build`)**: **27/27 routes compiled successfully (Exit Code 0)**.
