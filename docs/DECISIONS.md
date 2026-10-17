# QUYẾT ĐỊNH THIẾT KẾ & ĐẶC TẢ (DECISIONS LOG)

## D-001: 8 Điểm chờ khách xác nhận (B0 mục 0.3)
1. **Bảng tin lớp thay nhóm chat lớp**: Triển khai bảng tin lớp (giáo viên đăng, phụ huynh/học sinh bấm đã đọc, không có bình luận công khai, chuyển câu hỏi sang 1-1).
2. **Báo cáo ngày và tháng**: Báo cáo ngày gửi tự động lúc 20:00 (dựng từ dữ liệu thực tế); báo cáo tháng giáo viên duyệt theo lớp trước ngày 3 hàng tháng.
3. **Phân quyền nhân viên**: 4 vai trò nhân viên (Giáo vụ, Tư vấn, Kế toán, Admin) cấu hình được, một người có thể giữ nhiều vai trò.
4. **Mở buổi và điểm danh**: Offline yêu cầu giáo viên quét QR tại phòng + chụp ảnh lớp + định vị GPS trong bán kính cơ sở (mặc định 150m) để mở buổi và tính lương; Online dùng link/QR riêng cho học sinh tự quét trong 15 phút đầu.
5. **Đánh giá giáo viên**: Phụ huynh chỉ xem điểm tổng hợp (sao trung bình, số lượt) của giáo viên đang dạy con mình; không xem góp ý của từng cá nhân.
6. **Khung năng lực**: Kết hợp CEFR, GDPT 2018, Cambridge YLE và IELTS.
7. **Đội ngũ phát triển ảo**: 1 BA, 1 Tech Lead, 1 Dev Backend, 1 Dev Frontend, 1 Dev AI, 1 DevOps, 1 Tester/QA, 1 Reviewer Bảo mật.
8. **Số cơ sở**: Mặc định 1 cơ sở (CS1), kiến trúc dữ liệu sẵn sàng cho nhiều cơ sở (`branch_id`).
