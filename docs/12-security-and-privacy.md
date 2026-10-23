# 12 — Bảo mật, quyền riêng tư và Threat Model

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — threat register có khả năng/tác động/kiểm chứng/trạng thái, control checklist, privacy review, residual risks |
| Owner | Trợ lý (Security/AppSec + Privacy liaison) · Risk owner / phê duyệt: chủ dự án |
| Phạm vi đánh giá | Ứng dụng Next.js + MySQL trên máy dev; production chưa có (hosting TBD) |
| Không đánh giá | Hạ tầng hosting, mạng, hệ điều hành, MySQL server hardening, pentest thực tế, tuân thủ pháp lý (chưa có chuyên gia pháp lý) |

Không có hệ thống nào an toàn tuyệt đối. Tài liệu nêu biện pháp đã chọn, cách kiểm chứng và rủi ro còn lại.

## 1. Assets and actors

| Asset | Độ nhạy | Actor được phép | Tác động nếu lộ/bị sửa |
|---|---|---|---|
| Thông tin liên hệ phụ huynh (leads, users) | PII — Cao | Staff, Admin | Spam/lừa đảo phụ huynh, mất uy tín |
| Dữ liệu học sinh vị thành niên (tên, khối, điểm, chuyên cần, nhận xét) | MINOR — Cao | HS (self), PH (con), GV (lớp mình), Staff, Admin | Ảnh hưởng trẻ em, pháp lý |
| Đáp án bài tập trước công bố | Trung bình | GV chính | Gian lận |
| Tài khoản Admin | Rất cao | Admin | Chiếm toàn hệ thống |
| Phiên đăng nhập (cookie) | Cao | Chủ phiên | Mạo danh |
| Mật khẩu (hash), mật khẩu tạm | Cao | — / Staff tạo (một lần) | Chiếm tài khoản |
| Audit log | Trung bình | Admin (đọc) | Che giấu thao tác |
| `DATABASE_URL`, `.env` | Rất cao | Dev/ops | Toàn bộ dữ liệu |

## 2. Trust boundaries and data flows

