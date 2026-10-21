# 17 — Câu hỏi mở, giả định và quyết định

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — thêm DECISION-D15..D19, ASSUMPTION-A05..A07, QUESTION-Q09..Q11 |
| Owner | Trợ lý (BA/PM) ghi; chủ dự án quyết định |

## 1. Quyết định

| ID | Ngày | Trạng thái | Quyết định | Phương án đã cân nhắc | Lý do / đánh đổi | Owner |
|---|---|---|---|---|---|---|
| DECISION-D01 | 2026-10-21 | Chốt | Làm lại toàn bộ kể cả DB trên nhánh `rebuild/v3`; `main` giữ bản cũ | Sửa dần v2 | Bản cũ tài liệu và code không khớp, phạm vi quá lớn | PO |
| DECISION-D02 | 2026-10-21 | Chốt | Học viện đa môn (Toán, Văn, Anh, Lý, Hóa, Tin) | — | Theo chủ dự án | PO |
| DECISION-D03 | 2026-10-21 | Chốt | Next.js 15 fullstack + Prisma 6 + MySQL 8 | NestJS tách API; PostgreSQL | ADR-001 | PO |
| DECISION-D04 | 2026-10-21 | Chốt | Mỗi tài khoản một vai trò | Nhiều vai trò/tài khoản | Đơn giản phân quyền; người vừa GV vừa PH dùng 2 tài khoản | PO |
| DECISION-D05 | 2026-10-21 | Chốt | MVP = công khai/tuyển sinh + đào tạo/điểm danh + bài tập/chấm | Có học phí | Học phí và AI để Pha 2 | PO |
| DECISION-D06 | 2026-10-21 | Chốt | Xóa và dùng lại database `corelink` (có backup trước) | DB mới | Theo chủ dự án | PO |
| DECISION-D07 | 2026-10-21 | Chốt | Giao diện sáng, học thuật, tối giản; navy `#1F3A5F` | — | Theo chủ dự án; docs/08 | PO |
| DECISION-D08 | 2026-10-21 | Chốt | Chỉ tiếng Việt, không i18n | next-intl | Không có nhu cầu đa ngôn ngữ | PO |
| DECISION-D09 | 2026-10-21 | Chốt | Phiên lưu trong DB (cookie token), không JWT/NextAuth | JWT, NextAuth | ADR-002 | PO |
| DECISION-D10 | 2026-10-21 | Chốt | Điểm lưu `Float`, làm tròn 2 chữ số ở logic | Decimal | Tránh chuyển đổi Decimal qua Server/Client Components; thang điểm nhỏ | PO |
| DECISION-D11 | 2026-10-21 | Chốt | Sai phạm vi trả 404 thay vì 403 | 403 | ADR-004 | PO |
| DECISION-D12 | 2026-10-21 | Chốt | HS đăng nhập bằng email/SĐT riêng; không có thì tài khoản tạo nhưng chưa đăng nhập được tới khi Admin bổ sung | Đăng nhập bằng mã HS | Giữ FR-010; mã HS là P2-14 (Q07) | PO |
| DECISION-D13 | 2026-10-21 | Chốt | Action trả lại giá trị đã nhập (`values`) khi lỗi, không trả mật khẩu | — | React 19 reset form sau action | PO |
| DECISION-D14 | 2026-10-21 | Chốt | Sai vai trò → về tổng quan của mình; sai phạm vi → 404 | — | docs/03 §6 | PO |
| DECISION-D15 | 2026-10-21 | **Đề xuất — chờ PO xác nhận** | Cho phép công bố khi còn bài chưa chấm; bài nộp chưa chấm hiển thị "Đang chờ chấm" (không điểm, không đáp án) cho tới khi chấm (BR-047); thẻ công bố hiện số bài chưa chấm | (a) Chặn công bố khi còn bài chưa chấm; (b) công bố hiện điểm 0 (hiện trạng cũ) | (a) chặn GV khi 1 HS nộp muộn; (b) hiển thị sai điểm. Rủi ro thấp, đảo ngược được | AI → PO |
| DECISION-D16 | 2026-10-21 | **Đề xuất — chờ PO xác nhận** | Rate limit đăng nhập 20 lần/10 phút/IP (BR-009) ngoài khóa theo tài khoản | CAPTCHA; không giới hạn | Chống credential stuffing, không thêm phụ thuộc; ngưỡng đủ rộng cho phòng máy dùng chung IP | AI → PO |
| DECISION-D17 | 2026-10-21 | **Đề xuất — chờ PO xác nhận** | Nhập lead tay trùng SĐT lead đang mở → từ chối + liên kết lead cũ (khác form công khai là gộp âm thầm) | Gộp như form công khai | Staff đang thấy dữ liệu; tránh lead trùng do nhập 2 lần | AI → PO |
| DECISION-D18 | 2026-10-21 | **Đề xuất — chờ PO xác nhận** | Môn học xóa được khi chưa có khóa; lead tham chiếu môn → bỏ tham chiếu | Không cho xóa môn | Ma trận quyền ghi Admin CRUD môn; FK `courses.subjectId` RESTRICT bảo vệ | AI → PO |
| DECISION-D19 | 2026-10-21 | Chốt (PO) | Phiên 3: giữ 35 FR, viết tài liệu chi tiết theo vai trò dự án **và** theo cổng người dùng, sau đó bổ sung code theo báo cáo đối chiếu; trợ lý **không commit**; PO tự chạy `pnpm db:reset` | Mở lại discovery; viết lại code | Theo trả lời của chủ dự án | PO |

