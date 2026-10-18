# QUY TẮC NGHIỆP VỤ HỆ THỐNG — CORELINK ACADEMY (BUSINESS RULES)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: Solution Architect & Business Analyst  

---

## 1. QUY TẮC TUYỂN SINH & KHÁCH TIỀM NĂNG (CRM & LEADS)

1. **Chuẩn hóa Thông tin Liên hệ (BR-CRM-01)**:
   - Mọi số điện thoại nhập vào hệ thống bắt buộc được chuẩn hóa về định dạng E.164 của Việt Nam (`+84xxxxxxxxx`).
2. **Kiểm tra và Xử lý Khách hàng Trùng lặp (BR-CRM-02)**:
   - Khi có khách hàng gửi biểu mẫu trùng số điện thoại hoặc email với một Lead đã tồn tại:
     - Nếu Lead cũ đang ở trạng thái chưa hoàn tất (`NEW`, `CONTACTED`, `CONSULTING`), hệ thống tự động gộp yêu cầu mới vào dòng thời gian hoạt động của Lead cũ và cập nhật `updated_at`.
     - Tuyệt đối không tự ý ghi đè làm mất lịch sử ghi chú chăm sóc trước đó của nhân viên.
3. **Chuyển đổi Khách hàng thành Học viên (BR-CRM-03)**:
   - Thao tác chuyển đổi Lead sang Học viên phải diễn ra trong một giao dịch duy nhất (Atomic Database Transaction). Nếu có lỗi ở bất kỳ bước nào (ví dụ lớp học đã hết chỗ), toàn bộ giao dịch sẽ rollback và giữ nguyên trạng thái Lead.

---

## 2. QUY TẮC ĐÀO TẠO, XẾP LỊCH & SĨ SỐ (ACADEMIC & SCHEDULING)

1. **Phát hiện Xung đột Lịch học 3 Chiều (BR-ACAD-01)**:
   - Trước khi tạo hoặc sửa một buổi học (`class_sessions`), hệ thống tự động quét và chặn nếu xảy ra bất kỳ xung đột nào sau đây:
     - **Trùng Phòng học**: Phòng học đã có buổi học khác diễn ra trong cùng khung giờ.
     - **Trùng Giảng viên**: Giảng viên đã được phân công dạy lớp khác trong cùng khung giờ.
     - **Trùng Học viên**: Học viên đã có lịch học ở một lớp khác đang hoạt động.
   - Khi phát hiện xung đột, API trả về lỗi `409 Conflict` kèm danh sách chi tiết các buổi học bị va chạm để Giáo vụ điều chỉnh.
2. **Chống Vượt Sĩ số Lớp học (BR-ACAD-02)**:
   - Sĩ số lớp học được kiểm soát nghiêm ngặt theo `classes.max_capacity`.
   - Khi thực hiện ghi danh, hệ thống sử dụng khóa bi quan (Row Locking) trên bản ghi lớp học để đếm chính xác số học viên đang `active`. Tuyệt đối không cho phép ghi danh vượt quá sức chứa quy định.
3. **Quy tắc Sinh Lịch học và Ngày Nghỉ (BR-ACAD-03)**:
   - Khi sinh lịch học định kỳ theo quy tắc tuần, thuật toán tự động đối chiếu với bảng `holidays` (danh mục ngày lễ quốc gia và lịch nghỉ riêng của trung tâm). Các buổi học trùng ngày nghỉ sẽ tự động bị bỏ qua và dời lịch tương ứng.

---

## 3. QUY TẮC ĐIỂM DANH & CHUYÊN CẦN (ATTENDANCE)

1. **Mã QR Điểm danh Động (BR-ATT-01)**:
   - Mã QR điểm danh được sinh bằng thuật toán ký HMAC-SHA256 (`QR_HMAC_SECRET` kết hợp với `session_id` và timestamp), tự động xoay mới mỗi 30 giây.
   - Mã QR đã hết hạn hoặc bị chụp lại chia sẻ cho người khác sẽ bị từ chối ngay lập tức.
2. **Xác thực Mở lớp Trực tiếp (BR-ATT-02)**:
   - Giáo viên mở lớp học trực tiếp tại trung tâm bắt buộc phải chụp ảnh lớp và gửi tọa độ GPS. Tọa độ này phải nằm trong bán kính cho phép (mặc định 150 mét) so với tọa độ của cơ sở (`branches.checkin_radius_m`).
