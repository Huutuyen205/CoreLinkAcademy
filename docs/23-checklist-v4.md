# 23 — Đối chiếu checklist chức năng v4 (PO, 2026-10-23)

Nguồn: bảng checklist PDF của PO, gồm 4 cột: Admin, Học sinh, Giáo viên, Phụ huynh. Mục **đã tích** coi là đạt. Tài liệu này ghi kết quả xử lý từng mục **chưa tích** (và mục tô vàng) — DECISION-D33.

Ký hiệu cột "Kết quả":
- **Có sẵn**: đã có từ trước. Cột "Ở đâu" ghi chỗ dùng; nếu khó tìm thì đã thêm lối vào.
- **Bổ sung**: làm mới trong đợt này.
- **Sửa**: đã có một phần, đợt này hoàn thiện.

Mục ghi "(Giả định – cần xác nhận)" trong checklist đều đã làm theo cách đơn giản nhất, cách làm ghi ở cột "Ghi chú".

## I. Admin (trung tâm)

| § | Mục | Kết quả | Ở đâu / ghi chú |
|---|---|---|---|
| 1 | Thêm / cập nhật / xem, tìm kiếm cấp học | Có sẵn | Môn & cấp học → "Thêm cấp học", "Sửa" trên từng thẻ cấp |
| 1 | Ngừng sử dụng cấp học | Có sẵn | Nút "Ngừng / Dùng lại" trên thẻ cấp học |
| 1 | Liên kết môn học với cấp học | Sửa | Trước chỉ chọn được ở form **môn**. Nay form **cấp học** cũng có ô "Môn dạy ở cấp này" (`subjectIds`) |
| 2 | Lịch sử lớp HS đã và đang tham gia | Có sẵn | Hồ sơ học sinh → "Lớp học" (đủ trạng thái, ngày ghi danh/cập nhật) |
| 2 | Gỡ học sinh khỏi lớp | Có sẵn | Hồ sơ HS → "Chuyển lớp hoặc gỡ khỏi lớp"; hoặc trang lớp → đổi trạng thái ghi danh |
| 3 | Cập nhật trạng thái hoạt động GV | Sửa | Hồ sơ GV → thẻ "Trạng thái hoạt động", 3 nút bấm nhanh (Đang dạy / Tạm nghỉ / Đã nghỉ), có ghi nhật ký |
| 4 | Xem chi tiết hồ sơ phụ huynh | Có sẵn | Phụ huynh → bấm tên → `/quan-ly/phu-huynh/[id]` |
| 5 | Kích hoạt tài khoản | Sửa | Tài khoản mới ở trạng thái "Chưa kích hoạt" cho tới khi người dùng đổi mật khẩu tạm; có huy hiệu ở danh sách và trang tài khoản. Trang tài khoản có thẻ "Kích hoạt / khóa": cấp lại mật khẩu kích hoạt, nút "Kích hoạt lại (mở khóa)" |
| 5 | Liên kết tài khoản với hồ sơ người dùng | Sửa | Trang tài khoản có nút "Hồ sơ …" sang hồ sơ theo vai trò, liên kết trực tiếp PH ↔ HS ngay tại trang tài khoản |
| 7 | Tạo lịch học, thiết lập giờ / phòng, phân công GV buổi, xem lịch theo lớp / GV, cập nhật lịch, xử lý đề xuất, nghỉ / hủy, học bù, thông báo khi đổi lịch, xếp phòng không trùng | Có sẵn + Sửa | Lịch tổng có lối tắt "Tạo lịch (mở lớp)", "Đề xuất đổi lịch", "Tình trạng phòng". Bấm một buổi → trang buổi có thẻ "Quản lý buổi học": đổi GV, **đổi phòng (mới, chặn trùng phòng)**, dời giờ, hủy buổi. Học bù ở trang lớp. Mọi thay đổi đều kiểm tra trùng lịch và báo cả lớp |
| 8 | Cập nhật trạng thái phòng | Có sẵn | Phòng học → "Tạm ngừng / Dùng lại" |
| 8 | Kiểm tra tình trạng sử dụng phòng theo lịch | Bổ sung | Mỗi thẻ phòng có 3 thông tin: "Bây giờ" (trống, hoặc lớp đang học đến mấy giờ), buổi kế tiếp, số buổi và số giờ trong tuần. Nút "Lịch" xem chi tiết |
| 9 | Tải lên / cập nhật / tìm / phân loại / phân phối / tải giáo trình; ngừng dùng | Có sẵn | Menu "Giáo trình, tài liệu, giáo án" → tab Giáo trình; chia sẻ cho lớp ở trang chi tiết |
| 9 | Xem danh sách giáo án do GV tải lên | Sửa | Tab "Giáo án" + bộ lọc mới "Giáo án chờ duyệt" |
| 11 | Xem đánh giá, nhận xét của GV | Bổ sung | Menu "Đánh giá của GV" (`/quan-ly/danh-gia`): lọc theo lớp, học sinh, kỳ |
| 11 | Theo dõi tình hình điểm danh; lịch sử chuyên cần theo HS / lớp | Bổ sung | Menu "Chuyên cần" (`/quan-ly/chuyen-can`): cảnh báo vắng 2 buổi liền; bảng lớp × buổi (✓ / M / V / P); số buổi có mặt, muộn, vắng, có phép và tỷ lệ từng HS; lọc từ ngày đến ngày |
| 12A | Gửi thông báo tới GV, HS, PH hoặc lớp ("mới gửi cho lớp") | Sửa | Ngoài nhóm và lớp, nay có thêm **"Chọn từng người nhận"** (tìm theo tên/mã, lọc vai trò, chọn tất cả người đang lọc) |
| 12A | Xem thông báo Admin nhận được ("chưa rõ ràng") | Sửa | Hộp thư ghi rõ là thông báo **nhận được**, lọc theo loại (Bài tập, Lịch học, Đơn từ, Kết quả & tài liệu, Từ trung tâm). Có nút "Đã gửi & trạng thái" riêng |
| 12A | Xem trạng thái gửi thông báo | Bổ sung | `/thong-bao/gui/[id]`: số đã gửi, đã đọc, số người có bật thông báo đẩy; danh sách từng người nhận (đã đọc lúc nào / chưa đọc), lọc theo đọc / chưa đọc |
| 12B | Xử lý trường hợp bất thường ở nhóm lớp ("TH bất thường là gì") | Bổ sung | Trường hợp bất thường gồm: tin rác, tin không phù hợp, thành viên gây rối. Quản lý và GV phụ trách được **gỡ tin** bất kỳ trong nhóm lớp (nội dung cũ lưu nhật ký) và **tạm chặn gửi tin** một thành viên (người đó vẫn đọc được; chỉ trung tâm chặn được GV). Thành viên rời lớp thì tự ra khỏi nhóm (có từ trước) |
| 13 | Thống kê tình trạng hoàn thành bài tập | Có sẵn | Báo cáo → "Hoàn thành bài tập theo lớp" (nộp đúng hạn, muộn, tỷ lệ), xuất Excel |