Xem [09 system-context §3](09-architecture/system-context.md#3-trust-boundaries-và-luồng-dữ-liệu): vùng công khai → vùng đã xác thực → vùng đặc quyền → vùng server/DB. Mọi dữ liệu từ trình duyệt không tin cậy.

## 3. Threat register

Khả năng (L) / Tác động (I): T = thấp, TB = trung bình, C = cao. Trạng thái: **Đã giảm thiểu** (có code) · **Kiểm chứng: Unit/Review/Manual** · **Mở**.

| ID | Mối đe dọa / abuse case | Asset / endpoint | L | I | Biện pháp | Kiểm chứng | Trạng thái |
|---|---|---|---|---|---|---|---|
| T-01 | Spam form học thử, làm đầy DB | API-001, leads | C | TB | Rate limit IP 5/10' (BR-002); honeypot; giới hạn độ dài mọi trường; gộp lead mở trùng SĐT | TC-004 (unit) | Đã giảm thiểu |
| T-02 | Dò mật khẩu một tài khoản | API-005 | TB | C | Argon2id; khóa 15' sau 5 lần sai; thông báo lỗi chung | TC-010 (unit) | Đã giảm thiểu |
| T-02b | Credential stuffing nhiều tài khoản từ một IP | API-005 | TB | C | Rate limit `login:<ip>` 20/10' (BR-009) | TC-043 | Đã giảm thiểu (P3); IP sau proxy: RISK-009 |
| T-02c | Dò tài khoản tồn tại qua thông báo/thời gian | API-005 | TB | T | Thông báo chung; băm giả khi không có user | Review | Đã giảm thiểu |
| T-03 | Đánh cắp/đoán phiên | cookie, sessions | T | C | Token 32 byte ngẫu nhiên; DB chỉ lưu sha256; `httpOnly`, `SameSite=Lax`, `Secure` (prod); 7 ngày; thu hồi khi đăng xuất/khóa/đổi vai trò/đặt lại MK | Review | Đã giảm thiểu |
| T-04 | IDOR — đổi id trên URL để xem lớp/con/bài người khác | mọi page `[id]`, `?con=` | C | C | Policy phạm vi server cho mọi đọc/ghi (`scope.ts`, service); trả 404 (ADR-004) | TC-034, TC-035 (unit); TC-UAT-13 (manual) | Đã giảm thiểu; manual chưa chạy |
| T-05 | Gọi Server Action trực tiếp, bỏ qua UI (sửa field ẩn) | mọi action | C | C | Mỗi action `requireRole`; service kiểm phạm vi; đối chiếu id ẩn với DB (studentIds thuộc lớp, answerId thuộc bài nộp, role được tạo) | Review (21 §checklist) | Đã giảm thiểu |
| T-06 | Lộ đáp án/điểm trước công bố | Q-026, API-018 | TB | TB | `toStudentQuestion()` bỏ trường đáp án; `result = null` khi chưa công bố; BR-047 cho bài chưa chấm | TC-032, TC-033, TC-042; TC-UAT-10 (xem source) | Đã giảm thiểu; manual chưa chạy |
| T-07 | CSRF | mọi action | T | C | Next.js kiểm tra Origin cho Server Actions; SameSite=Lax; không có GET thay đổi dữ liệu | Review | Đã giảm thiểu |
| T-08 | XSS (stored qua ghi chú, tên, câu trả lời) | mọi trang hiển thị dữ liệu người dùng | TB | C | React escape mặc định; không dùng `dangerouslySetInnerHTML`; JSON audit hiển thị bằng `JSON.stringify` trong `<pre>` | `grep dangerouslySetInnerHTML src` = 0 | Đã giảm thiểu |
| T-09 | HS tự sửa điểm/nộp lại | API-018, 019 | TB | TB | Không có action ghi điểm cho HS; nộp một chiều (BR-045); chấm chỉ GV chính | TC-028 | Đã giảm thiểu |
| T-10 | Mất quyền Admin cuối cùng | API-008 | T | C | Admin không tự khóa/tự đổi vai trò (BR-051) | TC-038 | Đã giảm thiểu; còn rủi ro Admin A khóa Admin B (chấp nhận) |
| T-11 | Lộ secret | `.env`, log | T | C | `.env` trong `.gitignore`; không log secret; `.env.example` chỉ có tên biến | Review | Đã giảm thiểu |
| T-12 | SQL injection | Prisma, `$queryRaw` | T | C | Prisma tham số hóa; `$queryRaw` chỉ dùng tagged template (tham số hóa) cho `FOR UPDATE` | Review | Đã giảm thiểu |
| T-13 | Mass assignment (gửi thêm field như `role`, `status`) | mọi action | TB | C | Chỉ đọc field liệt kê (`formFields(names)`) + Zod object; service tự đặt field nhạy cảm | Review | Đã giảm thiểu |
| T-14 | Clickjacking | mọi trang | T | TB | `X-Frame-Options: DENY` | Smoke test header | Đã giảm thiểu |
| T-15 | Open redirect | redirect sau đăng nhập | T | TB | Đích redirect cố định theo vai trò, không lấy từ query | Review | Đã giảm thiểu |
| T-16 | Lộ mật khẩu tạm | API-004, 008 | TB | C | Chỉ trong response một lần, không lưu rõ, không log; bắt đổi ở lần đầu | Review | Đã giảm thiểu; kênh gửi cho PH ngoài hệ thống (chấp nhận) |
| T-17 | Lạm dụng nhập lead tay để thu thập SĐT trùng | API-021 | T | T | Chỉ Staff/Admin; trùng → chỉ trả id lead (Staff vốn xem được) | Review | Đã giảm thiểu |
| T-18 | DoS qua payload lớn (danh sách id, câu trả lời dài) | API-013, 015, 018, 019 | TB | TB | Giới hạn số id (50/200), độ dài chuỗi (500/20.000), cắt chuỗi phía server | Review | Đã giảm thiểu; giới hạn body mặc định của Next (1 MB) |
| T-19 | Né rate limit bằng giả mạo `X-Forwarded-For` | API-001, 005 | TB | TB | Production phải đặt sau proxy ghi đè header | — | **Mở** (RISK-009, cần khi chọn hosting) |
| T-20 | Phiên hết hạn tích tụ | sessions | C | T | Dọn định kỳ | — | **Mở** (RISK-010, Pha 2) |

## 4. Control checklist

| Nhóm | Kiểm soát | Trạng thái |
|---|---|---|
| Authentication | Email/SĐT + mật khẩu Argon2id (`@node-rs/argon2`); khóa tạm; rate limit IP; bắt đổi mật khẩu tạm; không có quên mật khẩu tự phục vụ (Staff đặt lại) | Có |
| Authorization | RBAC (`policy.ts`) + phạm vi (`scope.ts`) ở server; layout **và** page **và** action | Có |
| Validation | Zod cho mọi input; độ dài; enum; id ≤ 40 | Có |
| Output encoding | React JSX | Có |
| CSRF / CORS | Origin check (Next); SameSite=Lax; cùng origin | Có |
| Session | DB, sha256, httpOnly, Secure (prod), 7 ngày, thu hồi | Có |
| Rate limiting | Form học thử, đăng nhập | Có |
| Upload | Không có | N/A |
| Headers | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; tắt `X-Powered-By` | Có; **CSP chưa có** (QUESTION-Q05) |
| Dependencies | `pnpm audit` chưa chạy định kỳ | Mở — thêm vào release checklist |
| Secrets | `.env` không commit; `SEED_DEMO_PASSWORD` tùy chọn | Có |
| Logging | Không log PII/secret; audit nghiệp vụ | Có |
| Privacy | Tối thiểu hóa dữ liệu; consent form | Có (một phần — xem §5) |
| Backup | Thủ công `mysqldump` | Có (chưa thử restore — RISK-011) |
| Incident | Quy trình docs/14 §7 | Có (giấy) |

## 5. Privacy review

| Dữ liệu | Mục đích | Tối thiểu? | Cơ sở | Ai truy cập | Lưu bao lâu |
|---|---|---|---|---|---|
| Tên, SĐT, email phụ huynh (lead) | Gọi lại tư vấn | Có (email tùy chọn) | Đồng ý liên hệ ở form (lưu thời điểm trong hoạt động CREATED); nhập tay: Staff xác nhận khi tư vấn | Staff, Admin | Lead LOST: **TBD** (QUESTION-Q03, đề xuất 12 tháng rồi ẩn danh hóa) |
| Tên, khối học sinh (lead) | Xếp lớp | Có — không hỏi ngày sinh, trường, địa chỉ | Như trên | Staff, Admin | Như trên |
| Tài khoản HS/PH | Học và theo dõi | Có | Hợp đồng học (ngoài hệ thống) | Theo docs/03 | Đến khi nghỉ học + TBD |
| Điểm, chuyên cần, nhận xét | Theo dõi học tập | Có | Như trên | HS, PH (con), GV (lớp mình), Staff, Admin | TBD |
| Câu hỏi chatbot; nội dung buổi học; bài làm tự luận/ảnh phiếu (khi GV bấm AI) | Trả lời hỏi đáp, soạn bài, gợi ý chấm | Có — chatbot chỉ gửi chữ câu hỏi; soạn bài chỉ gửi dữ liệu giảng dạy (không dữ liệu HS); chấm bài gửi một câu + bài làm **không kèm tên** | Hợp đồng học + GV chủ động bấm; **cần PO xác nhận và thông báo phụ huynh trước khi bật AI thật** (Q10) | Nhà cung cấp AI theo `AI_PROVIDER` (mặc định không gọi ai: chế độ mẫu) | Theo chính sách nhà cung cấp; gói miễn phí có thể dùng để huấn luyện — **kiểm tra điều khoản** |
| Audit | Truy vết thao tác | Không chứa mật khẩu/token | Lợi ích hợp pháp | Admin | TBD (QUESTION-Q11) |

- **Trẻ em:** dữ liệu học sinh vị thành niên do phụ huynh/học viện cung cấp; HS nhỏ có thể không có email/SĐT (DECISION-D12).
- **Quyền của chủ thể dữ liệu** (xem, sửa, xóa): chưa có chức năng tự phục vụ; Admin xử lý thủ công. Cần tư vấn pháp lý trước production về quy định bảo vệ dữ liệu cá nhân tại Việt Nam — **không khẳng định đã tuân thủ** (QUESTION-Q10).
- **Disclosure:** footer chưa có chính sách quyền riêng tư (QUESTION-Q02/Q10).

## 6. Residual risks and approval

| Rủi ro | Lý do chấp nhận tạm | Owner | Xem lại |
|---|---|---|---|
| Chưa có CSP | Không có script bên thứ ba; React escape | Chủ dự án | Trước production (Q05) |
| Chưa kiểm thử xâm nhập/E2E quyền thực tế | DB chưa migrate | Chủ dự án + trợ lý | Pha 1.5 |
| IP rate limit phụ thuộc proxy | Chưa có hosting | Chủ dự án | Khi chọn hosting (RISK-009) |
| Không có 2FA cho Admin | Quy mô nhỏ; P2-13 | Chủ dự án | Pha 2 |
| Chưa có chính sách lưu trữ/xóa | Cần quyết định nghiệp vụ/pháp lý | Chủ dự án | Trước production (Q03, Q10, Q11) |
| Gửi bài làm HS cho nhà cung cấp AI ngoài | Chỉ khi GV bấm; không kèm tên; có thể tắt bằng cách không đặt `AI_API_KEY` | Chủ dự án | Trước khi bật AI thật (Q10) — docs/23 §3 |
| AI sai (đáp án đề, điểm gợi ý) | Mọi đầu ra là nháp/gợi ý, GV xác nhận; điểm không bao giờ tự ghi/công bố | GV + chủ dự án | Sau 1–2 tháng dùng, đo tỷ lệ sửa (P2-51) |

Phê duyệt: **chưa** — chủ dự án xem xét trước release (docs/18).
