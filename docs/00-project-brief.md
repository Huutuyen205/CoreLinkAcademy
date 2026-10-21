# 00 — Project Brief: CoreLink Academy (Rebuild v3)

| Mục | Giá trị |
|---|---|
| Phiên bản / trạng thái | 3.1.0 / **Baselined** (phạm vi đã chốt, tài liệu viết lại chi tiết phiên 3) |
| Cập nhật | 2026-10-21 |
| Product owner (người phê duyệt) | Chủ dự án |
| Người soạn | Trợ lý AI (PM/BA) |
| Nhánh | `rebuild/v3` — bản cũ v1/v2 giữ nguyên trên `main` |

## 1. Tóm tắt

- **Ý tưởng:** website + hệ thống quản lý cho một học viện đào tạo đa môn phổ thông.
- **Vấn đề:** phụ huynh khó tìm khóa phù hợp và đăng ký học thử; giáo vụ quản lý khách tiềm năng, lớp, lịch bằng sổ/bảng tính nên bỏ sót lead, trùng lịch; giáo viên điểm danh/chấm bài thủ công; phụ huynh phải hỏi giáo viên mới biết con đi học và điểm số.
- **Giá trị:** một hệ thống duy nhất từ lúc phụ huynh để lại số điện thoại → thành học viên → học, điểm danh, làm bài → phụ huynh theo dõi.
- **Phạm vi sản phẩm:** Web công khai (SEO) + cổng nội bộ theo 5 vai trò, một cơ sở, tiếng Việt.
- **Bối cảnh:** v1/v2 ôm 98 FR, 14 tính năng AI, 84 bảng, tài liệu và code không khớp. v3 làm lại với 35 FR có thể kiểm chứng (DECISION-D01, D05).

## 2. Mục tiêu và đo lường

| ID | Mục tiêu | KPI | Baseline | Target | Cách đo | Thời điểm |
|---|---|---|---|---|---|---|
| GOAL-001 | Phụ huynh đăng ký học thử nhanh trên điện thoại | KPI-001: thời gian hoàn thành form | Chưa có | ≤ 2 phút ở 360px | Thử nghiệm thủ công có bấm giờ (TC-UAT-01) | Trước production |
| | | KPI-002: tỷ lệ submit/visit `/dang-ky-hoc-thu` | Chưa có | ≥ 5% | Analytics — **TBD** (chưa chọn công cụ, QUESTION-Q09) | Sau 1 tháng chạy thật |
| GOAL-002 | Không lead nào bị bỏ quên | KPI-003: % lead NEW được đổi trạng thái trong 24h | Chưa có | 100% | Số "Lead quá 24 giờ" trên `/quan-ly` = 0 cuối mỗi ngày | Hằng ngày |
| GOAL-003 | Giáo viên điểm danh nhanh | KPI-004: thời gian điểm danh 1 buổi 16 HS | Chưa có | ≤ 30 giây (mặc định "có mặt") | Bấm giờ thủ công (TC-UAT-07) | Trước production |
| GOAL-004 | Phụ huynh tự theo dõi con | KPI-005: phụ huynh xem được lịch, chuyên cần, điểm đã công bố | — | 100% con đã liên kết | UAT cổng phụ huynh (TC-UAT-11) | Trước production |
| GOAL-005 | Chất lượng có bằng chứng | KPI-006: `typecheck/lint/test/build` xanh | Xanh (phiên 2) | Xanh mỗi pha | Output lệnh trong PROGRESS | Mỗi pha |

## 3. Người dùng và actors

| ID | Actor / role | Nhu cầu chính | Quyền / phạm vi (chi tiết: docs/03) |
|---|---|---|---|
| ACT-000 | Khách (phụ huynh tiềm năng, chưa đăng nhập) | Tìm khóa theo môn/khối, xem lộ trình, học phí tham khảo, đăng ký học thử | Đọc môn/khóa đã xuất bản; tạo lead qua form |
| ACT-001 / ROLE-001 | Quản trị viên (`ADMIN`) | Cấu hình danh mục, người dùng, vai trò, xem audit | Toàn hệ thống |
| ACT-002 / ROLE-002 | Giáo vụ / Tư vấn (`STAFF`) | Xử lý lead, chuyển học viên, mở lớp, ghi danh, sửa điểm danh ngoài khung | Toàn bộ dữ liệu tuyển sinh + đào tạo; không quản lý vai trò, không xem audit |
| ACT-003 / ROLE-003 | Giáo viên (`TEACHER`) | Xem lịch dạy, điểm danh, giao bài, chấm, công bố | Lớp mình dạy (và buổi được phân công dạy thay) |
| ACT-004 / ROLE-004 | Học sinh (`STUDENT`) | Xem lịch, làm bài, xem điểm đã công bố, chuyên cần | Chính mình |
| ACT-005 / ROLE-005 | Phụ huynh (`PARENT`) | Theo dõi lịch, chuyên cần, điểm của con | Con đã liên kết, chỉ đọc |

