# 03 — Actors, vai trò và phân quyền (RBAC + phạm vi dữ liệu)

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — thêm ma trận theo thao tác, hành vi từ chối, cách test |
| Owner | Trợ lý (BA + Security) · Phê duyệt: chủ dự án |
| Nguồn sự thật trong code | `src/server/auth/policy.ts` (vai trò → quyền), `src/server/auth/scope.ts` (phạm vi), từng service (`assertCan` + kiểm tra phạm vi) |

**Xác thực (authentication)** = biết ai đang đăng nhập: cookie `cl_session` → bảng `sessions` → `users` (ACTIVE, chưa hết hạn). **Phân quyền (authorization)** = vai trò + phạm vi dữ liệu, **luôn kiểm tra phía server** trong mỗi Server Action và mỗi trang. Ẩn nút trên UI chỉ là trải nghiệm, không phải phân quyền. Mỗi tài khoản có đúng **một** vai trò (DECISION-D04).

## 1. Vai trò

| ID | Vai trò | Mã | Trang chủ sau đăng nhập | Ghi chú |
|---|---|---|---|---|
| ACT-000 | Khách | — | — | Không có phiên |
| ROLE-001 | Quản trị viên | `ADMIN` | `/quan-ly` | Không tự khóa/tự đổi vai trò |
| ROLE-002 | Giáo vụ / Tư vấn | `STAFF` | `/quan-ly` | Menu không có Người dùng, Khóa học, Môn học, Phòng, Nhật ký |
| ROLE-003 | Giáo viên | `TEACHER` | `/giao-vien` | |
| ROLE-004 | Học sinh | `STUDENT` | `/hoc-sinh` | |
| ROLE-005 | Phụ huynh | `PARENT` | `/phu-huynh` | Chỉ đọc |

## 2. Ma trận quyền theo tài nguyên

C = tạo, R = xem, U = sửa, D = xóa/ẩn, X = thao tác đặc biệt. "own" = trong phạm vi của mình (mục 3).

| Tài nguyên | Khách | Admin | Staff | Teacher | Student | Parent |
|---|---|---|---|---|---|---|
| Môn/khóa đã xuất bản (trang công khai) | R | R | R | R | R | R |
| Môn, khóa (quản trị, gồm bản ẩn) | — | CRUD | — (chỉ thấy tên khóa khi mở lớp) | — | — | — |
| Phòng | — | CRUD | R (khi mở lớp) | R (tên trên lịch) | R (tên trên lịch) | R (tên trên lịch) |
| Lead | C (qua form) | CRU, X chuyển | CRU, X chuyển | — | — | — |
| Người dùng | — | CRUD (D = khóa), X vai trò/khóa/đặt lại MK | C học sinh/phụ huynh, R học sinh/phụ huynh | R own (HS lớp mình) | R self | R self + con |
| Liên kết PH–HS | — | CRUD | CRUD | — | — | R own |
| Lớp, buổi | — | CRUD | CRUD | R own | R own | R own (con) |
| Hủy/dời buổi | — | X | X | — | — | — |
| Ghi danh | — | CRUD | CRUD | R own | R own | R own (con) |
| Điểm danh trong khung | — | CU | CU | CU own | R own | R own (con) |
| Điểm danh ngoài khung | — | U + lý do | U + lý do | R own | R own | R own (con) |
| Bài tập, câu hỏi | — | — | — | CRUD own (GV chính) | R own (PUBLISHED/CLOSED, không có đáp án) | — |
| Bài nộp | — | — | — | R/U chấm own | CRU own (đến khi nộp) | — |
| Kết quả đã công bố + đã chấm | — | — | — | R own | R own | R own (con) |
| Audit log | — | R | — | — | — | — |
| Hồ sơ GV (FR-036) | — | CRU | R | — | — | — |
| Hồ sơ HS/PH, nhập HS hàng loạt (FR-036) | — | CRU | CRU | R own (HS lớp mình, FR-046) | — | — |
| Cấp học, liên kết môn–cấp | — | CRU | — | — | — | — |
| Sửa lớp, dạy thay, học bù, chuyển lớp, lịch tổng (FR-037/038) | — | X | X | — | — | — |
| Tệp bài tập / bài nộp (FR-040) | — | R | R | CRUD own (lớp mình) | R đề; CRD bài làm own (trước khi nộp) | R (con) |
| Giáo trình (FR-042) | — | CRUD, X phân phối | CRUD, X phân phối | R (môn mình dạy / lớp mình) | — | — |
| Tài liệu học tập | — | CRUD, X chia sẻ | CRUD, X chia sẻ | CRUD own, X chia sẻ lớp mình | R (lớp mình, cờ HS) | R (lớp của con, cờ PH) |
| Giáo án | — | R | R | CRUD own | — | — |
| Đề xuất đổi lịch (FR-043) | — | R, X duyệt | R, X duyệt | CRU own (khi chờ) | — | — |
| Đơn xin nghỉ (FR-044) | — | R, X duyệt | R, X duyệt | R, X duyệt (lớp/buổi mình) | — | CR own (con), X rút |
| Thông báo (FR-048) | — | C mọi đối tượng, R đã gửi | như Admin | C cho lớp mình | R own | R own |
| Đánh giá định kỳ (FR-049) | — | R (đã gửi) | R (đã gửi) | CRUD own (nháp), X gửi | R own (đã gửi) | R (con, đã gửi) |
| Nhắn tin (FR-050, D30) | — | Nhóm lớp mọi lớp; 1-1 mọi người | như Admin | Nhóm lớp mình; 1-1 quản lý + mọi thành viên lớp mình | Nhóm lớp mình; 1-1 quản lý, GV + bạn cùng lớp, PH của chính em | Nhóm lớp của con; 1-1 quản lý, GV + PH cùng lớp, con mình |
| Tệp đính kèm tin nhắn | — | Chỉ cuộc trò chuyện mình xem được (không mở tệp tin riêng của người khác) | như Admin | như trên | như trên | như trên |
| Ảnh bài tự luận (FR-031) | — | R | R | R own (lớp mình, khi chấm) | CRD own (trước khi nộp) | R (con) |
| Ảnh đại diện (FR-051) | — | CRUD own, R mọi người | như Admin | như Admin | như Admin | như Admin |
| Đăng ký thông báo đẩy | — | CRUD own (thiết bị) | như Admin | như Admin | như Admin | như Admin |
| Báo cáo + xuất Excel (FR-052) | — | R | R | — | — | — |
| Nhật ký buổi học (FEAT-B2) | — | CRU | CRU | CRU (lớp mình phụ trách hoặc buổi dạy thay) | R own | R (con) |
| Tìm nhanh Ctrl+K (FEAT-B6) | — | HS, PH, GV, lớp, lead | HS, PH, GV, lớp, lead | Lớp mình + HS lớp mình | — | — |
| Xuất lịch .ics (FEAT-B5) | — | — | — | own | own | con đã liên kết (`?con`) |
| Nhắc lịch ngày mai (FEAT-B4) | — | X gửi ngay | X gửi ngay | R (nhận) | R (nhận) | R (nhận) |