3. **Thời hạn Đi muộn và Cảnh báo Chuyên cần (BR-ATT-03)**:
   - Học sinh quét mã sau 15 phút kể từ giờ bắt đầu buổi học sẽ tự động được ghi nhận là "Đi muộn" (LATE).
   - Nếu học sinh vắng mặt không phép 2 buổi liên tiếp, hệ thống tự động tạo thông báo ưu tiên cao gửi tới Giáo vụ để liên hệ gia đình.

---

## 4. QUY TẮC KHẢO THÍ & BÀI THI (ASSESSMENT)

1. **Bảo mật Đáp án Đề thi (BR-EXAM-01)**:
   - Payload trả về từ API làm bài thi (`GET /api/v1/assessment/exams/:id/start`) tuyệt đối không bao gồm trường `answer_key` hoặc giải thích đáp án đúng. Đáp án chỉ được trả về sau khi học sinh đã nộp bài thành công hoặc bài thi đã được công bố kết quả.
2. **Kiểm soát Thời gian Làm bài Thi (BR-EXAM-02)**:
   - Thời gian làm bài thi được tính toán và kiểm tra chặt chẽ phía Server. Khi hết thời gian quy định, mọi câu trả lời gửi lên sau đó sẽ bị từ chối và hệ thống tự động chốt bài nộp với các câu đã lưu nháp.
3. **Nguyên tắc "AI Soạn, Người Duyệt" (BR-EXAM-03)**:
   - Điểm số và nhận xét từ AI chỉ được ghi nhận vào các trường tạm `ai_score` và `ai_points`. Chỉ khi giáo viên chuyên môn xem xét và nhấn "Xác Nhận Điểm", điểm số đó mới trở thành `final_score` chính thức và hiển thị cho học viên/phụ huynh.

---

## 5. QUY TẮC TÀI CHÍNH, HỌC PHÍ & BIÊN NHẬN (FINANCE)

1. **Định dạng Tiền tệ Chính xác (BR-FIN-01)**:
   - Mọi trường tiền tệ trong cơ sở dữ liệu và mã nguồn bắt buộc sử dụng kiểu dữ liệu số thực chính xác `Decimal(12, 2)` hoặc `BIGINT` (đơn vị Đồng). Tuyệt đối cấm sử dụng số thực dấu phẩy động `Float` để tránh sai số làm tròn tài chính.
2. **Cấp Biên nhận Tuần tự Chống Trùng lặp (BR-FIN-02)**:
   - Số biên nhận thu học phí được cấp phát tự động từ bảng `receipt_counters` thông qua cơ chế khóa dòng bi quan `SELECT ... FOR UPDATE`. Không bao giờ xảy ra tình trạng 2 giao dịch thu tiền có cùng một số hóa đơn.
3. **Sổ cái Giao dịch Bất biến (BR-FIN-03)**:
   - Các bản ghi thanh toán (`payments`) là bất biến (Append-only Ledger). Tuyệt đối không xóa giao dịch. Các trường hợp hủy hoặc hoàn tiền bắt buộc phải tạo bản ghi đối ứng `refund_requests` có phê duyệt của Kế toán trưởng hoặc Giám đốc.

---

## 6. QUY TẮC TRAO ĐỔI & BẢO VỆ TRẺ EM (COMMUNICATION & PRIVACY)

1. **Cấm Chat Trực tiếp Học sinh - Học sinh (BR-COM-01)**:
   - Hệ thống không hỗ trợ tính năng chat riêng tư giữa học sinh với nhau để phòng chống bạo lực mạng và quấy rối học đường.
2. **Khóa Tính năng Nhắn tin với Tài khoản Nhỏ tuổi (BR-COM-02)**:
   - Tài khoản học sinh có cờ `students.is_young_account = 1` (học sinh tiểu học) bị khóa toàn bộ quyền gửi tin nhắn văn bản; mọi trao đổi học tập đều phải thông qua tài khoản của phụ huynh.
3. **Bảo vệ Tính Toàn vẹn của Tin nhắn (BR-COM-03)**:
   - Tin nhắn đã gửi chỉ được phép chỉnh sửa nội dung trong vòng **5 phút** kể từ thời điểm gửi (kiểm soát bởi trigger cơ sở dữ liệu `trg_messages_update_time`). Tuyệt đối không có API xóa tin nhắn để bảo toàn nhật ký trao đổi khi cần đối soát.