| DECISION-D20 | 2026-10-21 | Chốt (PO) | Dùng PostgreSQL trên Supabase (project `uqyslddttlxnkdxginej`) thay MySQL local, cho cả dev và Vercel | MySQL cloud (TiDB/Aiven) | Vercel không truy cập được DB local; PO đã có Supabase — [ADR-005](09-architecture/adr/ADR-005-postgresql-supabase.md). Trả lời QUESTION-Q04 một phần (hosting = Vercel + Supabase) | PO |

| DECISION-D21 | 2026-10-21 | Chốt (PO) | Giao diện theo nhận diện thương hiệu: logo + banner chính thức (xanh `#1C2D95`, xanh sáng `#1D46D4`, trắng); thay DECISION-D07 (navy `#1F3A5F`, nền giấy ngà) | Giữ D07 | PO yêu cầu đồng bộ tone màu logo, banner và fanpage Facebook — docs/08 §2, §4 | PO |
| DECISION-D22 | 2026-10-21 | Chốt (PO) | Trang chủ làm lại theo mô tả của PO: bảng màu `#1F2F98` / `#121C5E` / `#2F6BFF` / `#F5F7FE` / `#0E1433` / `#4A5274` (thay D21), font Be Vietnam Pro + Lora, Framer Motion + lucide-react, 13 khối (thanh trên, header mega-menu, banner, truy cập nhanh, số liệu, chương trình 3 môn x 4 cấp, vì sao chọn, giáo viên, dải chữ chạy, tin tức + học viên tiêu biểu, form học thử, chân trang, nút nổi). **Nội dung trang chủ là dữ liệu tĩnh** trong `src/data/*.ts` (không đọc DB); danh mục khóa học thật vẫn ở `/khoa-hoc`. Form trang chủ ghi lead qua `submitHomeTrialAction` (FR-004/005) | Giữ D21 và trang chủ đọc DB | PO yêu cầu trực tiếp; thay các mục "Tránh" trong docs/08 §2 (glassmorphism, animation, bộ icon) cho riêng trang chủ. FR-001 điều chỉnh (docs/01). Menu/tin tức/giáo viên/học viên tiêu biểu chưa có trang riêng → ghi P2-23..P2-25 | PO |
| DECISION-D23 | 2026-10-22 | **Đề xuất — chờ PO xác nhận** | Tối ưu BE theo round-trip: bật Prisma preview `relationJoins`; cache Next (`unstable_cache`) cho danh sách môn và số liệu tổng quan có `revalidateTag`; rate limit bằng một `INSERT … ON CONFLICT`; ghi điểm danh theo lô; thêm index (migration `20261022090000`); audit thêm 6 thao tác xóa/liên kết | Redis; repository layer; middleware RBAC; giữ nguyên | RTT ~250 ms tới Supabase → số round-trip quyết định tốc độ. `relationJoins` là preview: đã kiểm chứng kết quả 18 nhóm service giống hệt từng byte so với chiến lược cũ; tắt được bằng cách bỏ dòng `previewFeatures` + `prisma generate`. Redis/queue chưa cần ở quy mô < 500 HS (A06) và Pha 1 không có mail/export | AI → PO |
| QUESTION-Q12 | 2026-10-21 | **Trả lời một phần (D22)** | Banner và mô tả trang chủ ghi "Toán – Văn – Anh", "Tiền tiểu học – THPT", "7–12 học sinh/lớp", "10+ năm" — khác tài liệu hiện tại (6 môn D02, lớp 1–12 A02, sĩ số mặc định 16). PO đã yêu cầu hiển thị các nội dung này trên trang chủ (D22). **Còn mở:** có đổi phạm vi dữ liệu (môn, bậc tiền tiểu học, sĩ số) hay chỉ là nội dung giới thiệu? Hiện form chuyển "Tiền tiểu học" thành lớp 1 + ghi chú | Chỉ hiển thị, chưa đổi schema | Đổi phạm vi/seed cần PO quyết | PO |