## II. Học sinh

| § | Mục | Kết quả | Ở đâu / ghi chú |
|---|---|---|---|
| 1 | Danh sách bài tập theo trạng thái (Chưa nộp, Đã nộp, Nộp muộn, Đã chấm) | Sửa | Bài tập có 5 tab lọc kèm số lượng; nhãn "Cần nộp lại", "Kiểm tra" |
| 1 | Xem đáp án / bài chữa | Bổ sung | GV nhập "Bài chữa / lời giải" cho bài. HS xem được sau khi công bố, kể cả HS chưa nộp; đáp án từng câu đã có từ trước |
| 2 | Xem tài liệu theo môn, lớp, buổi; tìm kiếm; xem / tải | Sửa | Trang Tài liệu có ô tìm, lọc theo môn và lớp; thẻ tài liệu ghi buổi/lớp gắn với tài liệu |
| 3 | Thời khóa biểu theo tuần / tháng | Bổ sung | Lịch học → tab "Theo tháng" (lưới tháng trên máy tính, danh sách ngày trên điện thoại) |
| 3 | Lịch sử điểm danh (số buổi có mặt, vắng, muộn) | Sửa | Thẻ chuyên cần có 4 ô đếm (có mặt, muộn, vắng, có phép) và thái độ học tập nếu GV ghi |
| 4 | Kết quả tổng hợp theo môn, lớp, kỳ; chi tiết theo bộ lọc | Bổ sung | Kết quả → "Kết quả học tập tổng hợp": lọc môn, lớp, kỳ (tháng / quý); bảng TB, cao nhất, thấp nhất theo môn và theo lớp; mở "Chi tiết N bài" |
| 4 | Tiến độ (hoàn thành khóa, tỷ lệ hoàn thành bài tập, xu hướng điểm) | Bổ sung | "Tiến độ khóa học & bài tập": buổi đã học / tổng buổi, bài đã nộp / bài được giao, số bài quá hạn; biểu đồ xu hướng đã có |
| 5 | Tự ôn luyện: danh sách đề, lọc chuyên đề / dạng bài / mức độ, làm bài, kết quả, đáp án và lời giải, lịch sử | Bổ sung | Menu "Tự ôn luyện" (`/on-luyen`). GV/quản lý soạn đề trắc nghiệm, trả lời ngắn kèm lời giải. HS nộp là có điểm ngay, xem đáp án và lời giải, làm lại không giới hạn, có trang lịch sử |
| 6 | Nhắn tin với GV (văn bản, ảnh bài làm) | Có sẵn + Sửa | Có nút nhanh "Nhắn GV …" ở đầu danh sách tin nhắn |
| 6 | Hỏi bài từ màn hình bài tập (tin tự gắn thẻ bài) | Bổ sung | Trang bài tập → "Hỏi giáo viên về bài này": gửi riêng cho GV phụ trách, kèm ảnh được; tin hiện thẻ "Hỏi về bài: …" bấm mở bài |
| 6 | Tìm tin nhắn theo GV, từ khóa | Bổ sung | `/tin-nhan/tim`: từ khóa trong nội dung, lọc theo người đã trò chuyện; bấm kết quả nhảy tới đúng tin |
| 7 | Thông báo bài mới, sắp đến hạn, quá hạn chưa nộp, yêu cầu nộp lại, đã chấm, điểm cập nhật, có bài chữa / đáp án, lịch kiểm tra | Bổ sung | Giao bài → "Bài tập mới" hoặc "Lịch kiểm tra" (bài đánh dấu kiểm tra). Cron 19:00 → "Sắp đến hạn" (hạn trong 24h) và "Quá hạn chưa nộp" (gửi cả PH). Nộp lại / chấm / chấm lại / bài chữa đều báo; không báo trùng |
| 7 | Thông báo có kết quả, nhận xét định kỳ mới | Có sẵn | Công bố kết quả, gửi đánh giá (nay có thêm "đánh giá được cập nhật") |

