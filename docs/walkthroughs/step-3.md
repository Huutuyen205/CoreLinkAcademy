# BƯỚC 3: Trang Công Khai & Tuyển Sinh (M01) — Walkthrough

## 1. Tổng quan vai trò & Nhiệm vụ

### [VAI: Business Analyst (BA)]
- **Cơ sở phân tích**: Mô tả A12, quy định TT 29/2024/TT-BGDĐT, các tiêu chí nghiệm thu TC-001 đến TC-008, TC-015 đến TC-023.
- **User Stories & Acceptance Criteria**:
  - *US-01 (Công khai thông tin)*: Là phụ huynh/học sinh, tôi muốn xem danh mục khóa học, học phí niêm yết, thông tin giáo viên và quy chế theo TT 29/2024 để an tâm đăng ký học.
    - *Given*: Khách truy cập ẩn danh vào `/courses` hoặc `/info`.
    - *When*: Xem biểu phí và chính sách hoàn/bảo lưu.
    - *Then*: Hiển thị đầy đủ thông tin pháp lý, giấy phép hoạt động, mức học phí minh bạch (TC-001, TC-002, TC-003).
  - *US-02 (Đăng ký học thử & UTM Tracking)*: Là khách hàng tiềm năng, tôi muốn đăng ký học thử miễn phí qua form trực tuyến kèm khung giờ rảnh và mã giới thiệu.
    - *Given*: Khách click link quảng cáo chứa `utm_campaign`, `utm_source` hoặc mã giới thiệu phụ huynh `ref`.
    - *When*: Điền form và bấm gửi tại `/register-trial`.
    - *Then*: Hệ thống bắt đúng nguồn UTM, kiểm tra chuẩn hóa SĐT `+84...`. Nếu trùng SĐT thì tự động merge vào hồ sơ cũ, không nhân bản lead (TC-015, TC-016).
  - *US-03 (Trắc nghiệm xếp lớp đầu vào)*: Là học sinh, tôi muốn làm bài kiểm tra nhanh 15 câu có đếm ngược để nhận ngay gợi ý khóa học phù hợp.
    - *Given*: Học sinh mở link `/placement-test/:token`.
    - *When*: Trả lời trắc nghiệm hoặc hết giờ (20 phút).
    - *Then*: Hệ thống tự động chấm điểm ngay và trả về kết quả xếp lớp (TC-005, TC-006).
  - *US-04 (Kanban Tuyển sinh & Cảnh báo 24h)*: Là nhân viên tư vấn, tôi muốn quản lý khách tiềm năng theo 5 cột Kanban, có cảnh báo đỏ đối với khách quá 24h chưa được liên hệ.
    - *Given*: Tư vấn viên mở `/consultant/leads`.
    - *When*: Có lead mới tiếp nhận quá 24h chưa có tương tác đầu tiên.
    - *Then*: Thẻ lead viền đỏ và badge cảnh báo `⚠️ QUÁ 24H CHƯA GỌI` (TC-018).
    - *When*: Chuyển trạng thái sang `lost` (Không nhập học).
    - *Then*: Bắt buộc phải chọn lý do, không chọn không cho lưu (TC-019).
  - *US-05 (Chuyển đổi học viên trong 1-Transaction)*: Là nhân viên tuyển sinh, tôi muốn chuyển lead đã chốt thành học viên chính thức với 1 click.
    - *Given*: Lead ở trạng thái đã học thử (`trial_done`).
    - *When*: Bấm "Chuyển thành học viên", chọn Lớp và Gói học phí.
    - *Then*: Hệ thống tạo tài khoản User HS, Student, User PH, Guardian, Guardianship, Enrollment, Invoice trong đúng 1 transaction DB toàn vẹn (TC-020).
  - *US-06 (Chiến dịch Marketing, Phễu & CAC)*: Là Trưởng cơ sở/Admin, tôi muốn đo lường hiệu quả chuyển đổi và chi phí CAC của từng kênh marketing.
    - *Given*: Truy cập `/consultant/funnel`.
    - *When*: Xem báo cáo phễu tháng từ view `v_lead_funnel_month`.
    - *Then*: Hiển thị biểu đồ 5 bước phễu và bảng chi phí CAC = Chi phí / Số học viên nhập học thực tế (TC-021, TC-022).
  - *US-07 (Chương trình giới thiệu Phụ huynh)*: Là phụ huynh hiện tại, tôi muốn chia sẻ mã giới thiệu và nhận học bổng khi bạn bè nhập học.
    - *Given*: Phụ huynh đăng nhập vào `/referrals`.
    - *When*: Bạn bè nhập học thành công bằng mã giới thiệu.
    - *Then*: Tích lũy 500,000 VND / học viên vào quỹ học bổng của phụ huynh (TC-023).

---

