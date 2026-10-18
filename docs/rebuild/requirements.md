# ĐẶC TẢ YÊU CẦU HỆ THỐNG — CORELINK ACADEMY (REQUIREMENTS)

**Tài liệu**: Yêu cầu nghiệp vụ & Tiêu chí nghiệm thu  
**Mục tiêu**: Xây dựng lại toàn diện hệ thống quản lý và đào tạo tiếng Anh chuẩn quốc tế  
**Phiên bản**: 2.0  

---

## 1. MỤC TIÊU DỰ ÁN & GIÁ TRỊ CỐT LÕI

CoreLink Academy là nền tảng quản trị trung tâm tiếng Anh thế hệ mới, tích hợp sâu sắc giữa công tác quản lý đào tạo, cổng tương tác phụ huynh - học viên và hỗ trợ học thuật thông minh từ AI:

1. **Tuyển sinh & Tăng trưởng bền vững**: Xóa bỏ tình trạng phân tán thông tin qua Zalo; số hóa toàn bộ phễu tuyển sinh (Lead CRM, đặt lịch kiểm tra đầu vào trực tuyến, phân tích nguồn tiếp thị và chi phí trên mỗi học viên mới).
2. **Minh bạch tiến độ đào tạo**: Cổng phụ huynh chuyên biệt hiển thị tức thời chuyên cần, điểm số, lộ trình chuẩn quốc tế (Cambridge CEFR / YLE / IELTS) và bản tóm tắt học tập cá nhân hóa lúc 20:00 hằng ngày.
3. **Giảm tải công việc hành chính cho giáo viên**: Điểm danh 1 chạm qua mã QR định vị GPS, tự động tính công dạy học, gợi ý soạn giáo án và đề thi bám sát khung chương trình.
4. **Học thuật cá nhân hóa có đạo đức**: Áp dụng AI với nguyên tắc bất biến: **"AI soạn, người duyệt"** (Human-in-the-loop); dữ liệu học viên được ẩn danh tuyệt đối (Anonymized PII) trước khi gửi tới mô hình AI.

---

## 2. CÁC NHÓM NGƯỜI DÙNG & VAI TRÒ HỆ THỐNG (STAKEHOLDERS)

Hệ thống hỗ trợ mô hình phân quyền đa vai trò (Multi-Role RBAC):
1. **Super Admin / Ban Giám đốc**: Toàn quyền cấu hình chi nhánh, xem báo cáo tài chính, quản lý ngân sách AI, nhật ký kiểm toán (Audit Logs).
2. **Quản trị viên / Giáo vụ (Academic Staff)**: Quản lý chương trình học, xếp lớp, duyệt đổi lịch, phân công giáo viên, xử lý đơn xin nghỉ học và bảo lưu.
3. **Nhân viên Tuyển sinh / Tư vấn (Admissions / CRM)**: Tiếp nhận lead từ website, hẹn lịch test đầu vào, ghi chú chăm sóc khách hàng, tạo đơn ghi danh.
4. **Kế toán / Thu ngân (Accountant)**: Thiết lập gói học phí, lập hóa đơn, xác nhận thanh toán nhiều đợt, cấp biên nhận chống trùng lặp, tính lương buổi dạy.
5. **Giáo viên (Teacher)**: Mở buổi học qua QR và ảnh lớp, điểm danh, chấm bài thi tự luận (có hỗ trợ AI), gửi nhận xét buổi học, giao bài tập về nhà.
6. **Học viên (Student)**: Xem thời khóa biểu, làm bài tập trực tuyến, luyện phát âm AI, luyện từ vựng ngắt quãng, theo dõi biểu đồ radar 4 kỹ năng.
7. **Phụ huynh / Người giám hộ (Guardian)**: Nhận thông báo điểm danh tức thời, xem bảng điểm, thanh toán học phí qua VietQR, gửi đơn xin nghỉ, phản hồi khảo sát NPS.
8. **Khách vãng lai (Public Visitor)**: Tìm hiểu chương trình học, đội ngũ giáo viên, đăng ký học thử, làm bài kiểm tra trình độ miễn phí, trò chuyện với Chatbot tư vấn 24/7.

---

