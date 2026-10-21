# 01 — Yêu cầu sản phẩm và SRS (gộp PRD + SRS)

Phạm vi: Pha 1 (MVP). ID là cố định, không đánh số lại.

## 1. Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| Lead | Khách tiềm năng sinh ra từ form học thử hoặc nhập tay |
| Khóa học (Course) | Chương trình mẫu: môn, khối lớp, số buổi, lộ trình |
| Lớp (Class) | Một lần mở khóa: giáo viên, phòng, lịch cố định, sĩ số |
| Buổi (Session) | Một lần học cụ thể của lớp, có giờ bắt đầu/kết thúc |
| Ghi danh (Enrollment) | Học sinh thuộc một lớp |
| Bài tập (Assignment) | Bộ câu hỏi giao cho một lớp, có hạn nộp |
| Bài nộp (Submission) | Bài làm của một học sinh cho một bài tập |

## 2. Yêu cầu chức năng

### Công khai và tuyển sinh
| ID | Yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-001 | Trang chủ giới thiệu học viện, các môn, khóa nổi bật, lời kêu gọi đăng ký học thử | Hiển thị đúng môn/khóa đã xuất bản; không có khóa ẩn |
| FR-002 | Danh mục khóa học lọc theo môn và khối lớp | Lọc `?mon=toan&khoi=9` chỉ trả khóa của môn đó có `gradeFrom ≤ 9 ≤ gradeTo` |
| FR-003 | Chi tiết khóa học: mô tả, đối tượng, số buổi, học phí tham khảo, mục tiêu, lộ trình, các lớp đang tuyển | Khóa chưa xuất bản trả 404 |
| FR-004 | Form học thử: tên phụ huynh, SĐT (bắt buộc), email (tùy chọn), tên học sinh, khối lớp, môn quan tâm, khóa (tùy chọn), ghi chú, đồng ý liên hệ (bắt buộc) | SĐT chuẩn hóa về `+84…`; trùng SĐT với lead đang mở → thêm hoạt động vào lead cũ, không tạo lead mới |
| FR-005 | Chống spam form công khai | Quá 5 lần/10 phút/IP → báo lỗi thân thiện; ô honeypot có giá trị → bỏ qua âm thầm |
| FR-006 | Danh sách lead cho Staff/Admin: lọc trạng thái, môn; tìm theo tên/SĐT | Lead NEW quá 24 giờ được đánh dấu "quá hạn" |
| FR-007 | Đổi trạng thái lead theo máy trạng thái (BR-010) | Chuyển sai luồng bị từ chối; LOST bắt buộc lý do |
| FR-008 | Ghi chú/hoạt động cho lead | Mỗi hoạt động có người thực hiện và thời điểm |
| FR-009 | Chuyển lead thành học viên trong một giao dịch | Tạo tài khoản học sinh, tạo hoặc dùng lại phụ huynh theo SĐT, liên kết, tùy chọn ghi danh lớp; lead → ENROLLED; lỗi ở bước nào thì không bước nào được lưu |

### Tài khoản và phân quyền
| ID | Yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-010 | Đăng nhập bằng email hoặc SĐT + mật khẩu; đăng xuất | Phiên lưu trong cookie httpOnly, hết hạn sau 7 ngày |
| FR-011 | Khóa đăng nhập 15 phút sau 5 lần sai liên tiếp | Lần thứ 6 trong thời gian khóa bị từ chối kể cả khi đúng mật khẩu |
| FR-012 | Đổi mật khẩu; tài khoản do Staff/Admin tạo phải đổi mật khẩu ở lần đăng nhập đầu | Chưa đổi thì mọi trang nội bộ chuyển về màn hình đổi mật khẩu |
| FR-013 | Admin quản lý người dùng: tạo, sửa, khóa/mở khóa, đặt lại mật khẩu tạm, chọn vai trò | Đổi vai trò/khóa tài khoản ghi audit; Admin không tự khóa chính mình |
| FR-014 | Liên kết phụ huynh–học sinh | Tối đa 4 phụ huynh cho một học sinh |

### Đào tạo
| ID | Yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-015 | Admin quản lý môn học và khóa học, bật/tắt xuất bản | Slug duy nhất; khóa đang có lớp không xóa được (chỉ ẩn) |
| FR-016 | Admin quản lý phòng học | Tên phòng duy nhất |
| FR-017 | Staff/Admin mở lớp: khóa, giáo viên, phòng, ngày bắt đầu, các thứ trong tuần, giờ bắt đầu/kết thúc, số buổi, sĩ số | Hệ thống sinh đủ `totalSessions` buổi theo các thứ đã chọn, bắt đầu từ ngày bắt đầu |
| FR-018 | Chặn trùng lịch giáo viên và phòng | Có buổi chồng giờ → từ chối, liệt kê từng xung đột (lớp, thời gian) |
| FR-019 | Ghi danh học sinh vào lớp | Chặn khi đủ sĩ số, khi đã ghi danh, khi trùng lịch với lớp đang học của học sinh đó |
| FR-020 | Đổi trạng thái ghi danh: ACTIVE, PAUSED, DROPPED, COMPLETED | Chỉ ACTIVE được tính vào sĩ số và được thấy bài tập |
| FR-021 | Hủy hoặc dời một buổi học, kèm lý do | Dời buổi cũng kiểm tra trùng lịch |
| FR-022 | Lịch tuần: giáo viên (buổi dạy), học sinh (buổi học), phụ huynh (của từng con) | Giờ hiển thị theo `Asia/Ho_Chi_Minh` |