Mỗi tài khoản đúng một vai trò (DECISION-D04).

## 4. Phạm vi

### In scope — Pha 1 (35 FR, docs/01)
1. **Công khai và tuyển sinh** (FR-001..FR-009): trang chủ, danh mục lọc môn/khối, chi tiết khóa, form học thử chống spam, danh sách lead + nhập tay, trạng thái/ghi chú, chuyển lead thành học viên trong một giao dịch.
2. **Tài khoản và phân quyền** (FR-010..FR-014): đăng nhập email/SĐT, khóa tạm, đổi mật khẩu bắt buộc, quản trị người dùng, liên kết phụ huynh–học sinh.
3. **Đào tạo và điểm danh** (FR-015..FR-026): môn, khóa, phòng, mở lớp sinh buổi, chống trùng lịch, ghi danh, hủy/dời buổi, lịch tuần, điểm danh trong/ngoài khung, chuyên cần, cảnh báo vắng.
4. **Bài tập và chấm điểm** (FR-027..FR-033): 3 dạng câu, làm/nộp một lần, tự chấm, chấm tự luận, công bố, bảng điểm.
5. **Cổng và audit** (FR-034, FR-035).
6. **Bổ sung v3.2 — DECISION-D26** (FR-036..FR-052, nguồn: danh sách chức năng 4 actor của PO): hồ sơ GV/HS/PH, cấp học, sửa lớp/dạy thay/học bù/chuyển lớp/lịch tổng, nộp bài bằng tệp/ảnh, giáo trình–tài liệu–giáo án, đề xuất đổi lịch, đơn xin nghỉ, thông báo, đánh giá định kỳ, nhắn tin (không realtime), tài khoản cá nhân, báo cáo + xuất CSV.

### Out of scope Pha 1
Học phí/hóa đơn/thanh toán, lương giáo viên, chatbot/AI, chat realtime, Web Push/email/SMS, điểm danh QR/GPS, nhiều cơ sở, app di động, quên mật khẩu qua email, 2FA, đa ngôn ngữ.

