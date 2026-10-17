# KẾ HOẠCH BƯỚC 3: TRANG CÔNG KHAI & TUYỂN SINH (M01)

## 1. [VAI: BA] Danh sách User Story & Tiêu chí chấp nhận
- **US-01 (FR-101, S01, S02, S06)**: Trang công khai tải dưới 3s trên 4G, hiển thị đủ khóa học theo cấp, giáo viên tiêu biểu, thông tin công khai theo TT 29/2024. Admin sửa nội dung không cần dev qua cấu hình `public_content` / `kb_documents`.
- **US-02 (FR-102, S04)**: Form đăng ký học thử: Chuẩn hóa SĐT `+84...`, bắt buộc checkbox đồng ý dữ liệu, lưu UTM (source, medium, campaign) + referrer + mã giới thiệu. Nếu SĐT đã tồn tại, gộp vào khách cũ và tạo bản ghi `lead_activities` loại `resubmit`.
- **US-03 (FR-104, S05)**: Test đầu vào online qua link token (hạn 7 ngày). Làm trắc nghiệm có điểm ngay, ra trình độ dự kiến (YLE / CEFR / IELTS band) và gợi ý lớp.
- **US-04 (FR-105, S35, S36)**: Bảng Kanban khách tiềm năng: 6 cột trạng thái. Cảnh báo quá 24 giờ chưa liên hệ (`first_contacted_at` null). Chuyển sang `lost` bắt buộc có `lost_reason`.
- **US-05 (FR-106)**: Chuyển lead thành học viên trong 1 transaction: tạo user HS + PH, sinh mã học sinh, gán vai trò, liên kết `guardianships`, ghi danh `enrollments`, tạo `invoices` ban đầu.
- **US-06 (FR-107, S25)**: Mã giới thiệu độc nhất cho từng phụ huynh, đếm số lượt đăng ký và nhập học theo mã.
- **US-07 (FR-108, S37)**: Báo cáo phễu từ view `v_lead_funnel_month`, quản lý `campaigns` (chi phí, kênh), tính chi phí trên mỗi học sinh mới (cost per enrolled student).

## 2. [VAI: TECH LEAD] Thiết kế Endpoints
- **Public Endpoints (Không cần auth)**:
  - `GET /api/v1/public/courses`: Danh sách khóa học công khai theo cấp.
  - `GET /api/v1/public/teachers`: Danh sách giáo viên công khai.
  - `GET /api/v1/public/info`: Thông tin công khai theo quy định dạy thêm (môn, địa điểm, mức thu).
  - `POST /api/v1/public/leads`: Đăng ký tư vấn / học thử.
  - `GET /api/v1/public/placement-tests/:token`: Lấy đề test đầu vào theo link token.
  - `POST /api/v1/public/placement-tests/:token/submit`: Nộp bài test đầu vào, chấm điểm ngay.
  - `GET /api/v1/public/referrals/:code`: Kiểm tra mã giới thiệu hợp lệ.
- **Consultant / Admin Endpoints (Auth + Role Guard)**:
  - `GET /api/v1/leads`: Danh sách leads, lọc trạng thái, nguồn, ngày tạo, cảnh báo quá 24h.
  - `PATCH /api/v1/leads/:id`: Cập nhật trạng thái (kéo thả Kanban), cập nhật `owner_id`, `lost_reason`.
  - `POST /api/v1/leads/:id/activities`: Ghi lại lịch sử cuộc gọi/tương tác.
  - `POST /api/v1/leads/:id/convert`: Chuyển lead thành học viên trong 1 transaction.
  - `GET /api/v1/campaigns`: Quản lý chiến dịch marketing.
  - `POST /api/v1/campaigns`: Tạo/cập nhật chiến dịch kèm chi phí.
  - `GET /api/v1/reports/funnel`: Báo cáo phễu chuyển đổi từ `v_lead_funnel_month`.
  - `GET /api/v1/guardians/referral-stats`: Thống kê giới thiệu của phụ huynh.

## 3. Màn hình Frontend (apps/web)
- `apps/web/src/app/(public)/courses/page.tsx` (S01, S02)
- `apps/web/src/app/(public)/register-trial/page.tsx` (S04)
- `apps/web/src/app/(public)/placement-test/[token]/page.tsx` (S05)
- `apps/web/src/app/(public)/info/page.tsx` (S06)
- `apps/web/src/app/(guardian)/referrals/page.tsx` (S25)
- `apps/web/src/app/(staff)/consultant/leads/page.tsx` (S35, S36)
- `apps/web/src/app/(staff)/consultant/funnel/page.tsx` (S37)
