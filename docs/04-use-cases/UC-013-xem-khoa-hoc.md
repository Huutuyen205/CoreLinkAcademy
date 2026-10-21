# UC-013: Xem danh mục và chi tiết khóa học

- **Status:** Approved · **Version:** 1.0 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-001, FR-002, FR-003 · NFR-004
- **Related features:** FEAT-001..FEAT-003 · **Channel:** Web công khai (SEO)
- **Primary actor:** Khách · **Priority:** P0

## 1. Goal and success outcome
Phụ huynh tìm được khóa phù hợp môn và khối của con, hiểu lộ trình, học phí tham khảo và lớp đang tuyển, rồi đi tới đăng ký học thử.

## 2. Preconditions
Không. Trang render phía server, có metadata SEO.

## 3. Trigger
Mở `/`, `/khoa-hoc`, hoặc liên kết tìm kiếm tới `/khoa-hoc/[slug]`.

## 4. Main success flow
1. Trang chủ: giới thiệu, nút học thử/xem khóa, các môn (số khóa), khóa nổi bật, 3 bước bắt đầu.
2. Bấm một môn → `/khoa-hoc?mon=<slug>`.
3. Chọn khối, bấm "Lọc" → danh sách khóa phù hợp + "n khóa học".
4. Bấm một khóa → chi tiết: mô tả, thông tin, mục tiêu, lộ trình, lớp đang tuyển (còn n chỗ).
5. Bấm "Đăng ký học thử khóa này" → UC-001 A1.

## 5. Alternate flows
- **A1** "Bỏ lọc" → `/khoa-hoc`.
- **A2** Tham số không hợp lệ (`khoi=13`, `mon=Toán`) → bỏ qua tham số đó.
- **A3** Không có lớp OPEN → "Hiện chưa có lớp mở. Hãy đăng ký học thử, học viện sẽ báo khi có lớp phù hợp."

## 6. Exception / failure flows
- **E1** Khóa chưa xuất bản hoặc slug sai → 404 (metadata "Không tìm thấy khóa học").
- **E2** Không có kết quả lọc → EmptyState + nút "Để lại thông tin để được tư vấn".
- **E3** Danh mục trống hoàn toàn → "Học viện đang cập nhật danh mục khóa học.".

## 7. Business rules and validations
Chỉ khóa `isPublished = true`. Học phí `null` → "Liên hệ". Còn chỗ = capacity − (ACTIVE + PAUSED), tối thiểu 0.

## 8. Permissions and data effects
Đọc công khai: subjects, courses, classes (OPEN, chỉ mã/lịch/khai giảng/sĩ số — không lộ giáo viên, học sinh). Không ghi.

## 9. Postconditions
Không thay đổi dữ liệu.

## 10. Non-functional constraints
SSR + `title`/`description`; lọc là form GET, chạy không cần JavaScript; thẻ khóa đọc tốt ở 360px.

## 11. UI/API/data references
SCREEN-001, 002, 003 · Q-001..Q-004 · ENT-004, ENT-005, ENT-007.

## 12. Acceptance criteria / test scenarios
`public.test.ts` (điều kiện lọc), TC-UAT-02 (khóa ẩn 404, khóa nổi bật hiện ở trang chủ).

## 13. Open questions / assumptions / history
- QUESTION-Q01/Q02: logo, tên miền, địa chỉ/hotline thật cho header/footer.
