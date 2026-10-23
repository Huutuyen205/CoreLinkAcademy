# Tiến độ — CoreLink Academy v3

## 2026-10-23 — Trợ lý AI: chatbot, soạn bài, hỗ trợ chấm bài (DECISION-D33)

PO yêu cầu "thực hiện đi" + "cả các phase luôn" sau khi nghe đề xuất. Tài liệu thiết kế và hướng dẫn nối AI: **docs/23-ai-tro-ly.md**.

- **Lớp AI dùng chung** (`src/server/ai/`): đổi nhà cung cấp bằng env (`AI_PROVIDER` = `mock`/`gemini`/`openai`[Groq, OpenRouter…]/`anthropic`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`, `AI_JSON_MODE`). **Thiếu khóa → chế độ mẫu (mock)**: không gọi mạng, chạy đủ mọi luồng, có nhãn "Bản mẫu". Mọi đầu ra AI qua Zod, thử lại 1 lần, giới hạn lượt/người/ngày (dùng lại `rate_limit_buckets`), audit chỉ ghi siêu dữ liệu (không ghi nội dung).
- **Chatbot (FR-053)**: nút nổi ở mọi trang nội bộ; 28 ý định theo vai trò (PH/HS, GV, quản lý, chung) + nút gợi ý; luật từ khóa không cần AI, AI chỉ chọn ý định khi luật yếu; dữ liệu lấy bằng service có sẵn (đúng phạm vi D11/D14). Xử lý: phụ huynh nhiều con (hỏi lại), chưa điểm danh ≠ vắng, buổi hủy/dạy thay, điểm chưa công bố không lộ, ngày tương đối giờ VN, sai phạm vi → "không tìm thấy".
- **Soạn bài (FR-054)** `/giao-vien/soan-bai`: giáo án, slide `.pptx`, tóm tắt giáo trình, đề trắc nghiệm, bài tập, tự luận Toán/Anh (có đáp án mẫu + thang điểm) → khuôn Word/PowerPoint hoặc **bài tập NHÁP** có đáp án (tổng 10 điểm, bước 0,25); tệp riêng tư của giáo viên (không chia sẻ HS/PH).
- **Hỗ trợ chấm (FR-055)**: gợi ý điểm tự luận (chữ gõ + ảnh viết tay) trong trang chấm bài, chỉ điền khi GV bấm "Áp dụng" rồi "Lưu điểm"; **chấm phiếu trắc nghiệm giấy** `/giao-vien/bai-tap/<id>/phieu-giay` (AI đọc → GV sửa → lưu; điểm do `autoGrade`).
- **Không đổi schema, không migration.** Thêm thư viện `docx`, `pptxgenjs` (cập nhật `package.json` + `pnpm-lock.yaml`, chỉ thêm dòng); `next.config.ts` thêm 2 gói vào `serverExternalPackages`.
- **Tài liệu**: docs/23 (mới), 01 (v3.6, FR-053..055), 03, 05 (FEAT-045..047, P2-05 cập nhật, P2-48..56), 12, 13, 14, 17 (D33), `.env.example`.

### Kiểm thử
- `pnpm typecheck` ✓ · `pnpm lint` ✓ (0 lỗi, 0 cảnh báo) · `pnpm test` ✓ **26 file / 207 test** (mới +83: cấu hình, JSON, chia điểm, 18 dữ liệu mẫu qua schema, 6 khuôn Word/PowerPoint, khớp 20 câu hỏi mẫu theo vai trò, adapter Gemini/OpenAI/Claude bằng `fetch` giả) · `pnpm build` ✓.
- **Integration trên PostgreSQL thật (54/54, trong đó 46 mới)** — DB tạm riêng, múi giờ UTC: chatbot từng vai trò + phạm vi, điểm chưa công bố không lộ, "chưa điểm danh ≠ vắng", AI nhận diện ý định qua `fetch` giả (không gửi tên/dữ liệu học sinh), hết lượt AI vẫn dùng được luật, soạn bài → bài tập nháp/tệp riêng tư (HS/PH tải → bị chặn), audit không chứa nội dung, gợi ý chấm không ghi điểm, phiếu giấy (HEIC bị từ chối, GV khác bị chặn, nộp lần 2 bị chặn, điểm ẩn tới khi công bố).
- **HTTP trên server bản build + Server Action thật (21 + 13 + 8 đạt)**: chatbot 4 vai trò, PH khác xem con người khác → "không tìm thấy"; sinh 6 loại nội dung, lưu bài tập nháp + `.pptx` (tải 200 cho GV/Admin, 404 cho HS/PH/GV khác); đọc/lưu phiếu giấy với ảnh thật. (Các dòng "FAIL" còn lại khi chạy tay là lỗi kịch bản thử — thiếu mã bài nộp tự luận / đường dẫn có hậu tố `;push` — đã kiểm lại đúng bằng cách khác.)
- **Chưa kiểm thử**: **gọi nhà cung cấp AI thật** (không có khóa API; adapter chỉ kiểm bằng `fetch` giả — tên model mặc định có thể đã đổi, đặt `AI_MODEL`); chất lượng đề/đáp án và độ chính xác đọc chữ viết tay; giao diện trên trình duyệt thật (kích thước nút nổi trên điện thoại, chụp ảnh phiếu bằng camera) — PO thử trên máy; thời gian chạy thật trên Vercel (`maxDuration = 60`).

### Việc PO
1. **Chạy `pnpm install`** (lockfile đã thêm `docx`, `pptxgenjs`). Máy dev hiện chưa có `pnpm` và `node_modules` được cài bằng npm — tệp `package-lock.json` chưa theo dõi là do `npm`, không phải của phiên này.
2. Bật AI thật (tùy chọn): lấy khóa miễn phí (vd. Google AI Studio) → đặt `AI_PROVIDER`, `AI_API_KEY` trên Vercel → redeploy (docs/23 §3). **Trước đó xác nhận chính sách dữ liệu (Q10):** gợi ý chấm/đọc phiếu gửi bài làm không kèm tên tới nhà cung cấp; gói miễn phí có thể dùng để huấn luyện.
3. Review, commit, push.

## 2026-10-22 (tối) — Khảo sát sản phẩm tương tự + 7 tính năng bổ sung (DECISION-D32)

- **Khảo sát:** docs/22 — Easy Edu, MONA eLMS, MISA/Zoho CRM giáo dục, Teachworks, TutorBird, Wise, ClassDojo, Kinderpedia; bảng đối chiếu, logic từng tính năng, nguồn.
- **B1 Kanban lead** `/quan-ly/lead?xem=bang`: 6 cột, kéo thả (máy tính) hoặc ô "Chuyển sang…" (điện thoại), LOST hỏi lý do, thả vào "Đã nhập học" mở form chuyển học viên.
- **B2 Nhật ký buổi học**: cột mới `class_sessions.lessonContent/homework/lessonLoggedAt` (migration `20261025090000_lesson_log`, đã áp); GV ghi ở trang điểm danh; HS/PH xem ở chi tiết buổi; lần đầu báo HS + PH.
- **B3 Biểu đồ tiến độ** (`lib/progress.ts`, SVG): Kết quả HS, cổng PH, hồ sơ HS (quản lý, GV).
- **B4 Nhắc lịch ngày mai**: `vercel.json` cron `0 12 * * *` → `/api/cron/nhac-lich` (cần `CRON_SECRET`); nút "Nhắc lịch ngày mai" ở Lịch tổng; gộp một thông báo/người, không trùng.
- **B5 Xuất `.ics`** `/lich/xuat` (`lib/ical.ts`): nút ở Lịch dạy, Lịch học, cổng PH.
- **B6 Tìm nhanh Ctrl+K**: thanh tìm ở sidebar, nút kính lúp trên điện thoại; quản lý/GV theo phạm vi.
- **B7 Toast**: thông báo nổi cho nút thao tác, liên kết phụ huynh, kéo thả lead.
- **Sửa lỗi có sẵn:** tìm lead bằng chữ có lẫn số (vd. "Lớp 9") khớp mọi SĐT có chữ số đó → chỉ tìm SĐT gần đúng khi từ khóa là số (`phoneFragment`).
- **Tài liệu:** docs/22 (mới), 01 (v3.5), 03, 05 (P2-12, P2-45..47), 14 (`CRON_SECRET`), 17 (D32).

### Kiểm thử
- `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ **124 test** (mới: `progress`, `ical`, `reminders`, `phoneFragment`) · `pnpm build` ✓.
- **Thật trên DB + server bản build (27/27 đạt):** nhật ký (GV khác bị chặn, rỗng bị chặn, lần đầu báo HS+PH đúng link, sửa không báo lại); nhắc lịch (lớp tạm ngày 05/01/2031: báo GV+HS+PH, PH thấy tên con, chạy lại không trùng, cron sai/thiếu khóa → 404); tìm nhanh (quản lý thấy HS/lớp, GV chỉ thấy HS lớp mình, HS không dùng được); Kanban (đúng cột, đổi cột, chặn chuyển sai luật); 8 trang 200 có nội dung mới; `.ics` hợp lệ, PH khác → 404. Dữ liệu "[Kiểm thử]" đã xóa (gồm 1 thông báo hủy lớp còn sót ở GV demo từ lượt trước).
- **Chưa kiểm thử:** cron thật trên Vercel (không chạy với dữ liệu thật để tránh gửi nhắc cho người dùng thật), kéo thả bằng chuột/cảm ứng, mở tệp `.ics` trên điện thoại.

### Việc PO
1. Vercel → Environment Variables: thêm `CRON_SECRET` (chuỗi ngẫu nhiên) rồi redeploy — cron nhắc lịch mới chạy.
2. Review, commit, push.


## 2026-10-22 (chiều) — Giao diện quản lý, hủy/xóa lớp, khóa dây chuyền, cài ứng dụng (DECISION-D31)

- **Trang bị kéo ngang:** cột nội dung `minmax(0,1fr)` + `min-w-0`; `html, body { overflow-x: clip }`; bảng quá rộng cuộn trong khung (`DataTable` `overflow-x-auto`).
- **Lọc tự động:** `FilterForm` — chọn ô là lọc, gõ chữ lọc sau 0,5 giây, giữ con trỏ ở ô tìm; áp cho Người dùng, Học viên, Phụ huynh, Giáo viên, Lớp (thêm tìm mã/khóa/GV), Lead, Lịch tổng, Nhật ký, Báo cáo, Tài liệu, Môn học, ghi danh lớp; trang Khóa học công khai lọc ngay nhưng vẫn giữ nút cho trình duyệt không JS.
- **Nút thao tác thống nhất:** `RowActions`/`ActionLink`/`ActionButton` (cùng cỡ, icon, xác nhận, hỏi lý do, lỗi hiện dưới nút); `UserRowActions` dùng chung (Hồ sơ · Sửa · Đặt lại MK · Khóa/Mở khóa — 3 nút sau chỉ Admin). Có ở Người dùng, Học viên, Phụ huynh, Giáo viên (danh sách + trang chi tiết), Lớp, Khóa học (Sửa · Xem trên web · Ẩn/Xuất bản · Xóa), Phòng (Lịch · Tạm ngừng/Dùng lại · Xóa), Lead (Xử lý · Gọi · Chuyển HS), Môn & cấp học.
- **Học viên:** thẻ mới (ảnh, mã, khối, trạng thái, nút thao tác ở đầu thẻ; lớp đang học dạng chip; phụ huynh dạng chip có nút gỡ; ô "Thêm phụ huynh" gõ tìm + nút cùng một hàng); lọc "Tài khoản", "Chưa có phụ huynh", "Chưa có lớp".
- **Lớp học:** nút **Hủy lớp** (hỏi lý do, hủy buổi chưa học, thông báo lớp, audit `class.cancel`) và **Xóa lớp** (lớp có học sinh phải hủy trước) ở danh sách và chi tiết.
- **Khóa dây chuyền:** khóa/mở HS ↔ PH một cấp, cả hai chiều; câu xác nhận nói rõ ai bị khóa theo; thu hồi phiên; audit từng tài khoản.
- **Môn & cấp học:** thẻ cấp học có nút Sửa/Ngừng/Xóa; bảng ma trận môn × cấp (✓); form Thêm/Sửa ở cột phải; slug tự tạo từ tên (cả khóa học).
- **Tài liệu:** tệp là chính, "Liên kết ngoài (tùy chọn)" đặt sau và hiển thị nhỏ.
- **Cài ứng dụng:** trang `/cai-ung-dung` (nút cài một chạm trên Android/Chrome/Edge, hướng dẫn iPhone "Thêm vào MH chính", máy tính); manifest có icon 192/512 + maskable, shortcut Thông báo/Tin nhắn; `appleWebApp`; liên kết ở trang đăng nhập và sidebar.
- **Tài liệu:** docs/01 (v3.4), 03, 05 (P2-44), 17 (DECISION-D31).

### Kiểm thử
- `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ **19 file / 115 test** (thêm `slugify`) · `pnpm build` ✓.
- **Thật trên DB + server bản build (31/31 đạt):** khóa HS → PH khóa theo, HS khác của PH không bị (một cấp), phiên PH bị thu hồi; mở khóa theo; khóa PH → 2 con; audit 10 dòng; lớp có HS không xóa được → hủy (3 buổi hủy kèm lý do, HS có thông báo, audit) → xóa được; phòng tạm ngừng; xóa cấp học chưa dùng / chặn cấp đang có môn; 15 trang quản lý + `/cai-ung-dung` trả 200 với nội dung mới; manifest đủ 4 icon. Dữ liệu "[Kiểm thử]" đã xóa (đếm lại = 0, không tài khoản demo nào bị khóa).
- **Chưa kiểm thử bằng trình duyệt thật:** cảm giác kéo trang trên điện thoại, lọc khi gõ, hộp thoại cài ứng dụng — PO thử trên máy.


## 2026-10-22 — Bổ sung theo yêu cầu PO (DECISION-D30): thao tác theo tài khoản, Excel, thông báo đẩy, chat kiểu Zalo, ảnh tự luận, ảnh đại diện

- **DB:** migration chỉ thêm `20261024090000_chat_files_push_avatar` (`stored_files.questionId/messageId`, `users.avatarFileId`, bảng `push_subscriptions`) — **đã áp lên Supabase** (`pnpm db:migrate`). docs/10 §5c.
- **Người dùng (FR-013):** cột "Thao tác" (Sửa · Hồ sơ HS/PH/GV · Đặt lại MK · Khóa/Mở khóa, không tự khóa) + bảng "Thao tác được phép theo vai trò" (`ROLE_CAPABILITIES` trong `policy.ts`, chỉ để hiển thị); trang chi tiết có thẻ thao tác của vai trò.
- **Xuất Excel (FR-052):** `/quan-ly/bao-cao/xuat` trả `.xlsx` (exceljs), thêm "Xuất Excel tất cả" (3 sheet). Cột %: công thức (`IF(C>0,(D+E)/C,"")`…), dòng Tổng dùng `SUM`/`SUMPRODUCT`, Excel tính lại khi mở. Gỡ xuất CSV.
- **Liên kết phụ huynh (FR-014):** ô gõ chữ lọc tên/SĐT/mã HS không dấu (`ComboboxField`, `lib/search.ts`) ở Học viên, hồ sơ HS, hồ sơ PH, và ô "Người nhận" tin nhắn.
- **Thông báo đẩy (FR-048):** `src/server/push/*`, `public/sw.js`, `app/manifest.ts`, nút bật/tắt/gửi thử ở `/thong-bao`. Mọi `notifyUsers` + tin nhắn mới đều đẩy; gửi bằng `after()` sau response và chỉ khi thông báo đã commit. Cần env `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (đã thêm vào `.env` dev; docs/14).
- **Tin nhắn (FR-050):** bố cục 2 cột kiểu Zalo, gửi ảnh (chụp/chọn/dán, tự thu nhỏ) và tệp, tin chỉ có tệp, gộp tin liên tiếp, danh sách thành viên nhóm lớp + "Nhắn riêng"; quy tắc 1-1 mới `messaging/rules.ts` (thay D29); tệp tin riêng chỉ người trong cuộc mở được; làm mới 4 giây.
- **Bài tự luận (FR-031):** mỗi câu ESSAY có "Chụp ảnh" (camera sau) / "Chọn ảnh/PDF" (≤ 6), gửi ngay không mất chữ đang gõ; nhắc khi nộp còn câu tự luận trống; nộp bài cần chấm → GV nhận thông báo; GV thấy ảnh đúng câu khi chấm; HS xem lại sau công bố.
- **Ảnh đại diện (FR-051):** đổi/chụp/gỡ ở `/tai-khoan`, hiện ở sidebar, tin nhắn, danh sách thành viên.
- **Tài liệu:** docs/00, 01 (v3.3), 03, 05 (P2-03/18/27/39 cập nhật, thêm P2-42, P2-43), 10 §5c, 14, 17 (DECISION-D30, D29 bị thay).

### Kiểm thử
- `pnpm typecheck` ✓ · `pnpm lint` ✓ (0 lỗi, 0 cảnh báo) · `pnpm test` ✓ **19 file / 114 test** (mới: `messaging/rules.test.ts`, `lib/search.test.ts`, test Excel trong `reports.test.ts`, `formatChatTime`) · `pnpm build` ✓.
- **Kiểm thử thật trên DB + server bản build (48/48 đạt):** quy tắc nhắn riêng (HS1↔HS2, HS1↔GV, HS1↔PH1 được; HS1↔PH2 bị chặn), tin + ảnh, Admin mở ảnh tin riêng qua `/tep` → 404, nhóm lớp có thành viên và nút nhắn riêng đúng quyền, GV Văn vào nhóm Toán → 404; bài tự luận: tải 2 ảnh, câu MCQ không nhận ảnh, PH1 xem được/PH2 & HS2 → 404, nộp → GV có thông báo, không tải thêm sau nộp, GV thấy 2 ảnh, chấm 8,5 + 2 = 10,5; ảnh đại diện đổi/xóa tệp cũ; lưu/chuyển/tắt đăng ký đẩy; 11 trang trả 200 có nội dung mới; xuất Excel tất cả là `.xlsx` hợp lệ, HS gọi route xuất → 404; `sw.js`/manifest phục vụ được. Dữ liệu "[Kiểm thử]" đã xóa (đếm lại = 0).
- **Chưa kiểm thử:** nhận thông báo đẩy thật trên trình duyệt/điện thoại (cần bấm cho phép trên thiết bị thật) và thao tác giao diện bằng tay (ô gõ tìm, chụp ảnh bằng camera, dán ảnh) — PO thử trên điện thoại.

### Việc PO
1. Vercel → Environment Variables: thêm `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (lấy giá trị trong `.env` dev hoặc sinh cặp mới), rồi redeploy (khóa công khai nhúng lúc build).
2. iPhone: mở web bằng Safari → Chia sẻ → "Thêm vào MH chính", mở từ màn hình chính rồi bật thông báo.
3. Review, commit, push (trợ lý không commit).

## 2026-10-22 — Cập nhật Banner siêu nét, Dữ liệu Giáo viên chính thức, Thông tin liên hệ và Tối ưu Header công khai
- **Yêu cầu & Mục tiêu:**
  1. Thay banner chính thức mới và tăng độ phân giải/độ nét để hiển thị sắc nét trên mọi loại màn hình.
  2. Quét thông tin và ảnh giáo viên từ các poster chính thức để hoàn thiện mục "Đội ngũ giáo viên" trên trang chủ (thay thế hoàn toàn dữ liệu placeholder).
  3. Bổ sung thông tin liên hệ chính thức: Lô AL2-IC-04 Vinhomes Smart City, email `corelinkacademyvsc@gmail.com`, hotline `035 633 1603`.
  4. Khắc phục thanh TopBar thừa ở đỉnh trang giao diện, loại bỏ việc trùng lặp 2 nút Đăng nhập và 2 nút Đăng ký học thử.
- **Nội dung thực hiện chi tiết:**
  1. **Nâng cấp Banner (`public/brand/banner.png`, `src/components/home/hero-banner.tsx`):**
     - Xử lý ảnh gốc, upscale lên 2560x975 với thuật toán nội suy Lanczos cao cấp và bộ lọc Unsharp Mask, tăng cường độ tương phản và viền chữ.
     - Khóa tỉ lệ `aspect-[2560/975]` chuẩn xác với ảnh thực tế, đặt `quality={95}`.
     - Giảm chiều cao dải gradient fade chân banner (`h-10 sm:h-14`), gỡ overlay tối bên trái, giữ trọn vẹn độ rõ nét của chữ "TIỀN TIỂU HỌC - TIỂU HỌC - THCS - THPT" và logo vòm cầu.
  2. **Quét dữ liệu & Cập nhật Đội ngũ Giáo viên (`src/data/home.ts`, `src/components/home/teachers.tsx`):**
     - Bổ sung thông tin đầy đủ, chính xác quét từ poster cho 2 giáo viên tiêu biểu:
       - **Cô giáo Nguyễn Thanh Hải:** Môn Ngữ văn, Giáo viên Ngữ văn Trường THPT Chuyên Hà Nội – Amsterdam, chuyên gia bồi dưỡng học sinh giỏi và luyện thi vào 10/THPT Quốc gia.
       - **Cô giáo Trần Hà Nhi:** Môn Tiếng Anh, Giảng viên Cao đẳng Công Thương Hà Nội, ThS PP Giảng dạy Tiếng Anh ULIS – ĐHQGHN, Cử nhân ĐH Sư phạm Hà Nội, C1 Aptis Advanced Hội đồng Anh, Giám khảo Tranh biện VSDC 2025 & Sunshine School S-Voice 2025.
     - Tạo chân dung đại diện tối ưu (`co-nguyen-thanh-hai.jpg`, `co-tran-ha-nhi.jpg`) và lưu poster gốc độ phân giải cao (`poster-*.jpg`).
     - Thiết kế lại thẻ giáo viên: hiển thị huy hiệu môn học, trường công tác, danh sách thành tích nổi bật có icon ngôi sao, tích hợp **Modal Lightbox xem poster chính thức** khi click vào ảnh hoặc nút "Xem poster chính thức".
  3. **Đồng bộ Thông tin Liên hệ (`src/data/site.ts`):**
     - Cập nhật địa chỉ `Lô AL2-IC-04 Vinhomes Smart City`.
     - Cập nhật email `corelinkacademyvsc@gmail.com`.
     - Cập nhật số điện thoại & Zalo `035 633 1603`.
     - Tự động đồng bộ toàn bộ Footer, bản đồ Google Maps embed, form đăng ký học thử và các nút gọi điện/Zalo nổi một chạm.
  4. **Tối ưu Thanh điều hướng (`src/components/layout/public-shell.tsx`):**
     - Loại bỏ component `TopBar` khỏi `PublicShell`. Header công khai giờ đây bắt đầu trực tiếp với thanh điều hướng chính, logo, menu và đúng 1 nút "Đăng nhập" + 1 nút "Đăng ký học thử", giải phóng không gian đỉnh trang và mang lại diện mạo hiện đại, tinh tế.
- **Kiểm thử chất lượng:**
  - `pnpm typecheck` (tsc --noEmit): Exit code 0 ✓
  - `pnpm lint` (eslint .): Exit code 0 ✓
  - `pnpm test` (vitest run): 17 file / 103 test pass 100% ✓
  - `pnpm build` (next build): Biên dịch thành công toàn bộ 47 routes ✓


## 2026-10-22 — Thiết kế lại toàn bộ giao diện "Academic Premium WOW" đồng bộ từ Công khai đến 4 Cổng Nội bộ
- **Yêu cầu & Mục tiêu:** Nâng tầm toàn diện trải nghiệm thị giác và tương tác (visual & micro-interaction) mang phong cách "Academic Premium WOW", bao phủ toàn bộ hệ thống từ trang công khai (Trang chủ, Khóa học, Đăng ký học thử), trang xác thực (Đăng nhập, Đổi mật khẩu) đến toàn bộ 4 Cổng nghiệp vụ nội bộ (Quản lý, Giảng viên, Học sinh, Phụ huynh) và các trang hệ thống (Tài khoản, 404 Not Found).
- **Các thành phần & Giao diện nâng cấp:**
  1. **Hệ thống Design Tokens & CSS Utilities (`src/app/globals.css`):**
     - Bổ sung hiệu ứng cao cấp: `.glow-card`, `.stat-card-premium`, `.glass-card-dark`, `.glass-card-light`, `.glass-card-elevated`, `.btn-shimmer`, `.pulse-ring`, thanh cuộn mảnh thanh lịch `.custom-scrollbar`.
     - Phối màu Sapphire Royal (`#09103a` đến `#1f2f98`), vàng ánh kim (`amber-400`), viền kính đa lớp mờ (`border-white/10`, `border-white/20`), đổ bóng ambient nhiều tầng (`shadow-soft-xl`, `shadow-glow-primary`).
  2. **Khung giao diện Cổng & Điều hướng (`src/components/layout/app-shell.tsx`):**
     - Nâng cấp Sidebar desktop: Nền gradient Sapphire hoàng gia, dải trang trí vòm cầu sáng, phân tách nhóm rành mạch, pill điều hướng active có chấm đèn phát quang (`pulse-ring`), thanh người dùng dính chân sidebar tích hợp avatar nổi bật, huy hiệu vai trò, menu thao tác nhanh (Hồ sơ, Đổi MK, Đăng xuất).
     - Thanh Header di động: Kính mờ siêu nét, nút chuông thông báo có pulse badge, drawer di động bo góc mượt mà.
  3. **Trang Đăng nhập Trải nghiệm Showcase (`src/app/(public)/dang-nhap/page.tsx`, `login-form.tsx`):**
     - Bố cục 2 cột: Cột trái giới thiệu chuẩn mực học viện & huy hiệu bảo mật; Cột phải tích hợp bộ **Chuyển đổi 1-Chạm Tài khoản Demo** (Admin, Giáo vụ, Giáo viên, Học sinh, Phụ huynh) tự động điền email và mật khẩu mẫu, có nút ẩn/hiện mật khẩu trực quan.
  4. **Cổng Quản lý / Ban giám hiệu (`src/app/quan-ly/page.tsx`):**
     - WelcomeBanner động theo buổi trong ngày (Sáng/Chiều/Tối) kèm lối tắt tác vụ nhanh 1 chạm (Nhập lead, Mở lớp, Lịch tổng, Báo cáo).
     - Bento Grid 6 thẻ KPI với đồ họa vi mô, chỉ số tăng trưởng, cảnh báo đỏ nhấp nháy cho học sinh vắng.
  5. **Cổng Giảng viên (`src/app/giao-vien/page.tsx`):**
     - Lịch dạy hôm nay dạng thẻ sự kiện cao cấp: đếm giờ, phòng học, mã môn học, nút "Điểm danh ngay" nổi bật.
     - Hàng đợi chấm bài: danh sách bài tập chưa chấm, thông tin học sinh & lớp học, đếm ngày nộp, CTA "Chấm điểm ngay".
  6. **Cổng Học sinh (`src/app/hoc-sinh/page.tsx`):**
     - Hub học tập tràn đầy năng lượng: Thẻ lớp học sắp tới (thời gian, phòng học, giáo viên phụ trách), danh sách bài tập cần nộp kèm thời hạn chót & nút "Làm bài ngay", bảng tổng hợp bài nộp đã có điểm.
  7. **Cổng Phụ huynh (`src/app/phu-huynh/page.tsx`, `src/components/learner/child-picker.tsx`):**
     - Bộ chọn con em `ChildPicker` thiết kế dạng thẻ định danh sang trọng kèm mã học sinh và khối lớp.
     - Thẻ danh tính học sinh, thời khóa biểu các lớp con đang học trong tuần, theo dõi chuyên cần và kết quả bài tập trực quan.
  8. **Danh mục Khóa học & Đăng ký học thử (`src/app/(public)/khoa-hoc/page.tsx`, `course-card.tsx`, `src/app/(public)/dang-ky-hoc-thu/page.tsx`):**
     - `CourseCard` với badge môn gradient, tag khối lớp, thời lượng kèm icon đồng hồ, học phí định dạng VND chuẩn và hover lift card.
     - Hero header danh mục khóa học với thanh lọc nhanh bộ môn (Toán, Văn, Anh, Lý, Hóa, Tin).
     - Form Đăng ký học thử hiện đại với cam kết bảo mật & tư vấn 24/7.
  9. **Trang bổ trợ:**
     - Đổi mật khẩu (`/doi-mat-khau`), Tài khoản cá nhân (`/tai-khoan`), Báo lỗi 404 (`/not-found`) đồng bộ nhận diện thương hiệu.
- **Kiểm tra chất lượng:** `tsc --noEmit` hoàn tất không lỗi (exit code 0), `next build` hoàn tất tối ưu hóa toàn bộ 47 routes.

## 2026-10-22 — Sửa hiển thị Logo thành Ô vuông Bo tròn chuẩn tỉ lệ (Aspect-Square)
- **Nguyên nhân lỗi biến dạng logo hình viên thuốc (pill):** Trên màn hình nhỏ/mobile, component `Brand` nằm trong container flexbox nhưng thẻ `div` bọc ảnh logo trước đây thiếu `shrink-0` và `aspect-square`. Khi không gian ngang bị nén, phần chữ "CORE LINK" có `whitespace-nowrap` nên trình duyệt đã ép co chiều ngang của khung ảnh (chỉ còn ~20px trong khi chiều dọc 44px), khiến bo góc biến logo thành hình viên thuốc dọc bị bẹp ngang.
- **Khắc phục toàn diện:**
  - `src/components/layout/brand.tsx`: Cố định khung logo thành ô vuông hoàn hảo `size-11 shrink-0 aspect-square overflow-hidden rounded-xl`, ảnh hiển thị `size-full object-cover`. Đồng thời bổ sung viền thích ứng `ring-1 ring-white/25` cho nền tối (`tone="light"` ở Footer & Sidebar) và `ring-primary/20` cho nền sáng, giúp khối bo tròn sắc nét và tách biệt rõ ràng khỏi màu nền.
  - `src/app/(public)/dang-nhap/page.tsx`: Chuyển logo từ ô vuông sắc cạnh sang ô vuông bo tròn cao cấp `size-20 sm:size-24 shrink-0 aspect-square rounded-2xl ring-1 ring-primary/20 shadow-md`.
  - `src/components/home/register-form.tsx`: Khóa cứng khung bo tròn `size-16 shrink-0 aspect-square rounded-2xl ring-1 ring-white/30 shadow-md`.
- **Kiểm tra:** `tsc --noEmit` ✓, `eslint .` ✓ (0 errors, exit code 0).

## 2026-10-22 — Tối ưu giao diện Đăng nhập & Dọn dẹp Source Control
- **Giao diện Đăng nhập:** Gộp layout 2 cột tách biệt thành **1 Card Đăng nhập trung tâm duy nhất** (`src/app/(public)/dang-nhap/page.tsx`), tích hợp logo học viện, dải gradient trang trí, form tinh gọn, và nút **Đăng nhập** nổi bật có icon `LogIn` (`login-form.tsx`).
- **Thanh điều hướng:** Thêm nút hành động **Đăng nhập** trực tiếp trên Header (`src/components/home/header.tsx`) cạnh nút "Đăng ký học thử" (cả trên Desktop và Menu Drawer Mobile). Gộp 3 liên kết trùng lặp trên TopBar thành 1 liên kết "Cổng học viện & Đăng nhập" đồng nhất.
- **Dọn dẹp Source Control:** Phát hiện và xóa thư mục `.git` thừa vô tình khởi tạo ở thư mục máy cá nhân `C:\Users\TUYEN`, loại bỏ hoàn toàn hiển thị nhánh `TUYEN master*+` gây nhầm lẫn trên IDE.
- **Kiểm tra:** `tsc --noEmit` hoàn tất không lỗi (exit code 0).

## 2026-10-21 (tối) — Bổ sung chức năng theo 4 file của PO (FR-036..FR-052, DECISION-D26) + giao diện cổng

### Bước 1 — Kiểm kê
35 FR v3 đã chạy (công khai/tuyển sinh, tài khoản, đào tạo, điểm danh, bài tập/chấm, cổng + audit). Đối chiếu 4 file PO (Admin.md, Giáo viên.md, Phụ huynh.md, Bảng phân loại ưu tiên demo.md): thiếu nộp bài bằng tệp/ảnh, hồ sơ GV/HS/PH, sửa lớp/dạy thay/học bù/lịch tổng, cấp học, giáo trình–tài liệu, đề xuất đổi lịch, đơn xin nghỉ, thông báo, đánh giá định kỳ, nhắn tin, báo cáo. PO chốt: trợ lý được chạy migration chỉ-thêm; tệp lưu trong Postgres (D24); đơn nghỉ do GV lớp hoặc giáo vụ duyệt (D25).

### Bước 2 — Đã làm
- **DB:** migration `20261023090000_portal_features` (14 bảng mới + cột mới, có mặc định; 4 cấp học khởi tạo) và `20261022090000_admin_perf_indexes` — **đã áp lên Supabase** (`pnpm db:migrate`, PO đồng ý). Chi tiết docs/10 §5b.
- **Tệp:** `src/server/files/*` (kiểm tra loại/dung lượng, `stored_files` + `file_blobs`), route `/tep/[id]` kiểm tra quyền theo chủ sở hữu, `Content-Security-Policy: sandbox`.
- **Bài tập (FR-040/041):** bài nhận tệp/ảnh, tệp đề, bài không câu hỏi chấm điểm tổng, xóa bài, nhắc nộp; điểm tối đa qua `assignmentMaxScore`.
- **Quản lý (FR-036..038):** trang Giáo viên, Phụ huynh, hồ sơ Học sinh (chuyển/gỡ lớp, phụ huynh, chuyên cần, kết quả, đánh giá), nhập HS hàng loạt, sửa lớp/đổi GV-phòng, dạy thay từng buổi, học bù, lịch tổng lọc GV/phòng/lớp, Môn & cấp học, phòng tạm ngừng.
- **HS/PH (FR-039, 044, 045):** chi tiết buổi học, đơn xin nghỉ (duyệt → "Có phép"), bài tập của con, lớp con đang học.
- **GV (FR-043, 046, 049):** đề xuất đổi lịch, duyệt đơn nghỉ, hồ sơ HS lớp mình, đánh giá định kỳ kèm tổng hợp chuyên cần/điểm.
- **Chung (FR-042, 047, 048, 050, 051, 052):** giáo trình–tài liệu–giáo án (chia sẻ theo lớp), thông báo + chuông chưa đọc, nhắn tin (nhóm lớp + 1-1, tự làm mới), tài khoản cá nhân, báo cáo + xuất CSV.
- **Tài liệu:** docs/00, 01 (v3.2), 03, 05 (P2-32..P2-41), 08, 10, 17 (D24..D29).

### Kiểm thử
- `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ **17 file / 103 test** (mới: `files/rules.test.ts`, `users/import.test.ts`, `reports/reports.test.ts`, bổ sung `grading.test.ts`).
- **E2E trên Chrome headless + DB thật** (4 vai trò): GV tạo bài nhận tệp + tệp đề → giao → HS bị chặn nộp khi chưa có tệp → tải ảnh, nộp → GV nhắc nộp, chấm 8,5/10, công bố → HS/PH thấy điểm + thông báo, PH tải được ảnh bài làm của con → PH gửi đơn nghỉ → GV Toán duyệt → buổi "Có phép" + PH nhận thông báo → GV đề xuất nghỉ → Admin từ chối → Admin: lịch tổng, giáo viên, phụ huynh, hồ sơ HS, báo cáo, CSV 200 text/csv → thông báo lớp → tài liệu chia sẻ lớp → tin nhắn Admin↔GV, nhóm lớp HS/PH. Truy cập chéo: HS lớp khác mở tài liệu/tệp bài làm → 404; PH2 xem con PH1, GV Văn xem HS lớp Anh → trang "Không tìm thấy" (soft 404 do `loading.tsx` stream trước, không lộ dữ liệu). **Tất cả pass.**
- **Lỗi thật E2E tìm ra và đã sửa:** thông báo thành công nằm trong form nên biến mất khi form ẩn sau thao tác (gửi đơn nghỉ, duyệt/từ chối đơn & đề xuất, giao/đóng bài, công bố) → chuyển trang + Flash.
- Dữ liệu kiểm thử (nhãn "[Kiểm thử]") đã xóa sau mỗi lượt; audit log giữ nguyên (chỉ thêm, NFR-011).

### Bước 3 — Giao diện cổng
Banner chào theo vai trò (lời chào theo giờ, ngày VN, vòm cầu logo), thẻ số liệu có icon xuất hiện lần lượt, menu có icon + nhóm mục (quản lý), thanh đáy điện thoại icon + chữ, hiệu ứng vào trang (`template.tsx` + `.animate-rise`, tắt khi giảm chuyển động), khóa học xuất hiện lần lượt, nút "Đăng ký học thử" dính đáy trên điện thoại ở trang chi tiết khóa. docs/08 §5b.

### Việc PO
1. Review và commit/push (trợ lý không commit).
2. Xác nhận DECISION-D27 (tin nhắn không realtime), D28 (thông báo fan-out lúc gửi), D29 (chưa mở nhắn 1-1 GV↔HS).
3. Vercel: dung lượng tệp ≤ 4 MB/lần (giới hạn body) — muốn tệp lớn hơn thì chuyển Supabase Storage (P2).
4. Các mục "Giả định – cần xác nhận" trong file PO đang ở docs/05 P2-32..P2-41.

---

## 2026-10-21 — Production chậm: Vercel Functions chạy ở Mỹ, DB ở Singapore

- Đo `core-link-academy.vercel.app`: `X-Vercel-Id: hkg1::iad1::…` (function ở `iad1`), `/khoa-hoc` TTFB 1,45–1,70 s, `/dang-nhap` 0,37–0,64 s.
- Thêm `vercel.json` `"regions": ["sin1"]` (cùng region Supabase `ap-southeast-1`); ghi docs/14 §2. **Chưa đo lại** — cần push + redeploy.
- Việc PO: push; trên Vercel đặt `DATABASE_URL` có `connection_limit=3`; chạy `pnpm db:migrate` nếu chưa.


Ghi theo phiên, mới nhất ở trên. Kết quả lệnh là output thực tế, không ước lượng.

## 2026-10-22 — Rà soát và tối ưu Backend khu quản lý (DECISION-D23, chờ PO xác nhận)

### Phát hiện chính
Dữ liệu dev còn rất nhỏ (2 lead, 15 user, 3 lớp, 80 buổi) nhưng mỗi round-trip tới Supabase ~250 ms → thời gian phản hồi gần như hoàn toàn do **số query tuần tự**. Hai nguyên nhân lớn nhất: `.env` đặt `connection_limit=1` (Promise.all chạy nối tiếp) và Prisma tải mỗi quan hệ `include` bằng một query riêng.

### Đã làm
- Prisma `previewFeatures = ["relationJoins"]`: mỗi lệnh đọc có quan hệ = 1 câu SQL. Kiểm chứng: dump kết quả 18 nhóm service (135 KB JSON) với chiến lược cũ và mới → **giống hệt từng byte**.
- Tổng quan: đếm lead 2→1 query (`FILTER`), đếm lớp 2→1 (`groupBy`), cảnh báo vắng 4→1 query (`ROW_NUMBER`), số liệu được cache (tag `dashboard`, TTL 60/300 s, vô hiệu ở mọi action ghi lead/lớp). Cảnh báo vắng: đối chiếu cách cũ trên dữ liệu thật — cùng 1 cảnh báo, cùng 6 buổi được chọn; thứ tự hiển thị nay theo mã lớp, tên học sinh.
- Danh sách môn cache (tag `subjects`, vô hiệu khi lưu/xóa môn/khóa) — bỏ 1 round-trip ở `/quan-ly/lead`, `/khoa-hoc`, form học thử.
- Rate limit: BEGIN + SELECT FOR UPDATE + upsert + COMMIT (4 round-trip) → một `INSERT … ON CONFLICT` nguyên tử; kiểm chứng trên Postgres thật trong transaction rollback (4 lần, max 3 → `[true,true,true,false]`, reset sau cửa sổ, DB không đổi).
- Đăng nhập: bỏ `UPDATE` thừa khi bộ đếm sai đã 0; tạo phiên ∥ dọn phiên hết hạn ∥ dọn bucket cũ.
- Điểm danh: một upsert/học sinh → `createMany` + `updateMany` gộp nhóm (`planAttendanceWrites`, 3 unit test); dự phòng upsert khi điểm danh đồng thời.
- Chuyển lead: 4 kiểm tra trùng SĐT/email tuần tự → 1 query. Ghi chú lead: 3 query không transaction → 1 lệnh lồng nguyên tử.
- Lỗi logic: xóa lớp có thể cascade mất ghi danh vừa thêm (race) → khóa dòng `FOR UPDATE` trong transaction; xóa môn/khóa/phòng đồng thời với thao tác tham chiếu trả 500 → bắt `P2003` thành thông báo thân thiện.
- Audit thêm: `class.delete`, `course.delete`, `subject.delete`, `room.delete`, `guardian.link`, `guardian.unlink`.
- Phân trang danh sách lớp quản lý (`listClassesPage`, 50/trang); `listClasses` giữ nguyên cho trang giáo viên.
- Index mới: migration `prisma/migrations/20261022090000_admin_perf_indexes` (sinh offline bằng `prisma migrate diff`) — **chưa chạy trên DB**.
- Log `[db] CHẬM` cho query ≥ `SLOW_QUERY_MS` (300 ms); `Cache-Control` 1 ngày cho `/brand/*`; `pnpm bench:admin` (chỉ đọc).

### Trước / sau (`pnpm bench:admin`, median 7 lần, ms; RTT ~230–255 ms; ca "Tổng quan" và "Danh sách lead" đo phần query KHÔNG qua cache)
| Ca | Trước, limit=1 | Sau, limit=1 | Trước, limit=5 | Sau, limit=5 |
|---|---|---|---|---|
| Tổng quan `/quan-ly` | 1706 | 888 | 707 | 321 |
| Danh sách lead (môn + trang 1) | 849 | 782 | 613 | 455 |
| Tìm lead theo tên | 489 | 527 | 269 | 229 |
| Chi tiết lead | 439 | 235 | 478 | 226 |
| Danh sách lớp | 540 | 907 | 736 | 223 |
| Chi tiết lớp | 1330 | 226 | 1391 | 229 |
| Học viên | 1224 | 650 | 675 | 225 |
| Người dùng | 488 | 426 | 260 | 219 |
| Nhật ký | 484 | 429 | 265 | 219 |

Ghi chú trung thực: với `limit=1` danh sách lớp chậm hơn vì phân trang thêm một query đếm chạy nối tiếp; "Tìm lead" chênh trong biên nhiễu (p90 dao động tới 1,5 s). Sau tối ưu + `limit=5` mọi ca ≈ 1 round-trip.

### Kết quả lệnh
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` / `pnpm lint` | Pass / Pass |
| `pnpm test` | 14 file, **79/79** pass (thêm 3 test `planAttendanceWrites`) |
| `pnpm build` | Pass |
| `next start` smoke | `/`, `/khoa-hoc`, `/dang-ky-hoc-thu`, `/dang-nhap` 200; `/quan-ly` 307 khi chưa đăng nhập; `/khoa-hoc` lần 2 nhanh hơn (cache môn); gzip bật; `/brand/logo.png` có `max-age=86400` |
| Integration test (`test:integration`) | **Chưa chạy** — không có `TEST_DATABASE_URL`, máy không có Postgres/Docker |
| Đăng nhập thật + thao tác ghi trong trình duyệt | **Chưa làm** |

### Cần PO làm
1. `pnpm db:migrate` để tạo index.
2. Sửa `.env`: `connection_limit=1` → `5` (dev); trên Vercel đặt `3`.
3. Xác nhận DECISION-D23.

---

## 2026-10-21 (phiên 3, tiếp) — Làm lại trang chủ theo mô tả của PO (DECISION-D22)

### Đã làm
- **Phụ thuộc mới:** `framer-motion`, `lucide-react` (`pnpm add`).
- **Token/font:** `globals.css` đổi sang `#1F2F98` / `#121C5E` / `#2F6BFF` / `#F5F7FE` / `#0E1433` / `#4A5274`; font wordmark chuyển Source Serif 4 → Lora; thêm keyframes `pulse-ring`. `#2F6BFF` trên nền sáng chỉ 4,20:1 nên chỉ dùng cho nền/gạch chân (docs/08 §4.1).
- **Khung công khai:** `PublicShell` dựng lại (TopBar, Header mega-menu + panel di động, Footer có bản đồ, nút nổi Zalo/Gọi/Lên đầu trang), `MotionConfig reducedMotion="user"`. Trang chủ chuyển sang route group `src/app/(home)/` dùng `PublicShell bare` để các khối tràn viền; các trang công khai khác giữ khung 1120px.
- **Component** `src/components/home/*`: top-bar, header, hero-banner (Ken Burns), quick-access, stats (đếm số), programs (tab `layoutId` + `AnimatePresence`), why-us, teachers, marquee, news-and-stars (modal Esc/click ngoài/focus), register-form, footer, floating-buttons, motion (Reveal/Stagger/CountUp).
- **Dữ liệu tách riêng:** `src/data/home.ts`, `nav.ts`, `site.ts` (thông tin liên hệ placeholder).
- **Form học thử trang chủ:** `submitHomeTrialAction` (`src/server/leads/actions.ts`) dùng lại `trialRequestSchema`, rate limit, honeypot, `submitTrialRequest`; cho chọn nhiều môn (môn đầu là môn chính, còn lại vào ghi chú), "Tiền tiểu học" lưu là lớp 1 + ghi chú; trả `ok: true` để hiện màn hình cảm ơn tại chỗ. Giữ ô đồng ý liên hệ (bắt buộc theo FR-004) dù mô tả không liệt kê.
- **Tài liệu:** D22 + cập nhật Q12 (docs/17), FR-001 (docs/01), docs/08 (token, ngoại lệ, SCREEN-001), P2-23..25 (docs/05), font (docs/02, 20).

### Lệch so với mô tả — cần PO biết
- Ảnh thật là `/brand/logo.png` (1000×1000) và `/brand/banner.png` (**1024×390**, không phải 1640×626) nên banner sẽ hơi mờ trên màn hình rộng; cần ảnh gốc lớn hơn.
- Các mục menu chưa có trang riêng trỏ về khối trên trang chủ hoặc `/khoa-hoc` (không liên kết chết); nút tìm kiếm dẫn tới `/khoa-hoc`; "Tra cứu kết quả", "Cổng học viên/phụ huynh" dẫn tới `/dang-nhap`.
- Tin tức, giáo viên, học viên tiêu biểu là dữ liệu mẫu/placeholder trong `src/data/home.ts`; ngày tin là mẫu.
- Trang chủ không còn đọc DB (khóa nổi bật) — FR-001 đã điều chỉnh.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi |
| `pnpm test` | 14 file, **76/76** pass |
| `pnpm build` | Pass |
| Smoke `next start`: `/`, `/khoa-hoc`, `/dang-ky-hoc-thu`, `/dang-nhap` | HTTP 200; HTML trang chủ có đủ các khối chính |
| Kiểm tra bằng mắt (trình duyệt, 360px/desktop), gửi form thật vào DB | **Chưa làm** — cần người dùng chạy `pnpm dev` xem thử |

---

## 2026-10-21 (phiên 3, tiếp) — Redesign giao diện trang web với Banner & Logo chính thức + Animation động

### Đã làm
- **Tài sản hình ảnh thương hiệu**: Lưu 2 ảnh PO cung cấp thành `/brand/banner.png` (435 KB) và `/brand/logo.png` (372 KB); đồng bộ `src/app/icon.png` và `apple-icon.png` theo logo chính thức.
- **Hệ thống Animation & CSS Tokens (`src/app/globals.css`)**:
  - Keyframes: `float-gentle`, `float-gentle-delayed`, `pulse-subtle`, `shimmer-sweep`.
  - Utility classes: `.animate-float`, `.animate-float-delayed`, `.animate-pulse-subtle`, `.card-interactive` (elevation + border glow khi hover), `.btn-shimmer` (vệt sáng lướt qua nút CTA), `.banner-glow-frame` (viền hào quang xanh đa tầng bao quanh banner).
  - Tuân thủ WCAG 2.1 AA: `@media (prefers-reduced-motion: reduce)` tắt toàn bộ chuyển động khi người dùng yêu cầu.
- **Redesign Header & Shell (`src/components/layout/public-shell.tsx`, `brand.tsx`)**:
  - Thanh thông báo tuyển sinh đầu trang với đèn chớp ping xanh ngọc (`animate-ping`).
  - Header kính mờ dính (`sticky`, `backdrop-blur-md`, `bg-surface/90`, viền `border-line/80`).
  - Component `Brand`: hiệu ứng hover phóng to nhẹ (`group-hover:scale-105`), bóng đổ mềm, viền sáng và ánh kim trên logo.
  - Chân trang gradient thương hiệu (`#142170` → `#0B1348`), họa tiết vòm cầu `BridgeArc` phát sáng nhẹ, 3 khối nội dung và liên kết Fanpage.
- **Redesign Trang Chủ (`src/app/(public)/page.tsx`)**:
  - **Hero Showcase**: Trưng bày banner chính thức khổ lớn với khung ánh sáng `banner-glow-frame`, 2 huy hiệu kính mờ bay lơ lửng (`animate-float`) thể hiện "10+ Năm Kinh Nghiệm" và "Sĩ Số 7–12 HS/Lớp".
  - **Tứ Trụ Chất Lượng**: 4 card tương tác trực tiếp lấy từ nội dung cốt lõi của banner (10+ năm kinh nghiệm, 7–12 học sinh/lớp, Cam kết chất lượng đầu ra, Đào tạo liên cấp Tiền TH – THPT).
  - **Lưới Môn Học**: Bộ icon SVG riêng biệt cho 6 môn (Toán, Văn, Anh, Lý, Hóa, Tin) trong `src/components/catalog/subject-icons.tsx`, card tương tác lướt chuột nổi bật.
  - **Khóa Học Nổi Bật**: Card khóa học cải tiến với hiệu ứng nổi `card-interactive` và mũi tên trượt.
  - **Hệ Sinh Thái Cổng Số**: Giới thiệu 3 cổng chuyên biệt (Phụ huynh, Học sinh, Giáo viên) với thông tin minh bạch.
  - **Quy Trình 3 Bước**: Lộ trình đánh số có vòng tròn gradient tỏa sáng.
  - **CTA Banner Cuối Trang**: Nền gradient xanh thương hiệu, họa tiết vòm cầu và nút shimmer nổi bật.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi, 0 cảnh báo |
| `pnpm test` | 14 file, **76/76** pass |
| `pnpm build` | Pass, 39 route |
| Smoke HTTP server dev | `/`, `/khoa-hoc`, `/dang-ky-hoc-thu`, `/dang-nhap` đều trả về HTTP **200** |
| Static assets | `/brand/logo.png` (200), `/brand/banner.png` (200) |

---

## 2026-10-21 (phiên 3, tiếp) — Giao diện theo nhận diện thương hiệu (DECISION-D21)

### Đã làm
- Đo màu từ logo + banner chính thức (System.Drawing): `#1C2D95` (nền logo/banner), `#1D46D4` (ô nhấn), `#D7E6FF` (nền ô "Cam kết"). Facebook chặn khi chưa đăng nhập → không đọc được trang, chỉ dùng 2 ảnh PO gửi.
- Token mới trong `globals.css`; mọi cặp chữ/nền ≥ 4,5:1, viền ô nhập 3,58:1 (đo bằng công thức WCAG — docs/08 §4.1).
- Logo `public/brand/logo.png`, favicon `src/app/icon.png` (512) + `apple-icon.png` (180); component `Brand` + họa tiết `BridgeArc` (`components/layout/brand.tsx`).
- Áp cho mọi khu: header/footer công khai (footer nền xanh, liên kết Facebook), trang chủ (khối giới thiệu nền xanh + ô nhấn kiểu banner, chỉ dùng dữ liệu thật), thẻ khóa học, chi tiết khóa, đăng nhập (khối logo), đổi mật khẩu, 404, sidebar/thanh trên nội bộ nền xanh cho Quản lý/GV/HS/PH, thanh đáy điện thoại, nút (`inverse`, `outline-inverse`, secondary viền xanh), tiêu đề trang màu thương hiệu.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` | Pass · Pass · 76/76 · Pass (thêm route `/icon.png`, `/apple-icon.png`) |
| Smoke `next start` + Supabase | `/`, `/khoa-hoc`, chi tiết khóa, `/dang-ky-hoc-thu`, `/dang-nhap` 200 và có logo/wordmark; `/brand/logo.png`, `/icon.png` 200; URL lạ 404 |

### Chưa kiểm
- **Chưa xem trực quan** (không có trình duyệt trong phiên): cần PO mở thử ở 360px và desktop, nhất là các trang nội bộ sau đăng nhập.
- QUESTION-Q12: nội dung banner (Toán–Văn–Anh, 7–12 HS/lớp, 10+ năm) khác phạm vi hiện tại — chưa đưa lên web.

## 2026-10-21 (phiên 3, tiếp) — Chuyển sang PostgreSQL/Supabase (ADR-005, DECISION-D20)

### Lý do
Vercel `core-link-academy.vercel.app` trả 500 ở trang đọc DB (`/`), `/dang-nhap` vẫn 200 → `DATABASE_URL` trỏ MySQL local, Vercel không với tới.

### Đã làm
- `schema.prisma` → `postgresql` + `directUrl`; `TinyInt` → `SmallInt`. Migration mới `20261021100000_init` (373 dòng, 11 enum + 18 bảng); migration MySQL cũ chuyển sang `prisma/migrations-mysql-archive/`.
- SQL thô `FOR UPDATE` đổi cú pháp PostgreSQL (`limiter.ts`, `enrollment.ts`, `users/service.ts`); tìm kiếm `contains` thêm `mode: "insensitive"`.
- `.env.example` (mẫu, không có mật khẩu thật), `.env` mới cho Supabase (bản cũ lưu `.env.mysql.bak`, đều bị ignore), `scripts/check-db.mjs` thông báo theo Supabase, `src/test/integration-setup.ts` chặn trỏ trùng DB.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm db:migrate` (Supabase) | Applied `20261021100000_init` |
| `pnpm db:seed` (Supabase) | 6 môn, 8 khóa, 3 phòng, 15 tài khoản demo, 3 lớp + buổi, điểm danh, bài tập |
| `pnpm db:check` | Pass |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` | Pass · Pass · 76/76 · Pass |
| Smoke `next start` + Supabase | `/` 200, `/khoa-hoc` 200, `/khoa-hoc/toan-9-on-thi-vao-10` 200 (có dữ liệu), khóa ẩn 404 |

### Còn lại
- Chủ dự án: thêm `DATABASE_URL`, `DIRECT_URL`, `APP_URL` trên Vercel (Project → Settings → Environment Variables), commit + push, Redeploy.
- Dev và production đang dùng chung một DB Supabase (RISK-013). Mật khẩu DB trùng mật khẩu MySQL từng lộ trong lịch sử git → nên đổi.

## 2026-10-21 (phiên 3) — Pha 1e: tài liệu chi tiết theo từng phía + bổ sung code theo báo cáo đối chiếu

Yêu cầu chủ dự án (DECISION-D19): giữ 35 FR; viết lại tài liệu chi tiết theo vai trò dự án **và** theo cổng người dùng; sau đó bổ sung code theo báo cáo; **không commit**; chủ dự án tự chạy `pnpm db:reset`.

### Tài liệu (theo skill project-team-roles-master + template)
- Mới: `02-srs.md`, `04-use-cases/UC-001..UC-020` (tách file, thêm UC-013..020), `09-architecture/system-context.md`, ADR-002..004, `19-team-roles-and-document-register.md`, `20-frontend-guide.md`, `21-backend-guide.md`, `portals/P-01..P-05`, `README.md`, `progress/GAP-REPORT-2026-10-21.md`.
- Viết lại chi tiết: 00, 01 (v3.1: làm rõ FR-006/011/015/019/021/032/033/035, NFR-009..012), 03 (ma trận theo thao tác), 04, 05 (FEAT-001..044, Pha 2 P2-01..22), 06 (BR-009, 011..016, 024..029, 034, 035, 047..051), 07, 08 (screen inventory 39 màn, tương phản đo thật), 09 component, 10 (data dictionary theo cột), 11 (error catalogue, API-021/022, Q-001..034), 12 (threat register T-01..T-20), 13 (TC-039..048, UAT-01..15, ma trận quyền âm), 14, 15 (RACI, RISK-008..012), 16, 17 (D15..D19 — **D15..D18 chờ chủ dự án xác nhận**), 18.

### Code (GAP-01..GAP-14, xem GAP-REPORT)
- Nhập lead thủ công `/quan-ly/lead/moi` (API-021, BR-011/012); xóa môn khi chưa có khóa (API-022); BR-047 — bài chưa chấm hiện "Đang chờ chấm" sau công bố, thẻ công bố báo số bài chưa chấm; đăng nhập giữ ô email/SĐT + rate limit 20 lần/10'/IP; skip link khu nội bộ; 404 có "Về trang tổng quan"; checkbox giữ trạng thái khi lỗi; audit `session.cancel` (transaction); chặn ghi danh HS bị khóa (`STUDENT_DISABLED`); tổng số bài chờ chấm; token `--color-line-strong` cho viền ô nhập (WCAG 1.4.11).
- Test: unit TC-039, 042, 043, 044, 045; integration `*.int.test.ts` (TC-003, 007, 008, 015, 040, 041, 044, 047) + `vitest.integration.config.ts`, `src/test/`, script `pnpm test:integration`, biến `TEST_DATABASE_URL` (chặn trỏ nhầm `corelink`).
- Không có migration mới (đã đối chiếu `migration.sql`).

### Kết quả kiểm tra (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi |
| `pnpm test` | 14 file, **76/76** pass (phiên 2: 70) |
| `pnpm test:integration` | 2 file, 8 test **skipped** (không có `TEST_DATABASE_URL`) — chưa chạy thật |
| `pnpm build` | Pass, 39 route (thêm `/quan-ly/lead/moi`, 1,58 kB) |
| Smoke `next start` (không DB) | `/dang-nhap` 200, đủ 4 header, không `X-Powered-By`; `/quan-ly`, `/quan-ly/lead/moi`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`, `/doi-mat-khau` → 307; `/khong-co` → 404 có "Về trang chủ" |
| `grep console.* / dangerouslySetInnerHTML src` | 0 kết quả |

### Chưa làm được / rủi ro còn lại
- **Vẫn chưa chạy luồng nào trên DB thật** (DB `corelink` còn schema v2, `migrate status`: `20261021000000_init` chưa áp) — RISK-007.
- Integration test chưa chạy (Q08); UAT, E2E, axe, đo NFR-009, thử restore backup: Pha 1.5.
- Ghi chú phiên 1–2 về `docs/ACCOUNTS.md` là v2 đã **lỗi thời**: file đã là danh sách tài khoản v3, không chứa mật khẩu.
- Một người kiêm mọi vai trò → chưa có review độc lập (RISK-012).

### Bước tiếp theo
1. Chủ dự án xem `progress/GAP-REPORT-2026-10-21.md` và xác nhận DECISION-D15..D18 (docs/17).
2. Chủ dự án chạy `pnpm db:reset` rồi `pnpm dev`; chạy UAT TC-UAT-01..15 (docs/13 §7) và ma trận quyền âm (§6).
3. Tạo DB test (vd `corelink_test`), `prisma migrate deploy` lên đó, đặt `TEST_DATABASE_URL`, chạy `pnpm test:integration`.
4. Review diff và tự commit (trợ lý không commit/push).

## 2026-10-21 (phiên 2) — Pha 1b, 1c, 1d: code xong, chưa chạy trên DB thật

### Đã xong
- **1b Công khai + tuyển sinh (FR-001..009):** `/`, `/khoa-hoc` (lọc `?mon=&khoi=`), `/khoa-hoc/[slug]` (khóa ẩn → 404, lớp đang tuyển + chỗ còn lại), `/dang-ky-hoc-thu` (honeypot, rate limit 5 lần/10 phút/IP trong DB, chuẩn hóa SĐT, trùng lead mở → hoạt động RESUBMITTED), `/quan-ly/lead` (lọc, tìm, quá hạn, phân trang), `/quan-ly/lead/[id]` (đổi trạng thái theo BR-010, ghi chú, chuyển học viên trong một transaction + audit, mật khẩu tạm hiện một lần).
- **1c Đào tạo + điểm danh (FR-013..026):** mở lớp sinh buổi theo giờ VN + chặn trùng GV/phòng (liệt kê từng xung đột), đổi trạng thái lớp, xóa lớp chưa có ghi danh, ghi danh (khóa dòng lớp `FOR UPDATE`, chặn đủ sĩ số/đã ghi danh/trùng lịch HS/lớp đóng), đổi trạng thái ghi danh, hủy/dời buổi (kiểm tra trùng + audit), lịch tuần cho GV/HS/PH, điểm danh mặc định "có mặt" trong khung BR-030, Staff sửa ngoài khung bắt buộc lý do + audit trước/sau, tỷ lệ chuyên cần, cảnh báo vắng 2 buổi liên tiếp; người dùng (tạo/sửa/đổi vai trò/khóa/đặt lại mật khẩu, audit, Admin không tự khóa/tự đổi vai trò), liên kết PH–HS tối đa 4; quản trị môn/khóa/phòng; nhật ký audit chỉ đọc.
- **1d Bài tập + chấm (FR-027..035):** soạn bài 3 dạng câu (MCQ 2–6 lựa chọn, trả lời ngắn, tự luận), DRAFT → PUBLISHED → CLOSED, làm bài/lưu nháp/nộp đúng một lần (`updateMany where IN_PROGRESS`), nộp muộn, tự chấm khách quan, chấm tự luận bước 0,25, công bố kết quả, bảng điểm, HS/PH chỉ thấy điểm + đáp án sau công bố (câu hỏi đi qua `toStudentQuestion`), sửa điểm sau công bố ghi audit.
- **Dashboard FR-034** cho 4 khu; điều hướng đầy đủ theo vai trò.
- Seed bổ sung 3 lớp demo, buổi đã điểm danh, 1 cảnh báo vắng, 1 bài tập, 2 lead.
- Tài liệu cập nhật: 05, 07, 08, 09, 11, 13, 14, 15, 16, 17.

### Kết quả kiểm tra (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi, 0 cảnh báo |
| `pnpm test` | 13 file, 70/70 test pass |
| `pnpm build` | Pass, 38 route (gồm `/_not-found`) |
| Smoke `next start` (không cần DB) | `/dang-nhap` 200 có đủ 4 header bảo mật; 7 trang nội bộ khi chưa đăng nhập → 307 `/dang-nhap`; URL lạ → 404 |

### Chưa làm được / rủi ro còn lại
- **Chưa chạy bất kỳ luồng nào trên DB thật.** DB `corelink` vẫn là schema v2 (lệnh xóa bị chặn ở phía trợ lý); thử tạo DB riêng `corelink_test` thì MySQL báo `P1010: User was denied access` → không có môi trường để smoke test. Mọi lỗi runtime (truy vấn, raw SQL `FOR UPDATE`, transaction) chỉ được kiểm qua typecheck/build, chưa được chứng minh bằng chạy thật (RISK-007).
- Integration test (TC-003, 007, 008, 015) và E2E (TC-009, 012, 360px, axe) chưa có — Pha 1.5.
- `docs/ACCOUNTS.md` vẫn là tài khoản v2; `.env` còn biến của v2.

### Bước tiếp theo
1. Chủ dự án chạy `pnpm exec prisma migrate reset --force` (xóa bảng v2, áp `init`, chạy seed), rồi `pnpm dev`.
2. Kiểm tra thủ công UC-001..012 với tài khoản demo (docs/14 §4), desktop + 360px; ghi kết quả vào đây và cột Bằng chứng của docs/16.
3. Kiểm tra truy cập chéo theo docs/18: GV Văn mở `/giao-vien/lop/<id lớp Toán>`, PH2 mở `/phu-huynh?con=<id HS1>`, HS3 mở bài tập lớp Toán → đều 404.
4. Pha 1.5: cấp quyền `corelink_test` (QUESTION-Q08) để viết integration test.

## 2026-10-21 — Pha 1a: Nền tảng (đang làm)

### Đã xong
- Scaffold Next.js 15.5 + React 19 + TypeScript strict + Tailwind 4 + Prisma 6 + Vitest (`package.json`, `tsconfig.json`, `next.config.ts` có header bảo mật, `eslint.config.mjs`, `vitest.config.ts`).
- Backup DB cũ: `backup/corelink-v2-20261021.sql` (84 bảng, dump hoàn tất) — RISK-001.
- Schema `prisma/schema.prisma` (18 bảng) và migration `prisma/migrations/20261021000000_init` (sinh offline bằng `prisma migrate diff --from-empty`).
- Seed `prisma/seed.ts`: 6 môn, 8 khóa (1 khóa chưa xuất bản), 3 phòng, 15 tài khoản demo, 6 liên kết PH–HS. Chạy lại nhiều lần được (upsert).
- Tiện ích thuần: `src/lib/phone.ts` (BR-001), `src/lib/time.ts` (NFR-005, giờ VN ↔ UTC), `src/lib/format.ts`.
- Xác thực (FR-010..012, API-005..007): `src/server/auth/` — `password.ts` (Argon2id), `rules.ts` (khóa 5 lần/15 phút, độ mạnh mật khẩu), `session.ts` (phiên DB, cookie httpOnly 7 ngày, lưu sha256 token), `policy.ts` (ma trận quyền theo vai trò), `guard.ts` (`requireActor`, `requireRole`), `actions.ts` (`login`, `logout`, `changePassword`).
- `src/server/audit/log.ts` (append-only), `src/server/errors.ts`, `src/server/validation.ts`.
- Design system: token trong `src/app/globals.css`, font Be Vietnam Pro + Source Serif 4; component `Button/ButtonLink`, `SubmitButton`, `TextField/SelectField/TextareaField/CheckboxField`, `Alert`, `Badge`, `Card`, `EmptyState`, `PageHeader`, `PageSkeleton`.
- Layout: `PublicShell`; `AppShell` (sidebar 240px ≥1024px, menu ngăn kéo dưới 1024px, thanh đáy cho GV/HS/PH). Khu `/quan-ly`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`: layout **và** trang đều gọi `requireRole()`.
- Trang: `/` (tối giản), `/dang-nhap`, `/doi-mat-khau`, 4 dashboard khung, `not-found`, `error`, `loading`.

### Kết quả kiểm tra (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass, không lỗi |
| `pnpm lint` (ESLint CLI) | Pass, 0 lỗi, 0 cảnh báo |
| `pnpm test` | 4 file, 17/17 test pass (TC-001, TC-010, TC-011, TC-036, TC-038 + time) |
| `pnpm build` | Pass, 8 route |
| Smoke `next start` | `/` 200 có đủ 4 header bảo mật; `/quan-ly`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`, `/doi-mat-khau` khi chưa đăng nhập → 307 `/dang-nhap`; `/khong-co` → 404 |

### Chưa xong / bị chặn
- **Chưa áp migration vào MySQL.** DB `corelink` vẫn chứa 84 bảng của v2. Lệnh xóa DB (`prisma migrate reset`) bị chặn bởi chế độ quyền của trợ lý; chủ dự án cần tự chạy (xem docs/14 §3). Vì vậy **chưa kiểm tra được đăng nhập thật 5 vai trò** (TC-009, TC-012) — cổng của Pha 1a vẫn mở.
- `Table/ResponsiveList`, `Pagination` (docs/08 §4) để lại cho Pha 1b khi có trang danh sách đầu tiên.
- `docs/ACCOUNTS.md` là danh sách tài khoản của bản v2 (không còn đúng với v3, có mật khẩu dạng chữ) — chờ chủ dự án quyết định xóa/viết lại.
- `.env` còn các biến của v2 (Redis, S3, JWT, AI…) không dùng ở v3; nên dọn theo `.env.example`.

### Bước tiếp theo
1. Chủ dự án chạy `pnpm exec prisma migrate reset --force` (xóa bảng v2, áp migration `init`, tự chạy seed và in mật khẩu demo).
2. Đăng nhập thử 5 vai trò, kiểm tra khóa 15 phút, `mustChangePassword` → đóng Pha 1a.
3. Pha 1b: FR-001..009 (trang công khai, form học thử, lead).