Ghi chú: Admin/Staff **không** có màn hình xem bài tập/bài nộp ở Pha 1 (ma trận cũ ghi R nhưng không có FR yêu cầu; chuyển thành Pha 2 — xem 05 §5).

## 3. Phạm vi dữ liệu (ownership)

| Vai trò | Được truy cập | Hàm kiểm tra |
|---|---|---|
| ADMIN | Tất cả | `isManager` |
| STAFF | Tất cả dữ liệu tuyển sinh và đào tạo; không quản lý vai trò, không xem audit, không quản trị danh mục/phòng | `isManager` + `assertCan` |
| TEACHER | Lớp có `classes.teacherId = me` (GV chính) — xem, điểm danh, soạn bài, chấm, bảng điểm; buổi có `class_sessions.teacherId = me` (dạy thay) — xem lớp ở mức buổi của mình, điểm danh buổi đó; học sinh ghi danh vào lớp mình (chuyên cần, điểm của lớp mình) | `canTeacherAccessClass`, `assertCanViewClass`, `assertTeacherOwnsClass`, `assertCanViewStudent` |
| STUDENT | Chính mình; lớp có ghi danh của mình (ACTIVE để làm bài; mọi trạng thái để xem lịch sử/bài đã giao) | `assertCanViewStudent`, kiểm tra enrollment trong service |
| PARENT | Học sinh có liên kết trong `guardianships`; chỉ đọc | `linkedStudentIds`, `canParentViewStudent` |

## 4. Ma trận theo thao tác (permission key → kiểm tra server)

