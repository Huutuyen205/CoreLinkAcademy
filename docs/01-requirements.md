# 01 — Yêu cầu sản phẩm (danh mục FR/NFR chuẩn)

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — làm rõ tiêu chí FR-006, FR-015, FR-032, FR-033; thêm NFR-009..NFR-012 |
| Trạng thái | Baselined. **Đây là nguồn chuẩn phạm vi** (AGENTS.md). Đặc tả chi tiết từng FR: [02-srs.md](02-srs.md) |
| Owner | Chủ dự án (phê duyệt) · Trợ lý (BA soạn) |

ID cố định, không đánh số lại. Ưu tiên: **P0** = không có thì sản phẩm không dùng được; **P1** = cần cho vận hành; **P2** = tiện ích.

## 1. Thuật ngữ

| Thuật ngữ | Nghĩa | Ghi chú |
|---|---|---|
| Lead | Khách tiềm năng sinh ra từ form học thử (nguồn `web_form`) hoặc do Staff nhập tay (nguồn `phone`, `walk_in`, `referral`, `other`) | Bảng `leads` |
| Lead đang mở | Lead có trạng thái khác ENROLLED và LOST (BR-004) | |
| Môn (Subject) | Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Tin học | |
| Khóa học (Course) | Chương trình mẫu: môn, khối lớp từ–đến, trình độ, số buổi, phút/buổi, học phí tham khảo, mục tiêu, lộ trình | Xuất bản thì hiện công khai |
| Lớp (Class) | Một lần mở khóa: mã lớp, giáo viên chính, phòng, ngày bắt đầu, các thứ, giờ, số buổi, sĩ số | |
| Buổi (Session) | Một lần học cụ thể của lớp; có thể khác giáo viên chính (dạy thay) | Bảng `class_sessions` |
| Ghi danh (Enrollment) | Học sinh thuộc một lớp, có trạng thái | |
| Sĩ số | Số ghi danh ACTIVE + PAUSED (BR-020) | |
| Khung điểm danh | Từ 30 phút trước giờ học đến 24 giờ sau giờ kết thúc (BR-030) | |
| Bài tập (Assignment) | Bộ câu hỏi giao cho một lớp, có hạn nộp | |
| Bài nộp (Submission) | Bài làm của một học sinh cho một bài tập | Một HS một bài nộp |
| Công bố kết quả | Giáo viên mở điểm + đáp án + nhận xét cho HS/PH (`resultsPublishedAt`) | |
| Mật khẩu tạm | Mật khẩu 10 ký tự do hệ thống sinh khi Staff/Admin tạo tài khoản; hiển thị một lần; bắt đổi lần đầu | |
| Audit | Nhật ký chỉ thêm các thao tác nhạy cảm | |

## 2. Yêu cầu chức năng

### 2.1 Công khai và tuyển sinh