### Điểm danh
| ID | Yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-023 | Giáo viên điểm danh buổi của lớp mình: có mặt / muộn / vắng / có phép, ghi chú | Mở từ 30 phút trước giờ học đến 24 giờ sau giờ kết thúc; mặc định "có mặt" |
| FR-024 | Ngoài khung trên chỉ Staff/Admin sửa được, bắt buộc lý do | Ghi audit trước/sau |
| FR-025 | Học sinh/phụ huynh xem lịch sử chuyên cần và tỷ lệ | Tỷ lệ = (có mặt + muộn) / buổi đã điểm danh |
| FR-026 | Cảnh báo học sinh vắng (không phép) 2 buổi liên tiếp của cùng lớp | Hiện trên dashboard Staff và giáo viên lớp đó |

### Bài tập và chấm điểm
| ID | Yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-027 | Giáo viên tạo bài tập cho lớp mình với câu trắc nghiệm (1 đáp án), trả lời ngắn, tự luận; điểm từng câu | Tổng điểm hiển thị; câu trắc nghiệm có 2–6 lựa chọn |
| FR-028 | Trạng thái bài: DRAFT → PUBLISHED → CLOSED | Chỉ sửa câu hỏi khi DRAFT; PUBLISHED phải có ít nhất 1 câu |
| FR-029 | Học sinh đang học lớp làm bài, lưu nháp, nộp đúng 1 lần | Quá hạn không nộp được, trừ khi bài cho phép nộp muộn (đánh dấu muộn) |
| FR-030 | Tự chấm trắc nghiệm và trả lời ngắn khi nộp | Trả lời ngắn so khớp sau khi bỏ khoảng trắng thừa, không phân biệt hoa thường |
| FR-031 | Giáo viên chấm tự luận, sửa điểm câu tự chấm, nhận xét | Điểm câu không vượt điểm tối đa của câu |
| FR-032 | Giáo viên công bố kết quả | Trước khi công bố, học sinh/phụ huynh không thấy điểm và đáp án đúng; API/server không trả đáp án |
| FR-033 | Bảng điểm lớp cho giáo viên; học sinh/phụ huynh xem điểm đã công bố | Sửa điểm sau công bố ghi audit |

### Cổng theo vai trò và audit
| ID | Yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-034 | Trang tổng quan theo vai trò | Admin/Staff: lead mới/quá hạn, lớp đang chạy, cảnh báo vắng · GV: buổi hôm nay, bài chờ chấm · HS: lịch tuần, bài cần làm, điểm mới · PH: chọn con, lịch, chuyên cần, điểm |
| FR-035 | Nhật ký audit | Ghi cho: đổi vai trò/khóa tài khoản, sửa điểm danh ngoài khung, sửa điểm sau công bố, chuyển lead; Admin xem được, không ai xóa được |

## 3. Yêu cầu phi chức năng

| ID | Yêu cầu | Đo bằng |
|---|---|---|
| NFR-001 | Mọi thao tác đọc/ghi dữ liệu nội bộ kiểm tra quyền phía server (vai trò + phạm vi dữ liệu) | Unit test policy + kiểm thử truy cập chéo |
| NFR-002 | Mobile-first, dùng được ở 360px, không cuộn ngang | Kiểm tra thủ công/Playwright viewport 360 |
| NFR-003 | WCAG 2.1 AA: tương phản ≥ 4.5:1, focus rõ, ô nhập có nhãn, dùng được bằng bàn phím | Kiểm tra token màu + axe (Pha 1.5) |
| NFR-004 | Trang công khai có metadata SEO và render phía server | Xem source HTML |
| NFR-005 | DB lưu UTC; hiển thị `Asia/Ho_Chi_Minh` | Unit test tiện ích ngày giờ |
| NFR-006 | Mật khẩu băm Argon2id; không log mật khẩu, token, dữ liệu học sinh | Review code |
| NFR-007 | Mọi danh sách có trạng thái rỗng; mọi form có thông báo lỗi rõ | Review UI |
| NFR-008 | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` đều xanh trước khi đóng pha | Chạy lệnh |

## 4. Quy tắc nghiệp vụ

Xem [06-business-rules-and-states.md](06-business-rules-and-states.md).
