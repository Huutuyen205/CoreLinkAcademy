# Kế Hoạch Triển Khai Bước 16: Hoàn Thiện GĐ2–GĐ3 & Tổng Kết Dự Án

## 1. Mục Tiêu & Yêu Cầu Kỹ Thuật
Hoàn thiện toàn bộ các tính năng còn lại của Giai đoạn 2 và Giai đoạn 3 theo `docs/CORELINK_MASTER.md`:
1. **Thanh toán Online & Webhook Tự Đối Soát (FR-1103, TC-132)**:
   - Thanh toán QR ngân hàng / Cổng thanh toán.
   - Webhook kiểm tra chữ ký số (HMAC signature verification).
   - Tự động đối soát trong vòng 5 phút (ngay khi nhận webhook thanh toán đủ): hóa đơn chuyển sang `paid`, phát hành biên lai `receipts`, ghi nhận `payments`.
2. **Chiến Dịch Tuyển Sinh Theo Mùa & Mã Ưu Đãi (FR-109)**:
   - Chiến dịch mùa hè, tựu trường có landing page riêng, mã ưu đãi (coupon), thời hạn sử dụng.
   - Báo cáo số lượt dùng và doanh thu ghi nhận từ chiến dịch.
3. **Quy Trình Ngừng Học & Lưu Trữ / Ẩn Danh Hóa (FR-210)**:
   - Chuyển trạng thái học sinh sang `stopped`.
   - Khóa tài khoản (`status: locked`/`disabled`).
   - Xóa theo yêu cầu bảo vệ quyền riêng tư: ẩn danh hóa thông tin cá nhân (chỉ giữ lại số liệu thống kê ẩn danh).
4. **Tìm Kiếm & Ghim Tin Nhắn Trong Hội Thoại (FR-907)**:
   - API & giao diện tìm kiếm tin nhắn theo từ khóa.
   - Ghim / bỏ ghim tin nhắn quan trọng trong hội thoại giữa phụ huynh - giáo viên - nhân viên.
5. **Tổng Hợp Bộ Test Case GĐ2–GĐ3 (`docs/test-cases-gd2-gd3.md`)**:
   - Hệ thống hóa toàn bộ test cases từ GĐ2 (Bước 11–13) đến GĐ3 (Bước 14–16).
   - Kiểm tra và xác nhận 100% tất cả các test suites PASS.
6. **Frontend Screens**:
   - `apps/web/src/app/campaigns/[slug]/page.tsx`: Landing page chiến dịch theo mùa kèm mã ưu đãi.
   - `apps/web/src/app/parent/tuition/pay/page.tsx`: Cổng thanh toán VietQR & mô phỏng webhook đối soát tự động.
   - Cập nhật tin nhắn với tìm kiếm và ghim tin.

## 2. Kế Hoạch Thực Hiện
1. Backend:
   - `apps/api/src/modules/final-integration/`: Payment webhook with signature check (TC-132), Seasonal campaigns with coupons (FR-109), Student drop/anonymization (FR-210), Message pin & search (FR-907).
   - Tích hợp vào `app.module.ts`.
2. Automated E2E Test:
   - `apps/api/test/final-integration.e2e-spec.ts`.
3. Frontend UI:
   - `apps/web/src/app/campaigns/[slug]/page.tsx`
   - `apps/web/src/app/parent/tuition/pay/page.tsx`
4. Documentation & Verification:
   - `docs/test-cases-gd2-gd3.md`
   - `docs/walkthroughs/step-16.md`
   - Update `docs/PROGRESS.md`
   - Chạy kiểm thử toàn bộ test suites của cả dự án!
