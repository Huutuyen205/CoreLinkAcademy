# UC-003: Chuyển lead thành học viên

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-009, FR-014, FR-019 · BR-001, BR-006, BR-007, BR-008, BR-020..BR-022
- **Related features:** FEAT-009 · **Channel:** Cổng quản lý
- **Primary actor:** Staff · **Supporting:** Admin; Phụ huynh (nhận mật khẩu ngoài hệ thống)
- **Priority:** P0

## 1. Goal and success outcome
Sau khi phụ huynh đồng ý nhập học, một thao tác tạo đủ tài khoản học sinh, phụ huynh, liên kết và (nếu có) ghi danh lớp — hoặc không tạo gì nếu có lỗi.

## 2. Preconditions
- Actor STAFF/ADMIN.
- Lead ở NEW, CONTACTED, TRIAL_SCHEDULED hoặc TRIAL_DONE.

## 3. Trigger
Ở `/quan-ly/lead/[id]`, thẻ "Chuyển thành học viên", bấm "Chuyển thành học viên".

## 4. Main success flow
1. Form điền sẵn: họ tên HS, khối, họ tên PH, SĐT PH (= SĐT lead), email PH (= email lead). Thêm email/SĐT HS (tùy chọn), chọn lớp (tùy chọn; danh sách "MÃ — Khóa (còn N chỗ)" của lớp OPEN/IN_PROGRESS chưa đầy).
2. Staff kiểm tra, bấm gửi; nút "Đang chuyển…".
3. Hệ thống validate, sinh và băm 2 mật khẩu tạm.
4. Transaction: kiểm tra lead → tìm/tạo PARENT theo SĐT → tạo STUDENT (mã `HSyyNNNN`) → guardianship → ghi danh (nếu chọn) → lead ENROLLED + `convertedStudentId` → hoạt động CONVERTED → audit `lead.convert`.
5. Form được thay bằng: "Đã chuyển thành học viên. Mã học sinh: HS26xxxx." và thẻ cảnh báo "Mật khẩu tạm — chỉ hiển thị một lần" liệt kê tài khoản mới (họ tên, đăng nhập, mật khẩu); liên kết "Xem danh sách học viên".
6. Staff gửi thông tin đăng nhập cho phụ huynh qua kênh ngoài hệ thống (điện thoại/Zalo — ngoài phạm vi).

## 5. Alternate flows
### A1 — SĐT phụ huynh đã có tài khoản PARENT
1. Ở bước 4 dùng lại tài khoản đó, không cấp mật khẩu mới; hoạt động ghi "liên kết phụ huynh có sẵn …". Thẻ mật khẩu chỉ có HS (nếu HS có thông tin đăng nhập).
### A2 — Học sinh không có email/SĐT (DECISION-D12)
1. Tài khoản HS vẫn được tạo nhưng không có thông tin đăng nhập; thẻ ghi chú "Học sinh chưa có email/SĐT nên chưa đăng nhập được. Admin có thể bổ sung và đặt lại mật khẩu…".
### A3 — Không chọn lớp
1. Bỏ qua ghi danh; ghi danh sau ở UC-006.

## 6. Exception / failure flows (mọi trường hợp: không lưu bản ghi nào)
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Lead đã ENROLLED/LOST (vd. hai Staff cùng chuyển) | "Lead đã nhập học hoặc đã đóng, không chuyển được." | INVALID_TRANSITION |
| E2 | SĐT PH thuộc tài khoản không phải PARENT | Lỗi ô SĐT "SĐT này đã được dùng cho tài khoản khác." | PHONE_TAKEN_BY_OTHER_ROLE |
| E3 | Email PH mới đã dùng | Lỗi ô email PH | DUPLICATE_EMAIL |
| E4 | SĐT/email HS đã dùng | Lỗi ô tương ứng | DUPLICATE_PHONE / DUPLICATE_EMAIL |
| E5 | SĐT HS = SĐT PH, email HS = email PH | "SĐT học sinh phải khác SĐT phụ huynh." / tương tự email | validate |
| E6 | Lớp đầy / trùng lịch HS / lớp đóng / HS đã ghi danh | Thông điệp của UC-006 | CLASS_FULL, SCHEDULE_CONFLICT, CLASS_CLOSED, ALREADY_ENROLLED |
| E7 | Va chạm mã HS (hai chuyển đồng thời) | Không thấy lỗi — hệ thống tự thử lại tối đa 3 lần | — |
| E8 | Lỗi DB | Trang lỗi chung | — |

## 7. Business rules and validations
BR-001, BR-006 (mật khẩu tạm 10 ký tự có chữ và số), BR-007, BR-008, BR-020..BR-022, BR-045 không áp dụng.

## 8. Permissions and data effects
- `lead.manage`.
- Tạo: users (STUDENT, có thể PARENT), guardianships, enrollments (tùy chọn), lead_activities, audit_logs. Sửa: leads (`status`, `convertedStudentId`).
- Tài khoản mới `mustChangePassword = true`.

## 9. Postconditions
- **Thành công:** lead ENROLLED, liên kết tới HS; HS có ≥ 1 phụ huynh; ghi danh ACTIVE nếu chọn lớp.
- **Thất bại:** không có user/guardianship/enrollment mới; lead giữ trạng thái cũ.

## 10. Non-functional constraints
Mật khẩu tạm chỉ trả trong response của lần gửi, không lưu dạng rõ, không log; tải lại trang là mất (cố ý).

## 11. UI/API/data references
SCREEN-010 · API-004 · Q-011 · ENT-001, ENT-003, ENT-009, ENT-011, ENT-012, ENT-017.

## 12. Acceptance criteria / test scenarios
- TC-007 (integration): chuyển lead → HS + PH + liên kết + lead ENROLLED + audit.
- TC-008 (integration): lớp đầy → số user/guardianship/enrollment không đổi, lead giữ trạng thái.
- Given PH SĐT `+84900000201` đã tồn tại, When chuyển lead SĐT đó, Then không tạo PARENT mới, HS mới liên kết với PH1.

## 13. Open questions / assumptions / history
- QUESTION-Q07: đăng nhập bằng mã HS cho HS nhỏ tuổi (Pha 2).
- v1.1: bảng ngoại lệ đầy đủ, A1–A3.