| ID | Yêu cầu | Tiêu chí chấp nhận | Ưu tiên | UC |
|---|---|---|---|---|
| FR-001 | Trang chủ giới thiệu học viện, các môn, khóa nổi bật, lời kêu gọi đăng ký học thử | Chỉ hiển thị môn có ≥ 1 khóa đã xuất bản và khóa đã xuất bản + nổi bật (tối đa 3); không có khóa ẩn; có nút "Đăng ký học thử" | P0 | UC-013 |
| FR-002 | Danh mục khóa học lọc theo môn và khối lớp | `?mon=toan&khoi=9` chỉ trả khóa đã xuất bản của môn đó có `gradeFrom ≤ 9 ≤ gradeTo`; tham số sai bị bỏ qua; dùng được không cần JavaScript | P0 | UC-013 |
| FR-003 | Chi tiết khóa học: mô tả, đối tượng, số buổi, học phí tham khảo, mục tiêu, lộ trình, các lớp đang tuyển | Khóa chưa xuất bản/không tồn tại trả 404; lớp đang tuyển = lớp OPEN, hiện số chỗ còn lại | P0 | UC-013 |
| FR-004 | Form học thử: tên phụ huynh, SĐT (bắt buộc), email (tùy chọn), tên học sinh, khối lớp, môn quan tâm, khóa (tùy chọn), ghi chú, đồng ý liên hệ (bắt buộc) | SĐT chuẩn hóa về `+84…` (BR-001); trùng SĐT với lead đang mở → thêm hoạt động RESUBMITTED vào lead cũ, không tạo lead mới; lưu thời điểm đồng ý | P0 | UC-001 |
| FR-005 | Chống spam form công khai | Quá 5 lần/10 phút/IP → báo lỗi thân thiện; ô honeypot có giá trị → báo thành công giả, không lưu | P0 | UC-001 |
| FR-006 | Danh sách lead cho Staff/Admin: lọc trạng thái, môn; tìm theo tên/SĐT; **nhập lead thủ công** (khách gọi điện, đến trực tiếp, giới thiệu) | Lead NEW quá 24 giờ được đánh dấu "quá hạn"; phân trang 20/trang; nhập tay trùng SĐT với lead đang mở → từ chối và chỉ tới lead cũ (BR-011) | P0 | UC-002, UC-020 |
| FR-007 | Đổi trạng thái lead theo máy trạng thái (BR-010) | Chuyển sai luồng bị từ chối; LOST bắt buộc lý do; hai người đổi cùng lúc → người sau nhận thông báo tải lại (BR-016) | P0 | UC-002 |
| FR-008 | Ghi chú/hoạt động cho lead | Mỗi hoạt động có loại, người thực hiện (hoặc "Hệ thống"), thời điểm; hiển thị mới nhất trước | P0 | UC-002 |
| FR-009 | Chuyển lead thành học viên trong một giao dịch | Tạo tài khoản học sinh (mã HS BR-007), tạo hoặc dùng lại phụ huynh theo SĐT, liên kết, tùy chọn ghi danh lớp; lead → ENROLLED; lỗi ở bước nào thì không bước nào được lưu; mật khẩu tạm hiện một lần | P0 | UC-003 |

### 2.2 Tài khoản và phân quyền

| ID | Yêu cầu | Tiêu chí chấp nhận | Ưu tiên | UC |
|---|---|---|---|---|
| FR-010 | Đăng nhập bằng email hoặc SĐT + mật khẩu; đăng xuất | Phiên lưu trong cookie httpOnly, hết hạn sau 7 ngày; sai thông tin → một thông báo chung; đăng xuất xóa phiên trên server | P0 | UC-004 |
| FR-011 | Khóa đăng nhập 15 phút sau 5 lần sai liên tiếp | Trong thời gian khóa, đúng mật khẩu vẫn bị từ chối; quá 20 lần/10 phút từ một IP cũng bị chặn tạm (BR-009) | P0 | UC-004 |
| FR-012 | Đổi mật khẩu; tài khoản do Staff/Admin tạo phải đổi ở lần đăng nhập đầu | Chưa đổi thì mọi trang nội bộ chuyển về `/doi-mat-khau`; đổi xong các phiên khác bị thu hồi | P0 | UC-004 |
| FR-013 | Admin quản lý người dùng: tạo, sửa, khóa/mở khóa, đặt lại mật khẩu tạm, chọn vai trò | Đổi vai trò/khóa/đặt lại mật khẩu ghi audit và thu hồi phiên; Admin không tự khóa/tự đổi vai trò; email/SĐT duy nhất; Staff chỉ tạo được học sinh/phụ huynh | P1 | UC-012 |
| FR-014 | Liên kết phụ huynh–học sinh | Tối đa 4 phụ huynh cho một học sinh (BR-008); không liên kết trùng | P0 | UC-012 |

### 2.3 Đào tạo