## 3. DANH MỤC CÁC PHÂN HỆ NGHIỆP VỤ (CORE MODULES)

### Module 01: Website Công khai & Tuyển sinh (Public & Admissions)
- **FR-101**: Landing page chuẩn quốc tế, giới thiệu lộ trình đào tạo, phương pháp tương tác, cơ sở vật chất, chứng nhận học thuật.
- **FR-102**: Biểu mẫu đăng ký tư vấn và học thử (tự động chuẩn hóa SĐT `+84`, kiểm tra trùng lặp và ghi nhận nguồn tiếp thị UTM).
- **FR-103**: Chatbot RAG hỗ trợ tuyển sinh 24/7, trích xuất thông tin chỉ từ kho tài liệu đã duyệt, từ chối phát ngôn cam kết điểm và chủ đề ngoài phạm vi.
- **FR-104**: Kiểm tra xếp lớp đầu vào trực tuyến (Placement Test) qua link token bảo mật có hạn dùng 7 ngày.
- **FR-105**: Kanban CRM quản lý trạng thái khách tiềm năng, nhắc việc tư vấn viên trong vòng 24 giờ.
- **FR-106**: Chuyển đổi Lead thành Học sinh trong một giao dịch cơ sở dữ liệu duy nhất (tạo tài khoản học sinh, phụ huynh, ghi danh và hóa đơn ban đầu).

### Module 02: Xác thực & Hồ sơ Người dùng (Authentication & RBAC)
- **FR-201**: Đăng nhập đa phương thức (Email, Số điện thoại, Mã học sinh) kèm mã hóa một chiều Argon2id.
- **FR-202**: Quản lý phiên làm việc an toàn với Refresh Token xoay vòng (Rotated Refresh Token) lưu dưới dạng HttpOnly Cookie.
- **FR-203**: Cơ chế bảo vệ Brute Force: Khóa tài khoản tạm thời 15 phút sau 5 lần đăng nhập thất bại liên tiếp.
- **FR-204**: Xác thực 2 yếu tố (2FA TOTP) bắt buộc đối với vai trò Quản trị viên.
- **FR-205**: Thu thập và quản lý sự đồng ý xử lý dữ liệu trẻ em theo Nghị định 13/2023/NĐ-CP; cung cấp quy trình rút lại sự đồng ý minh bạch.

### Module 03: Quản lý Đào tạo & Thời khóa biểu (Academic & Scheduling)
- **FR-301**: Quản lý cấu trúc đào tạo: Cấp học → Chương trình đào tạo → Khóa học → Lớp học.
- **FR-302**: Thuật toán sinh lịch học định kỳ tự động, tự động loại trừ các ngày nghỉ lễ toàn quốc.
- **FR-303**: Cơ chế phát hiện xung đột lịch 3 chiều: Kiểm tra trùng phòng học, trùng giáo viên đứng lớp và trùng giờ học của học viên; trả về mã lỗi 409 chi tiết nếu có va chạm.
- **FR-304**: Quy trình duyệt đề xuất đổi lịch học hoặc bố trí giáo viên dạy thay có kiểm tra trình độ chuyên môn phù hợp.

### Module 04: Điểm danh & Chuyên cần (Attendance & Verification)
- **FR-401**: Sinh mã QR động mã hóa HMAC-SHA256 đổi mới mỗi 30 giây phục vụ học sinh quét mã vào lớp.
- **FR-402**: Giáo viên mở lớp học trực tiếp bắt buộc chụp ảnh lớp học và gửi tọa độ định vị GPS trong bán kính cho phép (150m) so với cơ sở.
- **FR-403**: Tự động gửi thông báo cho phụ huynh sau 15 phút nếu học sinh vắng mặt không phép.
- **FR-404**: Cảnh báo giáo vụ khi học sinh có dấu hiệu vắng mặt 2 buổi liên tiếp để kịp thời chăm sóc.