### Later / backlog
Danh sách Pha 2 nằm ở [05 §5](05-functional-decomposition.md#5-pha-2--ý-tưởng-đã-ghi-nhận-chưa-làm). Ý tưởng mới chỉ ghi vào đó, không code (AGENTS.md).

## 5. Chức năng trọng yếu

| Priority | Feature | Actor | Outcome | Acceptance (rút gọn) | FR |
|---|---|---|---|---|---|
| P0 | Form học thử | Khách | Lead NEW trong DB | SĐT chuẩn hóa, trùng lead mở → thêm hoạt động | FR-004, 005 |
| P0 | Xử lý + chuyển lead | Staff | Học sinh + phụ huynh + liên kết + ghi danh, một transaction | Lỗi bất kỳ bước → không lưu gì | FR-006..009 |
| P0 | Đăng nhập theo vai trò | Mọi người | Vào đúng cổng | Khóa 15 phút sau 5 lần sai | FR-010..012 |
| P0 | Mở lớp + chống trùng | Staff | Lớp + buổi theo lịch VN | Trùng GV/phòng → liệt kê xung đột | FR-017, 018 |
| P0 | Điểm danh | GV | Bản ghi chuyên cần | Trong khung BR-030, mặc định có mặt | FR-023, 024 |
| P0 | Làm bài → chấm → công bố | HS, GV | Điểm hiển thị cho HS/PH | Không lộ đáp án trước công bố | FR-027..033 |
| P0 | Cổng phụ huynh | PH | Lịch, chuyên cần, điểm của con | Con không liên kết → 404 | FR-022, 025, 033, 034 |
| P1 | Quản trị danh mục, phòng, người dùng | Admin | Dữ liệu nền | Slug/tên duy nhất; Admin không tự khóa | FR-013..016 |
| P1 | Audit | Admin | Truy vết thao tác nhạy cảm | Không ai xóa được | FR-035 |

## 6. Công nghệ và ràng buộc

- **Frontend + Backend:** Next.js 15 (App Router, Server Components đọc, Server Actions ghi), React 19, TypeScript strict, Tailwind CSS 4 — [ADR-001](09-architecture/adr/ADR-001-stack-selection.md).
- **Database:** MySQL 8 local (`localhost:3306`, database `corelink`), Prisma 6 + Prisma Migrate.
- **Auth:** phiên trong DB + cookie httpOnly (ADR-002), Argon2id.
- **Hosting/CI/CD:** **TBD** (QUESTION-Q04). Dev chạy trên Windows + PowerShell.
- **Tích hợp bên thứ ba:** không có ở Pha 1.
- **Budget/deadline:** không có ràng buộc chi phí; không có deadline cứng (ASSUMPTION-A05).
- **Giữ lại:** backup v2 `backup/corelink-v2-20261021.sql`; nhánh `main`.
- **Quy tắc làm việc:** trợ lý không `git push`, không `git commit` (người dùng tự làm); lệnh xóa DB do người dùng chạy.

## 7. Chất lượng / rủi ro

- **Bảo mật/riêng tư:** dữ liệu học sinh vị thành niên; quyền kiểm tra phía server ở mọi action/trang; sai phạm vi → 404 (docs/12).
- **Hiệu năng:** một cơ sở, ước tính < 500 học sinh, < 50 lớp đồng thời (ASSUMPTION-A06) → không cần cache/queue.
- **Khả năng tiếp cận:** WCAG 2.1 AA mục tiêu, mobile-first 360px (NFR-002, NFR-003).
- **Sao lưu:** `mysqldump` trước thao tác phá hủy; lịch backup production TBD.
- **Rủi ro chính:** code chưa chạy trên DB thật (RISK-007), phạm vi phình (RISK-002). Sổ rủi ro: docs/15.

## 8. Facts, assumptions, decisions, open questions

| ID | Loại | Nội dung | Tác động | Owner | Xác minh / quyết định |
|---|---|---|---|---|---|
| FACT-01 | Đã xác nhận | 6 môn: Toán, Văn, Anh, Lý, Hóa, Tin | Danh mục seed | Chủ dự án | DECISION-D02 |
| FACT-02 | Đã xác nhận | MVP = công khai/tuyển sinh + đào tạo/điểm danh + bài tập/chấm | Phạm vi | Chủ dự án | DECISION-D05 |
| FACT-03 | Đã xác nhận | Giữ 35 FR, viết tài liệu chi tiết rồi bổ sung code, không commit | Phiên 3 | Chủ dự án | 2026-10-21 |
| ASSUMPTION-A01 | Giả định | Một cơ sở | Không có `campusId` | Chủ dự án | Hỏi trước Pha 2 |
| ASSUMPTION-A02 | Giả định | Học sinh lớp 1–12 | `gradeLevel` 1..12 | Chủ dự án | Như trên |
| ASSUMPTION-A05 | Giả định | Không deadline cứng, không ngân sách hosting | Thứ tự pha | Chủ dự án | Hỏi khi chọn hosting |
| ASSUMPTION-A06 | Giả định | Quy mô < 500 HS | Không tối ưu sớm | Chủ dự án | Theo dõi khi chạy thật |
| QUESTION-Q04 | Câu hỏi | Hosting production? | Triển khai | Chủ dự án | Trước production |

Danh sách đầy đủ: [17-open-questions-and-decisions.md](17-open-questions-and-decisions.md).

## 9. Liên kết

| Phía | Tài liệu |
|---|---|
| Product / BA | [01 Yêu cầu](01-requirements.md) · [02 SRS](02-srs.md) · [03 Phân quyền](03-actors-roles-permissions.md) · [04 Use case](04-use-cases.md) · [05 Phân rã](05-functional-decomposition.md) · [06 Quy tắc](06-business-rules-and-states.md) · [07 Luồng](07-user-flows-and-logic-diagrams.md) |
| Design | [08 UI/UX](08-ui-ux-and-design-system.md) |
| Kiến trúc / FE / BE | [09 System context](09-architecture/system-context.md) · [09 Component](09-architecture/component-architecture.md) · [ADR](09-architecture/adr/) · [20 FE guide](20-frontend-guide.md) · [21 BE guide](21-backend-guide.md) |
| Data / API | [10 DB](10-database-and-erd.md) · [11 API](11-api-specification.md) |
| Security / QA / Ops | [12 Bảo mật](12-security-and-privacy.md) · [13 Test](13-test-strategy-and-test-cases.md) · [14 Vận hành](14-deployment-and-operations.md) · [18 Release](18-release-checklist.md) |
| Quản lý | [15 Kế hoạch & rủi ro](15-project-plan-and-risk-register.md) · [16 Truy vết](16-traceability-matrix.md) · [17 Quyết định](17-open-questions-and-decisions.md) · [19 Vai trò & sổ tài liệu](19-team-roles-and-document-register.md) |
| Theo cổng người dùng | [P-01 Khách](portals/P-01-khach.md) · [P-02 Quản lý](portals/P-02-quan-ly.md) · [P-03 Giáo viên](portals/P-03-giao-vien.md) · [P-04 Học sinh](portals/P-04-hoc-sinh.md) · [P-05 Phụ huynh](portals/P-05-phu-huynh.md) |
