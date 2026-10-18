# KẾ HOẠCH KIỂM THỬ TOÀN DIỆN & TIÊU CHÍ NGHIỆM THU (TEST PLAN)
**Dự án**: CoreLink Academy  
**Tác giả**: QA Lead & Security Reviewer  

---

## 1. Mục Tiêu & Phạm Vi Kiểm Thử

Đảm bảo hệ thống đạt độ tin cậy tuyệt đối, bảo mật dữ liệu học viên, tính toán tài chính chính xác và không có lỗi suy giảm chất lượng (zero regression) trên mọi môi trường.

---

## 2. Các Tầng Kiểm Thử (Test Levels)

### 2.1. Kiểm Tra Tĩnh & Đóng Gói (Static Analysis & Typecheck)
- **Công cụ**: TypeScript Compiler (`tsc --noEmit`), Next.js Build Linter.
- **Tiêu chí**: Toàn bộ 6 workspace projects (`packages/shared`, `packages/ai`, `apps/api`, `apps/web`, `apps/worker`) phải đạt **0 lỗi** biên dịch.

### 2.2. Kiểm Thử Đơn Vị (Unit Testing)
- **Phạm vi**:
  - Tính toán thuật toán lặp lại ngắt quãng SM-2 (Ease Factor, Interval, Next Review Date).
  - Tạo và giải mã chữ ký bảo mật HMAC-SHA256 cho mã QR điểm danh (xoay vòng 30s) và mã khảo sát NPS.
  - Phân tích cú pháp phản hồi JSON từ các nhà cung cấp AI (Claude / Gemini).
  - Các hàm kiểm tra tính toàn vẹn DTOs với class-validator và Zod.

### 2.3. Kiểm Thử Tích Hợp & E2E (End-to-End API Testing)
- **Công cụ**: Jest & Supertest chạy trên cấu hình `test/jest-e2e.json`.
- **Ma trận 16 bộ test suites đã chuẩn hóa**:
  1. `auth-rbac.e2e-spec.ts`: Đăng nhập, thu hồi refresh token, kiểm tra chặn quyền RBAC.
  2. `public-leads.e2e-spec.ts`: Tiếp nhận lead tuyển sinh, làm bài kiểm tra xếp lớp trực tuyến.
  3. `ai-chatbot.e2e-spec.ts`: RAG search vector, kiểm tra 30 bẫy câu hỏi và chặn câu hỏi ngoài lề.
  4. `academic.e2e-spec.ts`: Mở lớp, xếp phòng, sĩ số, điều phối giáo viên.
  5. `attendance.e2e-spec.ts`: Quét QR động, kiểm tra khoảng cách GPS bán kính 150m, chụp ảnh lớp.
  6. `communication-notif.e2e-spec.ts`: Tin nhắn 1-1, bảng tin lớp học, thông báo đẩy.
  7. `assessment.e2e-spec.ts`: Đảo câu hỏi, làm bài online, phát hiện vi phạm chuyển tab.
  8. `ai-grading.e2e-spec.ts`: Chấm bài tự luận AI, giáo viên duyệt điểm.
  9. `parents-progress.e2e-spec.ts`: Báo cáo ngày (20h), báo cáo tháng AI duyệt trước ngày 3.
  10. `finance-admin.e2e-spec.ts`: Hóa đơn học phí, tính lương giáo viên, khảo sát NPS.
  11. `competency.e2e-spec.ts`: Radar năng lực CEFR, luyện tập thích ứng, AI Tutor 1-1.
  12. `smart-curriculum.e2e-spec.ts`: Giáo trình điện tử, AI gợi ý bài học.
  13. `video-curriculum.e2e-spec.ts`: Pipeline video bài giảng AI, ràng buộc DB `ck_vid_render`.
  14. `ai-assistant.e2e-spec.ts`: Cảnh báo nguy cơ thôi học, trợ lý điều hành CEO.
  15. `final-integration.e2e-spec.ts`: Chiến dịch tuyển sinh, VietQR Webhook, thanh toán tự động.
  16. `health.e2e-spec.ts`: Giám sát sức khỏe hệ thống.

---

## 3. Kiểm Thử Giao Diện Người Dùng & Trải Nghiệm Di Động (UI/UX & PWA)

- **Độ phân giải màn hình kiểm tra bắt buộc**:
  - Mobile nhỏ: `360x640px` (Samsung Galaxy A-series)
  - Mobile phổ biến: `390x844px` (iPhone 12/13/14)
  - Tablet: `768x1024px` (iPad Portrait)
  - Laptop tiêu chuẩn: `1024x768px` & `1440x900px`
- **Tiêu chí UI/UX**:
  - Không xảy ra tràn ngang (horizontal overflow).
  - Các nút bấm có diện tích cảm ứng tối thiểu 44x44px trên điện thoại.
  - Trạng thái tải trang (Skeleton / Loading Spinner), trạng thái rỗng (Empty State), và thông báo lỗi (Error State) hiển thị đẹp mắt, không làm sập trang.

---

## 4. Tiêu Chuẩn Nghiệm Thu & Cổng Chất Lượng (Quality Gates)

Một bước công việc chỉ được nghiệm thu khi đáp ứng đồng thời 5 điều kiện:
1. Mã nguồn tự kiểm tra bằng `pnpm typecheck` không có cảnh báo hay lỗi kiểu dữ liệu.
2. Bản đóng gói `pnpm build` hoàn thành với mã thoát 0 (Exit Code 0).
3. 100% các bài kiểm thử E2E liên quan chạy thành công.
4. Cơ sở dữ liệu tuân thủ nghiêm ngặt nguyên tắc Database-First (Không can thiệp vào `db/000_schema.sql`).
5. Có biên bản nghiệm thu hoặc walkthrough cập nhật trong thư mục `docs/`.