### Module 05: Ngân hàng Đề thi & Khảo thí (Assessment & Examinations)
- **FR-501**: Ngân hàng câu hỏi phân tầng theo độ khó (Nhận biết, Thông hiểu, Vận dụng, Nâng cao) và kỹ năng (Nghe, Nói, Đọc, Viết, Ngữ pháp, Từ vựng).
- **FR-502**: Tạo bài thi trực tuyến xáo trộn câu hỏi và đáp án ngẫu nhiên, kiểm soát thời gian làm bài chính xác theo giây.
- **FR-503**: Cơ chế chấm điểm trắc nghiệm tự động tức thời (< 2 giây); cơ chế nộp bài tự động khi hết giờ.
- **FR-504**: Chấm bài tự luận (Writing) tích hợp AI phân tích ngữ pháp, vốn từ vựng và tính mạch lạc; giáo viên xem xét và chốt điểm số cuối cùng.

### Module 06: Học phí & Bảng lương Giáo viên (Finance & Payroll)
- **FR-601**: Thiết lập chính sách học phí linh hoạt: Trọn khóa, theo tháng, gói học bổng, chính sách giảm trừ anh chị em.
- **FR-602**: Lập hóa đơn và theo dõi dòng tiền thanh toán (thanh toán một phần hoặc toàn phần); sinh mã VietQR chuyển khoản ngân hàng.
- **FR-603**: Cấp biên nhận điện tử với số chứng từ tuần tự chống trùng lặp qua cơ chế khóa dòng bi quan (Pessimistic Row Lock).
- **FR-604**: Tính lương giáo viên tự động chỉ dựa trên các buổi học đã được xác thực chuyên cần thành công; hỗ trợ giáo viên gửi phản hồi khiếu nại trước khi chốt kỳ lương.

### Module 07: Cổng Phụ huynh & Nhật ký Học tập (Parent Portal & Communication)
- **FR-701**: Giao diện phụ huynh tối ưu hóa trên điện thoại thông minh, chuyển đổi nhanh giữa các con.
- **FR-702**: Bản tin lớp học một chiều: Chỉ giáo viên được phép đăng bài thông báo; phụ huynh xác nhận "Đã đọc".
- **FR-703**: Tóm tắt học tập cá nhân hóa phát sinh vào 20:00 hằng ngày dựa trên dữ kiện buổi học thực tế.
- **FR-704**: Báo cáo học tập tháng có biểu đồ tiến bộ và đánh giá chuyên môn của giáo viên chủ nhiệm.

### Module 08: Học tập Trực tuyến & Luyện tập AI (Interactive E-Learning)
- **FR-801**: Kho tài liệu học tập điện tử phân loại theo lớp và bài học; kiểm soát quyền tải tài liệu.
- **FR-802**: AI Speaking Coach: Ghi âm giọng nói trực tiếp trên trình duyệt, chuyển đổi âm thanh và đánh giá phát âm theo ngữ điệu chuẩn.
- **FR-803**: Flashcard Từ vựng Spaced Repetition (Lặp lại ngắt quãng) theo giải thuật khoa học giúp tối ưu hóa khả năng ghi nhớ dài hạn.

---

## 4. TIÊU CHÍ CHẤP NHẬN PHI CHỨC NĂNG (NFR)

1. **Hiệu năng & Khả năng tải (Performance)**:
   - Thời gian phản hồi API trung bình < 250ms cho các truy vấn dữ liệu thông thường.
   - Trang landing page công khai tải nhanh dưới 2.5 giây trên kết nối 4G di động.
   - Hỗ trợ tối thiểu 150 học sinh làm bài thi trực tuyến đồng thời không bị nghẽn hệ thống.
2. **Khả năng tương thích & Tiếp cận (Accessibility & Responsive)**:
   - Giao diện thân thiện và hoạt động trơn tru từ màn hình nhỏ nhất 360px (mobile) đến 4K desktop.
   - Đáp ứng chuẩn tương phản màu sắc và khả năng điều hướng bàn phím theo WCAG 2.2 AA.
3. **Bảo mật & Quyền riêng tư (Security & Privacy)**:
   - Tuân thủ khuyến nghị OWASP Top 10 (Chống SQL Injection, XSS, CSRF, IDOR).
   - Bảo mật dữ liệu người dùng dưới 16 tuổi theo quy định pháp luật Việt Nam.
   - Tuyệt đối không lưu trữ khóa bí mật, mật khẩu hay dữ liệu định danh trong mã nguồn.
