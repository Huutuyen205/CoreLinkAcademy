# BẢNG TEST CASE GIAI ĐOẠN 2 & GIAI ĐOẠN 3 (TỪ TC-155)

Tài liệu tổng hợp các Test Cases mở rộng thuộc Giai đoạn 2 và Giai đoạn 3 (BƯỚC 11 – 16) theo yêu cầu `docs/CORELINK_MASTER.md` (mục BƯỚC 16).

---

## 1. Danh Mục Test Cases Mở Rộng (TC-155 .. TC-165)

| Mã TC | Phân hệ | Yêu cầu FR | Tính năng AI / Nghiệp vụ | Vai trò thực hiện | Mô tả kịch bản kiểm thử | Kết quả mong đợi | Loại test | Độ ưu tiên | Giai đoạn | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|
| **TC-155** | M06 / M07 | FR-613, FR-701..704 | Đánh giá năng lực 6 kỹ năng & Radar Chart (AI-05, AI-06, AI-07) | Học sinh | Sinh bài tập bù lỗ hổng kiến thức, đo lường điểm năng lực theo chuẩn CEFR, cập nhật Radar chart | Điểm tăng tương ứng, bài tập cá nhân hóa được giao chính xác | E2E / AI | P1 | GĐ2 | **PASS** |
| **TC-156** | M06 / M07 | FR-614, FR-702 | Giới hạn 30 câu hỏi / 24h & Khóa học quá sức (AI-06, AI-07) | Học sinh | 1. Đặt câu hỏi thứ 31 trong 24h<br>2. Chọn bài vượt > 1 cấp CEFR | 1. Báo chạm trần, hẹn ngày mai<br>2. Cảnh báo vượt cấp độ | Logic / Nghiệp vụ | P1 | GĐ2 | **PASS** |
| **TC-157** | M06 | FR-607, FR-608 | AI chấm bài Viết luận & Nói (AI-08, AI-09) | Giáo viên | 1. Gửi ảnh bài viết mờ<br>2. Gửi bài viết rõ nét<br>3. Gửi audio bài nói | 1. Báo ảnh mờ, không gán điểm<br>2. Gợi ý điểm & nhận xét rubric<br>3. Chấm phát âm & độ trôi chảy | E2E / AI | P1 | GĐ2 | **PASS** |
| **TC-158** | M08 | FR-803, FR-804 | Báo cáo học tập tháng AI (AI-03) | Giáo viên / Phụ huynh | 1. Giáo viên chưa duyệt<br>2. Giáo viên duyệt & gửi phụ huynh | 1. Phụ huynh chưa thấy báo cáo<br>2. Phụ huynh nhận báo cáo có radar | Bảo mật / RBAC | P1 | GĐ2 | **PASS** |
| **TC-159** | M05 | FR-502 | Bóc tách giáo trình PDF 40 trang thành cây mục tiêu (AI-01) | Giáo viên | Nạp file giáo trình PDF 40 trang và gọi AI bóc tách cấu trúc | Sinh cây mục tiêu đầy đủ, gắn số trang nguồn chính xác | E2E / AI | P1 | GĐ2 | **PASS** |
| **TC-160** | M05 | FR-504 | Sinh học liệu & Kiểm soát bản quyền bên thứ ba | Giáo viên | 1. Tài liệu nguồn bên thứ 3<br>2. Tài liệu bản quyền trung tâm | 1. Khóa tính năng AI tạo học liệu<br>2. Sinh phiếu bài tập & slide nháp | Bản quyền / Logic | P1 | GĐ2 | **PASS** |
| **TC-161** | M05 | FR-503 | Đối soát giáo trình với chuẩn CEFR & GDPT 2018 (AI-02) | Trưởng bộ môn | So sánh cây giáo trình với khung chuẩn, duyệt/từ chối đề xuất bổ sung | Đề xuất được duyệt có nhãn is_ai: true và nâng version v2 | E2E / AI | P2 | GĐ3 | **PASS** |
| **TC-162** | M05 | FR-506 | Dựng video bài giảng AI & Ràng buộc duyệt kịch bản (AI-04) | Trưởng bộ môn / GV | 1. Dựng video khi kịch bản chưa duyệt<br>2. Duyệt kịch bản và tiến hành render | 1. Bị từ chối (400 Bad Request / ck_vid_render)<br>2. Render thành công ≤ 10 phút | E2E / DB Check | P2 | GĐ3 | **PASS** |
| **TC-163** | M12 / M13 | FR-1204, FR-1302, FR-1303 | Trợ lý số liệu chỉ đọc cho Admin & Chỉ số GV (AI-14) | Admin / Phụ huynh | 1. Admin hỏi lệnh xóa dữ liệu<br>2. Phụ huynh xem chỉ số GV khác | 1. Từ chối thao tác ghi, chỉ trả số liệu chỉ đọc (TC-137)<br>2. Trả về 403 Forbidden (TC-140) | Bảo mật / AI | P1 | GĐ3 | **PASS** |
| **TC-164** | M07 / M03 | FR-705, FR-307 | Cảnh báo sớm nguy cơ tụt điểm & Gợi ý xếp lớp (AI-10, AI-11) | Giáo vụ / Admin | Phát hiện học sinh tụt điểm 3 bài liên tiếp / vắng 2 buổi; gợi ý xếp lớp tối ưu | Cảnh báo kèm lý do cụ thể; Admin duyệt gợi ý xếp lớp thành công | E2E / AI | P2 | GĐ3 | **PASS** |
| **TC-165** | M11 / M01 / M02 / M09 | FR-1103, FR-109, FR-210, FR-907 | Thanh toán online tự đối soát, chiến dịch hè, ngừng học, ghim tin | Phụ huynh / Admin | 1. Quét QR thanh toán đủ tiền<br>2. Áp dụng mã ưu đãi hè<br>3. Ngừng học & ẩn danh hóa<br>4. Ghim tin nhắn hội thoại | 1. Tự đối soát trong 5 phút, chuyển paid và có biên nhận (TC-132)<br>2. Giảm giá 15% trọn khóa<br>3. Khóa tài khoản & ẩn danh hóa GDPR<br>4. Ghim tin nhắn thành công | E2E / Tích hợp | P1 | GĐ3 | **PASS** |

---

## 2. Báo Cáo Chạy Kiểm Thử Tự Động Toàn Hệ Thống

| Nhóm bài kiểm thử | File kiểm thử E2E | Số Test Cases | Kết Quả |
|---|---|---|---|
| **Step 11: Competency & Adaptive** | `apps/api/test/competency.e2e-spec.ts` | 13/13 | **100% PASS** |
| **Step 12: AI Grading & Reports** | `apps/api/test/ai-grading.e2e-spec.ts` | 10/10 | **100% PASS** |
| **Step 13: Smart Curriculum** | `apps/api/test/smart-curriculum.e2e-spec.ts` | 7/7 | **100% PASS** |
| **Step 14: Video Curriculum Pipeline** | `apps/api/test/video-curriculum.e2e-spec.ts` | 5/5 | **100% PASS** |
| **Step 15: AI Executive Assistant** | `apps/api/test/ai-assistant.e2e-spec.ts` | 8/8 | **100% PASS** |
| **Step 16: Final Integration & Payments** | `apps/api/test/final-integration.e2e-spec.ts` | 7/7 | **100% PASS** |
| **Tổng cộng GĐ2 & GĐ3** | **6 suites** | **50/50 test scenarios** | **100% PASS** |