| ID | Yêu cầu | Tiêu chí chấp nhận | Ưu tiên | UC |
|---|---|---|---|---|
| FR-015 | Admin quản lý môn học và khóa học, bật/tắt xuất bản | Slug duy nhất; khóa đang có lớp không xóa được (chỉ ẩn); **môn đang có khóa không xóa được** | P1 | UC-014 |
| FR-016 | Admin quản lý phòng học | Tên phòng duy nhất; phòng đang dùng cho lớp/buổi không xóa được | P1 | UC-014 |
| FR-017 | Staff/Admin mở lớp: khóa, giáo viên, phòng, ngày bắt đầu, các thứ trong tuần, giờ bắt đầu/kết thúc, số buổi, sĩ số | Hệ thống sinh đủ `totalSessions` buổi theo các thứ đã chọn từ ngày bắt đầu (BR-023); sĩ số ≤ sức chứa phòng; mã lớp duy nhất | P0 | UC-005 |
| FR-018 | Chặn trùng lịch giáo viên và phòng | Có buổi chồng giờ → từ chối, liệt kê từng xung đột (GV/phòng, lớp, thời gian) | P0 | UC-005 |
| FR-019 | Ghi danh học sinh vào lớp | Chặn khi đủ sĩ số, khi đã ghi danh, khi trùng lịch với lớp đang học của học sinh, khi lớp đã kết thúc/hủy, khi tài khoản học sinh bị khóa | P0 | UC-006 |
| FR-020 | Đổi trạng thái ghi danh: ACTIVE, PAUSED, DROPPED, COMPLETED | Chỉ ACTIVE được làm bài; ACTIVE + PAUSED tính sĩ số; chuyển sai luồng bị từ chối | P0 | UC-006 |
| FR-021 | Hủy hoặc dời một buổi học, kèm lý do | Chỉ buổi SCHEDULED chưa diễn ra; dời buổi kiểm tra trùng lịch; cả hai đều ghi audit | P1 | UC-015 |
| FR-022 | Lịch tuần: giáo viên (buổi dạy), học sinh (buổi học), phụ huynh (của từng con) | Giờ hiển thị theo `Asia/Ho_Chi_Minh`; chuyển tuần trước/sau; buổi hủy hiện nhãn "Đã hủy" | P0 | UC-016 |

### 2.4 Điểm danh

| ID | Yêu cầu | Tiêu chí chấp nhận | Ưu tiên | UC |
|---|---|---|---|---|
| FR-023 | Giáo viên điểm danh buổi của lớp mình: có mặt / muộn / vắng / có phép, ghi chú | Mở từ 30 phút trước giờ học đến 24 giờ sau giờ kết thúc; mặc định "có mặt"; ngoài khung chỉ xem | P0 | UC-007 |
| FR-024 | Ngoài khung trên chỉ Staff/Admin sửa được, bắt buộc lý do | Ghi audit trước/sau | P0 | UC-007 |
| FR-025 | Học sinh/phụ huynh xem lịch sử chuyên cần và tỷ lệ | Tỷ lệ = (có mặt + muộn) / số buổi đã điểm danh không bị hủy (BR-032); theo từng lớp và tổng | P0 | UC-011, UC-017 |
| FR-026 | Cảnh báo học sinh vắng (không phép) 2 buổi liên tiếp của cùng lớp | Hiện trên dashboard Staff/Admin và giáo viên lớp đó | P1 | UC-018 |

### 2.5 Bài tập và chấm điểm

| ID | Yêu cầu | Tiêu chí chấp nhận | Ưu tiên | UC |
|---|---|---|---|---|
| FR-027 | Giáo viên tạo bài tập cho lớp mình với câu trắc nghiệm (1 đáp án), trả lời ngắn, tự luận; điểm từng câu | Tổng điểm hiển thị; trắc nghiệm 2–6 lựa chọn; điểm câu 0,25–100 bước 0,25 | P0 | UC-008 |
| FR-028 | Trạng thái bài: DRAFT → PUBLISHED → CLOSED (mở lại được) | Chỉ sửa câu hỏi khi DRAFT; giao bài phải có ≥ 1 câu và hạn nộp ở tương lai | P0 | UC-008 |
| FR-029 | Học sinh đang học lớp làm bài, lưu nháp, nộp đúng 1 lần | Quá hạn không nộp được, trừ khi bài cho phép nộp muộn (đánh dấu muộn); bấm nộp hai lần chỉ một lần có hiệu lực | P0 | UC-009 |
| FR-030 | Tự chấm trắc nghiệm và trả lời ngắn khi nộp | Trả lời ngắn so khớp sau khi bỏ khoảng trắng thừa, không phân biệt hoa thường (BR-041); bài chỉ có câu khách quan → "Đã chấm" ngay | P0 | UC-009 |
| FR-031 | Giáo viên chấm tự luận, sửa điểm câu tự chấm, nhận xét | Điểm câu trong [0, điểm tối đa], bước 0,25 | P0 | UC-010 |
| FR-032 | Giáo viên công bố kết quả | Trước khi công bố, HS/PH không thấy điểm và đáp án đúng; server không gửi đáp án; **bài nộp chưa chấm vẫn hiện "Đang chờ chấm" sau công bố** (BR-047); màn công bố báo số bài chưa chấm | P0 | UC-010 |
| FR-033 | Bảng điểm lớp cho giáo viên; học sinh/phụ huynh xem điểm đã công bố | Chỉ bài đã công bố và đã chấm; sửa điểm sau công bố ghi audit | P0 | UC-010, UC-017 |

