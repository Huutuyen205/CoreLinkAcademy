# UC-020: Nhập lead thủ công

- **Status:** Approved (bổ sung phiên 3, GAP-01) · **Version:** 1.0 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-006 (nhập tay), FR-008 · BR-001, BR-004, BR-011, BR-012
- **Related features:** FEAT-007 · **Channel:** Cổng quản lý
- **Primary actor:** Staff · **Supporting:** Admin · **Priority:** P0

## 1. Goal and success outcome
Khách gọi điện, đến trực tiếp hoặc được giới thiệu cũng có lead để theo dõi như khách từ website — không bỏ sót, không trùng.

## 2. Preconditions
STAFF/ADMIN.

## 3. Trigger
`/quan-ly/lead` → nút "Nhập lead" → `/quan-ly/lead/moi`.

## 4. Main success flow
1. Form: Nguồn* (Gọi điện / Đến trực tiếp / Được giới thiệu / Khác), Họ tên phụ huynh*, SĐT*, Email, Họ tên học sinh*, Khối, Môn quan tâm, Khóa học, Ghi chú.
2. Staff nhập, bấm "Tạo lead".
3. Hệ thống validate, chuẩn hóa SĐT, kiểm tra lead đang mở trùng SĐT → không có.
4. Tạo lead NEW nguồn đã chọn + hoạt động CREATED "Nhập tay bởi giáo vụ (nguồn: Gọi điện)." có `actorId`.
5. Chuyển `/quan-ly/lead/[id]` "Đã tạo lead.".

## 5. Alternate flows
- **A1** Khóa học chọn không thuộc môn đã chọn → hệ thống tự đặt môn theo khóa.

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Có lead đang mở cùng SĐT | "SĐT này đang có lead chưa xử lý xong." + liên kết "Mở lead hiện có" | DUPLICATE_OPEN_LEAD |
| E2 | Validate (SĐT sai, tên ngắn…) | Lỗi từng ô, giữ giá trị | validate |
| E3 | Nguồn không hợp lệ | "Chọn nguồn khách." | validate |

## 7. Business rules and validations
BR-001, BR-004, BR-011 (trùng → từ chối, khác với form công khai), BR-012 (nguồn hợp lệ).

## 8. Permissions and data effects
`lead.manage`. Ghi: leads, lead_activities. Không qua rate limit, không có ô đồng ý (Staff tự xác nhận khi tư vấn).

## 9. Postconditions
Lead NEW tính vào "Lead mới" và quá hạn 24h như lead web.

## 10. Non-functional constraints
Như form học thử (nhãn, 360px).

## 11. UI/API/data references
SCREEN-011 · API-021 · ENT-011, ENT-012.

## 12. Acceptance criteria / test scenarios
- TC-039: schema nhập tay hợp lệ/không hợp lệ.
- TC-040 (integration): trùng lead mở → DUPLICATE_OPEN_LEAD, số lead không đổi.
- TC-045: nguồn ngoài 4 giá trị bị từ chối.

## 13. Open questions / assumptions / history
- DECISION-D17 (2026-10-21): nhập tay trùng → từ chối (Staff đang nhìn thấy dữ liệu nên chỉ cần mở lead cũ), khác form công khai (gộp âm thầm).
