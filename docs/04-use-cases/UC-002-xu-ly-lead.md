# UC-002: Xử lý lead (lọc, đổi trạng thái, ghi chú)

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-006, FR-007, FR-008 · BR-003, BR-004, BR-010, BR-016
- **Related features:** FEAT-006..FEAT-008 · **Channel:** Cổng quản lý
- **Primary actor:** Staff · **Supporting:** Admin
- **Priority:** P0

## 1. Goal and success outcome
Mọi lead NEW được liên hệ và đổi trạng thái trong 24 giờ (GOAL-002); lịch sử tư vấn được ghi lại.

## 2. Preconditions
Đã đăng nhập vai trò STAFF hoặc ADMIN, đã đổi mật khẩu tạm.

## 3. Trigger
Mở `/quan-ly/lead` (menu "Lead" hoặc ô "Lead mới"/"Lead quá 24 giờ" ở tổng quan).

## 4. Main success flow
1. Hệ thống hiển thị danh sách lead mới nhất trước (20/trang): phụ huynh + học sinh (khối), SĐT, quan tâm, trạng thái + nhãn "Quá hạn", ngày tạo.
2. Staff lọc theo trạng thái/môn hoặc tìm tên/SĐT, bấm "Lọc".
3. Staff mở một lead → `/quan-ly/lead/[id]`: thông tin, ghi chú gốc, lịch sử hoạt động; cột phải: Đổi trạng thái, Thêm ghi chú, Chuyển thành học viên.
4. Staff gọi điện (nút SĐT là liên kết `tel:`), thêm ghi chú "Đã gọi, hẹn thứ Bảy học thử" → hoạt động NOTE.
5. Staff chọn trạng thái mới (chỉ hiện trạng thái hợp lệ từ trạng thái hiện tại), bấm "Cập nhật" → hoạt động STATUS_CHANGE "NEW → CONTACTED".
6. Thông báo "Đã cập nhật trạng thái."; trang làm mới.

## 5. Alternate flows
### A1 — Chỉ xem lead quá hạn
1. Bấm "Chỉ xem lead mới quá 24 giờ chưa xử lý" (`?quahan=1`) → chỉ NEW có `createdAt` < now − 24h.
### A2 — Đánh dấu không theo học
1. Chọn "Không theo học", nhập lý do (≤ 255) → LOST, lưu `lostReason`, hoạt động ghi lý do.
### A3 — Mở lại lead LOST
1. Lead LOST chỉ có lựa chọn "Đã liên hệ" → CONTACTED, xóa `lostReason`.
### A4 — Tìm theo SĐT
1. `q` chuẩn hóa được thành SĐT (vd. `0912345678`) → so khớp chính xác `+84912345678`; ngược lại tìm "chứa" trong tên phụ huynh, tên học sinh, chữ số SĐT.

## 6. Exception / failure flows
- **E1 — Chuyển sai luồng** (sửa HTML): "Không thể chuyển lead sang trạng thái này." (`INVALID_TRANSITION`).
- **E2 — LOST không lý do:** lỗi ô lý do "Cần nhập lý do khi đánh dấu không theo học." (`LOST_REASON_REQUIRED`).
- **E3 — Cập nhật đồng thời:** người khác vừa đổi trạng thái → "Lead vừa được người khác cập nhật. Vui lòng tải lại trang." (`STALE`), không ghi đè.
- **E4 — Ghi chú rỗng/quá dài:** "Nhập nội dung ghi chú." / "Tối đa 2000 ký tự.".
- **E5 — Lead không tồn tại / id sai:** 404.
- **E6 — Vai trò khác:** chuyển về tổng quan vai trò đó.

## 7. Business rules and validations
BR-003 (quá hạn), BR-010 (máy trạng thái), BR-016 (chống ghi đè). Ghi chú 1–2000 ký tự.

## 8. Permissions and data effects
- `lead.manage` (ADMIN, STAFF). Đọc/ghi: leads, lead_activities.
- Đổi trạng thái: `leads.status`, `lostReason`; thêm `lead_activities` (STATUS_CHANGE/NOTE, `actorId`).
- Không audit (lead activity là lịch sử nghiệp vụ).

## 9. Postconditions
Trạng thái lead phản ánh bước tư vấn; mỗi thay đổi có một hoạt động có người và thời điểm.

## 10. Non-functional constraints
Bảng → danh sách dòng ở < 768px; bộ lọc là form GET (chia sẻ URL được).

## 11. UI/API/data references
SCREEN-008, 009, 010 · Q-005, Q-006, Q-007, API-002, API-003 · ENT-011, ENT-012.

## 12. Acceptance criteria / test scenarios
- TC-005: mọi cặp chuyển trạng thái hợp lệ/không hợp lệ theo BR-010.
- TC-006: LOST không lý do → từ chối.
- Given lead NEW tạo 25 giờ trước, Then nhãn "Quá hạn" ở danh sách và chi tiết; ô "Lead quá 24 giờ chưa xử lý" ≥ 1.

## 13. Open questions / assumptions / history
- `assignedToId` (phân công lead) chưa dùng — Pha 2.
- v1.1: thêm A1–A4, E3 (STALE).