### 2.6 Cổng theo vai trò và audit

| ID | Yêu cầu | Tiêu chí chấp nhận | Ưu tiên | UC |
|---|---|---|---|---|
| FR-034 | Trang tổng quan theo vai trò | Admin/Staff: lead mới, lead quá hạn, lớp đang tuyển, lớp đang học, cảnh báo vắng · GV: buổi hôm nay, số bài chờ chấm, cảnh báo vắng lớp mình · HS: bài cần làm, lịch tuần, điểm mới · PH: chọn con, lịch, chuyên cần, điểm | P0 | UC-018, UC-011 |
| FR-035 | Nhật ký audit | Ghi cho: tạo tài khoản, đổi vai trò, khóa/mở khóa, đặt lại mật khẩu, sửa điểm danh ngoài khung, sửa điểm sau công bố, chuyển lead, hủy/dời buổi; Admin xem và lọc theo loại; không ai sửa/xóa được | P1 | UC-019 |

## 3. Yêu cầu phi chức năng

| ID | Nhóm | Yêu cầu | Ngưỡng / đo bằng |
|---|---|---|---|
| NFR-001 | Bảo mật | Mọi thao tác đọc/ghi dữ liệu nội bộ kiểm tra quyền phía server (vai trò + phạm vi dữ liệu) | Unit test policy/scope (TC-034..036) + kiểm thử truy cập chéo (TC-UAT-13) |
| NFR-002 | Responsive | Mobile-first, dùng được ở 360px, không cuộn ngang trang (bảng điểm GV được cuộn trong khung riêng) | Kiểm tra thủ công/Playwright viewport 360 |
| NFR-003 | Accessibility | WCAG 2.1 AA: tương phản chữ ≥ 4.5:1, focus rõ, mọi ô nhập có nhãn, dùng được bằng bàn phím, có skip link | Kiểm token màu (docs/08 §4) + axe (Pha 1.5) |
| NFR-004 | SEO | Trang công khai render phía server, có `title`/`description`; trang nội bộ, đăng nhập, cảm ơn `noindex` hoặc không công khai | Xem source HTML |
| NFR-005 | Thời gian | DB lưu UTC; hiển thị và nhập liệu theo `Asia/Ho_Chi_Minh`; chỉ `src/lib/time.ts` chuyển múi giờ | Unit test `time.test.ts` |
| NFR-006 | Bảo mật | Mật khẩu băm Argon2id; không log mật khẩu, token, dữ liệu học sinh | Review code (`grep console.log src`) |
| NFR-007 | Usability | Mọi danh sách có trạng thái rỗng; mọi form có thông báo lỗi chung + lỗi từng ô và giữ giá trị đã nhập | Review UI theo docs/08 §6 |
| NFR-008 | Chất lượng | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` đều xanh trước khi đóng pha | Chạy lệnh, ghi PROGRESS |
| NFR-009 | Hiệu năng | Với dữ liệu ~500 học sinh/50 lớp, trang nội bộ trả HTML trong ≤ 1,5 s (p95) trên máy dev | Đo thủ công Pha 1.5 — **chưa đo** |
| NFR-010 | Bảo mật | Mọi response có header `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; không có `X-Powered-By` | Smoke test `next start` |
| NFR-011 | Toàn vẹn | Audit log chỉ thêm; không có hàm sửa/xóa trong code | Review `src/server/audit/**` |
| NFR-012 | Bảo trì | Logic nghiệp vụ ở `src/server/**` và `src/lib/**`, không nằm trong component; hàm thuần có unit test | Review cấu trúc (docs/21) |

## 4. Quy tắc nghiệp vụ

Xem [06-business-rules-and-states.md](06-business-rules-and-states.md).

## 5. Lịch sử thay đổi

| Ngày | Phiên bản | Thay đổi | Lý do |
|---|---|---|---|
| 2026-10-21 | 3.0 | Baseline 35 FR | Discovery |
| 2026-10-21 | 3.1 | FR-006 thêm nhập tay; FR-011 thêm giới hạn IP; FR-015 điều kiện xóa môn; FR-019 chặn HS bị khóa; FR-021 audit hủy buổi; FR-032/033 BR-047; FR-035 liệt kê đủ sự kiện; NFR-009..012 | Đối chiếu code (GAP-REPORT), thuật ngữ và ma trận quyền đã có từ baseline |