| DECISION-D24 | 2026-10-21 | Chốt (PO) | Lưu tệp tải lên trong Postgres: metadata `stored_files`, nội dung `file_blobs` (bảng riêng để danh sách không kéo dữ liệu nhị phân); ≤ 4 MB mỗi lần gửi (giới hạn body Vercel 4,5 MB); tải qua `/tep/<id>` có kiểm tra quyền | Supabase Storage; chỉ dán link | Không cần cấu hình thêm, chạy ngay trên Vercel; đổi sang Storage sau chỉ thay `src/server/files/*` | PO |
| DECISION-D25 | 2026-10-21 | Chốt (PO) | Đơn xin nghỉ của PH do GV của lớp/buổi **hoặc** giáo vụ/Admin duyệt; duyệt → điểm danh "Có phép" | Chỉ giáo vụ; chỉ GV | File Phụ huynh.md ghi "cần khách hàng xác nhận"; PO chọn phương án này | PO |
| DECISION-D26 | 2026-10-21 | Chốt (PO) | Mở rộng phạm vi: thêm FR-036..FR-052 từ 4 file chức năng của PO (upload tệp, tài liệu, thông báo, nhắn tin, báo cáo… trước đây "ngoài phạm vi Pha 1"). Mục ghi "Giả định – cần xác nhận" vẫn không làm (docs/05 §5) | Giữ 35 FR | PO yêu cầu "bổ sung những thứ thiếu vào dự án, code luôn". Migration `20261023090000_portal_features` (chỉ thêm bảng/cột) do trợ lý chạy với sự đồng ý của PO | PO |
| DECISION-D27 | 2026-10-21 | **Đề xuất — chờ PO xác nhận** | Tin nhắn/thông báo không realtime: trang tự làm mới 8–15 giây khi đang mở | WebSocket/Supabase Realtime | Bảng ưu tiên xếp chat realtime là "chức năng phụ"; không thêm hạ tầng | AI → PO |
| DECISION-D28 | 2026-10-21 | **Đề xuất — chờ PO xác nhận** | Thông báo tính người nhận lúc gửi (fan-out vào `notifications`); HS vào lớp sau không nhận thông báo cũ | Tính người nhận lúc đọc | Đơn giản, đếm "đã đọc" chính xác; quy mô < 500 người | AI → PO |
| DECISION-D29 | 2026-10-21 | **Đề xuất — chờ PO xác nhận** | Nhắn 1-1 GV ↔ HS chưa mở (file GV ghi "giả định – cần xác nhận", BR34); HS trao đổi trong nhóm lớp | Mở cho GV ↔ HS lớp mình | Học sinh vị thành niên; chờ PO quyết | AI → PO |