| Permission / thao tác | Vai trò | Điều kiện phạm vi | Từ chối khi | Hành vi từ chối | Audit | Test |
|---|---|---|---|---|---|---|
| `catalog.manage` — lưu/xóa môn, khóa | ADMIN | — | vai trò khác | trang: chuyển về tổng quan; action: 404 | — | TC-036 |
| `room.manage` — lưu/xóa phòng | ADMIN | — | như trên | như trên | — | TC-036 |
| `lead.manage` — xem/lọc/nhập tay/đổi trạng thái/ghi chú/chuyển lead | ADMIN, STAFF | — | TEACHER/STUDENT/PARENT | chuyển về tổng quan | `lead.convert` | TC-036, TC-UAT-13 |
| Gửi form học thử | Khách (mọi người) | — | rate limit, honeypot | thông báo / trang cảm ơn giả | — | TC-004 |
| `user.manage` — danh sách, sửa, khóa, đặt lại MK | ADMIN | Không áp cho chính mình khi đổi vai trò/khóa | STAFF; Admin tự khóa/tự đổi vai trò | 404 / `CANNOT_MODIFY_SELF` | `user.*` (khóa/mở: dây chuyền một cấp HS ↔ PH đã liên kết, mỗi tài khoản một dòng audit `detail.linkedTo` — D31) | TC-036, TC-038 |
| `user.createLearner` — tạo tài khoản | ADMIN (mọi vai trò), STAFF (STUDENT, PARENT) | `canCreateUserWithRole` | STAFF tạo ADMIN/STAFF/TEACHER | 404 | `user.create` | TC-036 |
| `guardian.manage` — liên kết/bỏ liên kết | ADMIN, STAFF | PH phải vai trò PARENT, HS vai trò STUDENT | quá 4 PH, trùng | `MAX_GUARDIANS`, `ALREADY_LINKED` | — | TC-037 |
| `class.manage` — mở/xóa/đổi trạng thái lớp, hủy/dời buổi, xem lớp quản lý | ADMIN, STAFF | — | vai trò khác | chuyển về tổng quan / 404 | `session.reschedule`, `session.cancel`, `class.cancel`, `class.delete` | TC-036 |
| `enrollment.manage` — ghi danh, đổi trạng thái | ADMIN, STAFF | HS vai trò STUDENT và ACTIVE | — | `STUDENT_DISABLED` | — | TC-044 |
| Xem lớp (GV) | TEACHER | GV chính hoặc có buổi dạy thay | lớp của GV khác | 404 | — | TC-035, TC-UAT-13 |
| Điểm danh | TEACHER (own, trong khung), ADMIN, STAFF | `loadSession`: quản lý hoặc GV chính/GV buổi | ngoài khung (GV), thiếu lý do (quản lý) | 404 / `OUTSIDE_WINDOW` / `REASON_REQUIRED` | `attendance.override` | TC-019, TC-020 |
| `assignment.author` — soạn/giao/đóng/chấm/công bố | TEACHER | `classes.teacherId = me` (GV dạy thay không được) | lớp khác | 404 | `grade.update_after_publish` | TC-035 |
| `submission.work` — làm/lưu nháp/nộp | STUDENT | có ghi danh lớp; ACTIVE để làm | không ghi danh / bài DRAFT | 404; `NOT_ACTIVE`, `CLOSED`, `PAST_DUE` | — | TC-028, TC-UAT-13 |
| Xem kết quả, chuyên cần | STUDENT (self), PARENT (con), TEACHER (HS lớp mình, chỉ dữ liệu lớp mình), ADMIN/STAFF | `assertCanViewStudent` | con người khác | 404 | — | TC-034 |
| Xem lịch tuần | TEACHER (buổi mình), STUDENT (lớp mình), PARENT (`?con` phải là con) | `listSessionsInRange` | con không liên kết | 404 | — | TC-034 |
| `audit.read` | ADMIN | — | STAFF | chuyển về tổng quan | — | TC-036 |
| `staff.view` — danh sách/hồ sơ GV, lịch tổng | ADMIN, STAFF (sửa hồ sơ GV: ADMIN) | — | vai trò khác | chuyển về tổng quan | `user.member_status` | E2E 2026-10-21 |
| `document.manage` — giáo trình, phân phối | ADMIN, STAFF | GV: `canManageDocument` (tài liệu/giáo án của mình), chia sẻ chỉ lớp mình phụ trách | tài liệu người khác, giáo án chia sẻ | 404 / `NOT_SHAREABLE` | `document.delete` | E2E: hs lớp khác → 404 |
| Tải tệp `/tep/<id>` | Theo chủ sở hữu tệp | bài tập: GV chính / HS-PH của lớp khi bài đã giao; bài nộp: HS đó, GV lớp, PH của HS; tài liệu: `documentVisibilityWhere` | ngoài phạm vi | 404 | — | E2E: hs3 → 404 |
| `request.handle` — duyệt đề xuất đổi lịch | ADMIN, STAFF | — | — | chuyển về tổng quan | theo thao tác lịch | E2E |
| Duyệt đơn xin nghỉ | ADMIN, STAFF, TEACHER | GV: buổi mình dạy hoặc lớp mình phụ trách | đơn đã xử lý | 404 / `NOT_PENDING` | — | E2E |
| Nhắn 1-1 | theo `canDirectMessage` (`messaging/rules.ts`: trung tâm ↔ mọi người; HS ↔ PH chỉ PH của em; còn lại phải cùng lớp) | kiểm tra lại khi gửi | quan hệ không còn | 404 / `NOT_ALLOWED` | — | `messaging/rules.test.ts`, E2E 2026-10-22 |
| Tải tệp tin nhắn | người xem được cuộc trò chuyện (`canReadMessage`) — không có ngoại lệ cho quản lý | DIRECT: thành viên; CLASS: thành viên lớp/quản lý | ngoài cuộc trò chuyện | 404 | — | E2E: Admin mở ảnh tin riêng HS → 404 |
| Ảnh câu tự luận | HS (tải/xóa trước khi nộp, câu ESSAY của bài mình), GV lớp, PH của HS | như bài nộp | câu không phải ESSAY, đã nộp, HS/PH khác | 404 / `ALREADY_SUBMITTED` | — | E2E 2026-10-22 |
| Bật/tắt thông báo đẩy | mọi người đã đăng nhập | chỉ thiết bị/đăng ký của mình | — | — | — | E2E 2026-10-22 |
| `report.view` | ADMIN, STAFF | — | vai trò khác | 404 (route xuất Excel) | — | E2E |
| Trợ lý hỏi đáp (chatbot) | — | X (mọi dữ liệu quản lý) | X (như Admin trừ nhật ký) | X own (lớp, buổi, bài của mình) | X self | X own (con đã liên kết) |
| Soạn bài với AI | — | — | — | X own (buổi mình dạy; lưu bài tập nháp chỉ khi là GV phụ trách lớp) | — | — |
| AI gợi ý chấm, chấm phiếu giấy | — | — | — | X own (bài của lớp mình phụ trách) | — | — |
| Đổi mật khẩu | Mọi người đã đăng nhập (kể cả `mustChangePassword`) | chính mình | — | — | — (thu hồi phiên khác) | TC-012 |