### [VAI: Tech Lead & Software Architect]
- **Kiến trúc Backend**:
  - `PublicModule` (`public.controller.ts`, `public.service.ts`): endpoints công khai không yêu cầu token JWT, tích hợp chuẩn hóa SĐT `+84...`, kiểm tra mã referral, đề test đầu vào & chấm trắc nghiệm.
  - `LeadsModule` (`leads.controller.ts`, `leads.service.ts`): được bảo vệ bởi 2 tầng xác thực (`JwtAuthGuard` + `RolesGuard` + `ScopeGuard`). Logic Kanban, cảnh báo quá hạn 24h, bắt buộc lý do lost, 1-transaction conversion qua `prisma.$transaction`.
  - `CampaignsModule` (`campaigns.controller.ts`, `campaigns.service.ts`): tính toán CAC thực tế và thống kê referral.
- **Xử lý BigInt MySQL**:
  - Khắc phục lỗi `TypeError: Do not know how to serialize a BigInt` khi query raw từ `v_lead_funnel_month` bằng hàm sanitization chuyển đổi BigInt sang Number.

---

### [VAI: Frontend Engineer]
- Đã xây dựng 7 màn hình giao diện hiện đại, glassmorphism, responsive chuẩn 360px:
  1. `apps/web/src/app/(public)/courses/page.tsx` (S01, S02): Danh mục khóa học, bộ lọc cấp độ, thẻ preview giáo viên.
  2. `apps/web/src/app/(public)/register-trial/page.tsx` (S04): Form đăng ký học thử, chọn khung giờ rảnh, tự động bắt UTM.
  3. `apps/web/src/app/(public)/placement-test/[token]/page.tsx` (S05): Bài trắc nghiệm đầu vào, đồng hồ đếm ngược 20 phút, chấm điểm tức thì.
  4. `apps/web/src/app/(public)/info/page.tsx` (S06): Công khai thông tin pháp lý & biểu phí theo TT 29/2024.
  5. `apps/web/src/app/(guardian)/referrals/page.tsx` (S25): Cổng phụ huynh theo dõi mã giới thiệu và quỹ học bổng tích lũy.
  6. `apps/web/src/app/(staff)/consultant/leads/page.tsx` (S35, S36): Kanban board 5 cột, viền đỏ cảnh báo >24h chưa liên hệ, popup bắt buộc lý do khi lost, form chuyển đổi 1-click thành học viên.
  7. `apps/web/src/app/(staff)/consultant/funnel/page.tsx` (S37): Biểu đồ phễu chuyển đổi tuyển sinh & quản lý chiến dịch marketing đo lường CAC.

---

### [VAI: Quality Assurance (Tester)]
- **Kết quả E2E Test Suite (`test/public-leads.e2e-spec.ts`)**:
  - ✅ **TC-001**: Danh mục khóa học công khai & biểu phí niêm yết (PASSED).
  - ✅ **TC-002**: Danh sách giáo viên đạt chuẩn chuyên môn (PASSED).
  - ✅ **TC-003**: Công khai thông tin pháp lý & quy chế theo TT 29/2024 (PASSED).
  - ✅ **TC-004**: Kiểm tra tính hợp lệ của mã giới thiệu phụ huynh (PASSED).
  - ✅ **TC-005 & TC-006**: Đề kiểm tra năng lực đầu vào & chấm điểm xếp lớp tự động (PASSED).
  - ✅ **TC-015**: Đăng ký học thử công khai kèm UTM tracking (PASSED).
  - ✅ **TC-016**: Gộp thông tin lead cũ khi trùng số điện thoại (PASSED).
  - ✅ **TC-017**: Cập nhật trạng thái lead & lưu vết lịch sử tương tác (PASSED).
  - ✅ **TC-018**: Phát hiện và cảnh báo khách tiềm năng quá 24h chưa liên hệ (PASSED).
  - ✅ **TC-019**: Chặn chuyển trạng thái `lost` nếu thiếu lý do hợp lệ (PASSED).
  - ✅ **TC-020**: Chuyển đổi Lead thành học viên trong 1-Transaction an toàn (PASSED).
  - ✅ **TC-021**: Tạo chiến dịch marketing và đo lường CAC thực tế (PASSED).
  - ✅ **TC-022**: Báo cáo phễu chuyển đổi tuyển sinh từ view `v_lead_funnel_month` (PASSED).
  - ✅ **TC-023**: Phụ huynh xem thống kê mã giới thiệu và phần thưởng tích lũy (PASSED).
- **Tổng cộng**: 14/14 tests trong suite Bước 3 đạt 100%. Toàn bộ 30/30 E2E tests toàn hệ thống đều PASS.

---

### [VAI: Security Engineer]
- Kiểm tra bảo mật theo quy định A13:
  - Form công khai không làm lộ dữ liệu cá nhân của các khách hàng khác.
  - Phân quyền nghiêm ngặt 2 tầng: Các API Kanban và chuyển đổi lead chỉ cho phép nhân viên tuyển sinh / Admin (`ADMIN`, `ACADEMIC`, `CONSULTANT`).
  - Mọi thao tác chuyển đổi khách thành học viên đều được ghi nhật ký vào `audit_logs`.
  - Phụ huynh chỉ xem được thống kê mã giới thiệu và lượt giới thiệu của chính mình.