## 2. Giả định

| ID | Giả định | Tác động nếu sai | Cách xác minh | Hạn |
|---|---|---|---|---|
| ASSUMPTION-A01 | Một cơ sở duy nhất | Cần `campusId` khắp schema (P2-19) | Hỏi PO | Trước Pha 2 |
| ASSUMPTION-A02 | Học sinh lớp 1–12 | `gradeLevel` 1..12 | Hỏi PO | Trước Pha 2 |
| ASSUMPTION-A03 | Học phí trên web chỉ tham khảo, không thanh toán online | — | Hỏi PO | Trước Pha 2 |
| ASSUMPTION-A04 | Staff tạo tài khoản HS/PH, chỉ Admin tạo nhân sự | Đổi `canCreateUserWithRole` | Hỏi PO | Trước production |
| ASSUMPTION-A05 | Không có deadline cứng và chưa có ngân sách hosting | Thứ tự pha | Hỏi PO khi chọn hosting | Q04 |
| ASSUMPTION-A06 | Quy mô < 500 HS, < 50 lớp đồng thời | Cần tối ưu truy vấn/cache | Đo NFR-009 ở Pha 1.5 | Pha 1.5 |
| ASSUMPTION-A07 | Dời buổi không cần kiểm tra trùng lịch của từng học sinh | HS có thể bị trùng 2 lớp sau khi dời | Hỏi PO | Trước production |

## 3. Câu hỏi mở

| ID | Câu hỏi | Tác động | Owner | Cần trước |
|---|---|---|---|---|
| QUESTION-Q01 | Logo, tên miền chính thức? | Header, metadata, `APP_URL` | PO | Production |
| QUESTION-Q02 | Địa chỉ, hotline, giờ làm việc thật cho footer? | Nội dung công khai (đang để chữ "sẽ được cập nhật") | PO | Production |
| QUESTION-Q03 | Giữ lead LOST bao lâu? Quy trình xóa/xuất dữ liệu theo yêu cầu? | Chính sách riêng tư, job dọn dữ liệu | PO | Production |
| QUESTION-Q04 | Hosting (VPS, Vercel + MySQL cloud…)? | Triển khai, proxy/IP (RISK-009), backup | PO | Production |
| QUESTION-Q05 | CSP chặt, giám sát lỗi, audit đăng nhập? | Bảo mật/vận hành | PO | Production |
| QUESTION-Q06 | Thứ tự ưu tiên Pha 2 (học phí, thông báo, AI, QR…)? | Kế hoạch | PO | Sau Pha 1 |
| QUESTION-Q07 | HS nhỏ không có email/SĐT: đăng nhập bằng mã HS? | FR-010, trải nghiệm HS tiểu học | PO | Trước khi có HS thật |
| QUESTION-Q08 | Cấp quyền tạo database `corelink_test` (hoặc DB test khác) cho tài khoản MySQL dev? | Chạy integration test (`TEST_DATABASE_URL`) | PO | Pha 1.5 |
| QUESTION-Q09 | Dùng công cụ analytics nào (hoặc không) để đo KPI-002? | KPI, consent cookie | PO | Sau go-live |
| QUESTION-Q10 | Cần tư vấn pháp lý về bảo vệ dữ liệu cá nhân (dữ liệu trẻ em) và chính sách quyền riêng tư công khai? | Tuân thủ, footer | PO | Production |
| QUESTION-Q11 | Thời gian lưu audit log? | Dung lượng, chính sách | PO | Production |