## III. Giáo viên

| § | Mục | Kết quả | Ở đâu / ghi chú |
|---|---|---|---|
| 1 | Tìm kiếm lớp; tìm kiếm học sinh | Bổ sung | Lớp của tôi có ô tìm (mã lớp, khóa, phòng). Trang lớp có ô tìm học sinh (lớp trên 6 em) |
| 2 | Đăng ký lịch rảnh (giả định) | Bổ sung | Menu "Hồ sơ & lịch rảnh": khung giờ theo thứ, chặn trùng. Giáo vụ xem ở hồ sơ GV |
| 4 | Gửi duyệt giáo án (giả định) | Bổ sung | Trang giáo án → "Gửi duyệt". Quản lý chọn Duyệt / Yêu cầu sửa kèm ghi chú; hai bên được báo |
| 6 | Điểm danh, cập nhật điểm danh | Có sẵn | Mở được từ **30 phút trước giờ học đến 24 giờ sau giờ kết thúc** (BR-030). Ngoài khung chỉ giáo vụ sửa, kèm lý do |
| 6 | Ghi nhận thái độ học tập (giả định) | Bổ sung | Mỗi học sinh có ô "Thái độ" (Tích cực / Bình thường / Cần cố gắng) khi điểm danh; HS, PH, quản lý thấy ở lịch sử chuyên cần |
| 7 | Giao, tìm kiếm, cập nhật, xóa bài tập | Có sẵn + Sửa | Menu mới "Bài tập": mọi bài, tìm theo tên, lọc lớp / trạng thái. Có thêm ô "bài kiểm tra" và "bài chữa" |
| 8 | Xem bài làm, chấm, nhận xét, công bố, cập nhật điểm, bảng điểm, nhắc nộp | Có sẵn | Bài nộp → Chấm bài / Xem-sửa điểm; Công bố; Bảng điểm ở trang lớp (nút "Bảng điểm lớp") |
| 8 | Tải lên / cập nhật / xóa bài làm | Bổ sung | Trang Bài nộp: "Tải bài làm thay học sinh" (ảnh bài trên giấy), "Thêm ảnh/tệp", "Xóa bài làm", **"Yêu cầu nộp lại"** (kèm lời nhắn, HS nộp lại được kể cả quá hạn) |
| 9 | Cập nhật đánh giá định kỳ | Sửa | Sửa được cả bản đã gửi, HS và PH nhận thông báo "đã cập nhật", có ghi nhật ký |
| 10A | Xem chi tiết thông báo | Bổ sung | `/thong-bao/[id]`: nội dung đầy đủ, người gửi, gửi tới ai, nút mở trang liên quan |
| 11A | Hồ sơ giới thiệu: xem, cập nhật, gửi duyệt (giả định) | Bổ sung | Menu "Hồ sơ & lịch rảnh": lưu nháp / gửi duyệt. Khi quản lý duyệt, phần giới thiệu hiện ở thẻ lớp trong cổng PH |