## 5. Điều cấm (không ngoại lệ)

- HS/PH không bao giờ nhận `correctOption`/`acceptedAnswers`/điểm/nhận xét trước khi bài được công bố; sau công bố, bài chưa chấm vẫn không hiện điểm (BR-047).
- Không ai sửa/xóa audit log.
- Admin không tự khóa hoặc tự đổi vai trò của chính mình (tránh mất quyền quản trị cuối cùng).
- Không tin tham số ẩn từ client (`studentIds`, `answerIds`, `classId`): service luôn đối chiếu với DB (vd. chỉ upsert điểm danh cho HS thuộc lớp; `answerId` phải thuộc bài nộp đang chấm).
- Tài khoản `DISABLED` không có phiên hợp lệ (bị thu hồi khi khóa, và `getCurrentActor` bỏ qua user không ACTIVE).
- **AI** (docs/23): không bao giờ ghi điểm, giao bài, công bố kết quả hay đọc CSDL trực tiếp; chatbot chỉ gọi hàm có sẵn kiểm tra phạm vi; không gửi dữ liệu cá nhân học sinh cho nhà cung cấp AI (trừ bài làm không kèm tên khi giáo viên chủ động bấm gợi ý chấm).

## 6. Hành vi khi bị từ chối (DECISION-D11, D14)

| Tình huống | Kết quả |
|---|---|
| Chưa đăng nhập vào trang/action nội bộ | Chuyển `/dang-nhap` |
| `mustChangePassword` vào trang/action nội bộ (trừ đổi mật khẩu) | Chuyển `/doi-mat-khau` |
| Sai vai trò khi vào khu nội bộ (vd. HS mở `/quan-ly`) | Chuyển về tổng quan của vai trò mình |
| Đúng vai trò nhưng sai phạm vi bản ghi (IDOR), hoặc bản ghi không tồn tại | Trang 404 "Không tìm thấy trang" (không tiết lộ bản ghi tồn tại) |
| Action bị gọi trực tiếp với dữ liệu ngoài phạm vi | `ForbiddenError` → `notFound()` |

## 7. Cách kiểm thử quyền

- **Unit (đã có):** `policy.test.ts` (TC-036, TC-038), `scope.test.ts` (TC-034, TC-035): đúng vai trò + đúng phạm vi → cho phép; đúng vai trò + khác phạm vi → từ chối; sai vai trò → từ chối.
- **Thủ công / E2E (TC-UAT-13):** bằng tài khoản seed — `gv.van` mở `/giao-vien/lop/<id TOAN9-K1>` → 404; `ph2` mở `/phu-huynh?con=<id HS1>` → 404; `hs3` mở `/hoc-sinh/bai-tap/<id bài lớp Toán>` → 404; `giaovu` mở `/quan-ly/nguoi-dung` → về `/quan-ly`; `hs1` mở `/quan-ly` → về `/hoc-sinh`.
- **Review:** mọi file `actions.ts` bắt đầu bằng `requireRole(...)` (trừ `submitTrialRequestAction`, `login`); mọi `page.tsx` nội bộ gọi `requireRole` (layout không đủ vì request RSC tới trang con không qua layout).