## IV. Phụ huynh

| § | Mục | Kết quả | Ở đâu / ghi chú |
|---|---|---|---|
| 2 | Gửi đơn xin nghỉ; xem trạng thái đơn | Sửa | Trước phải vào trang chi tiết buổi. Nay trang "Đơn xin nghỉ" có form chọn buổi sắp tới (30 ngày, nhiều con) và lý do |
| 3 | Số buổi có mặt, vắng, muộn ("có một phần") | Sửa | 4 ô đếm trong thẻ chuyên cần |
| 4 | Xem điểm và nhận xét bài tập | Sửa | Cột "Điểm / nhận xét" ghi rõ trạng thái chờ chấm; thêm "Bài chữa của giáo viên" |
| 5 | Điểm tổng hợp; lịch sử kết quả | Bổ sung | Trang Theo dõi con: "Kết quả học tập tổng hợp" (lọc môn, lớp, kỳ) và "Tiến độ khóa học & bài tập" |
| 6 | Xem / tải tài liệu được phép | Có sẵn | Tài liệu: chỉ tài liệu trung tâm/GV bật "PH được xem" và chia sẻ cho lớp của con; nay có thêm tìm, lọc |
| 7B | Nhắn tin với GV; nhắn với trung tâm | Sửa | Nút nhanh "Nhắn GV …" (GV các lớp của con) và **"Nhắn trung tâm"** (mở trò chuyện với giáo vụ) |
| 8 | Cập nhật thông tin liên hệ cá nhân | Có sẵn + Sửa | Có từ trước ở `/tai-khoan`; nay thêm mục "Tài khoản" vào menu PH |
