# UC-008: Tạo và giao bài tập

- **Status:** Approved · **Version:** 1.1 · **Owner:** BA · **Approver:** chủ dự án
- **Related requirements:** FR-027, FR-028 · BR-048 (điểm câu), BR-049 (máy trạng thái bài)
- **Related features:** FEAT-028, FEAT-029 · **Channel:** Cổng GV (máy tính)
- **Primary actor:** Giáo viên chính của lớp · **Priority:** P0

## 1. Goal and success outcome
GV soạn bài gồm 3 dạng câu và giao cho lớp; sau khi giao câu hỏi không đổi được để công bằng giữa các HS.

## 2. Preconditions
GV là `classes.teacherId` (GV dạy thay không tạo bài).

## 3. Trigger
`/giao-vien/lop/[id]` → thẻ "Bài tập" → "Tạo bài tập" (`/giao-vien/bai-tap/moi?lop=<id>`).

## 4. Main success flow
1. Form: Tên bài*, Hướng dẫn, Hạn nộp (giờ VN)* — mặc định 7 ngày sau lúc 21:00, "Cho phép nộp muộn".
2. "Tạo bài (nháp)" → DRAFT → chuyển trang soạn "Đã tạo bài tập. Thêm câu hỏi rồi giao cho lớp.".
3. Thẻ "Thêm câu hỏi": Dạng (Trắc nghiệm 1 đáp án / Trả lời ngắn tự chấm / Tự luận GV chấm), Điểm (mặc định 1, bước 0,25), Nội dung; MCQ: các đáp án A–F mỗi đáp án một ô nhập (2–6), ô tròn trống bên trái để tích đáp án đúng, "Thêm đáp án" / "×" để thêm bớt; SHORT: đáp án chấp nhận mỗi dòng.
4. "Thêm câu hỏi" → câu mới cuối danh sách; tiêu đề trang cập nhật số câu và tổng điểm.
5. Nút "Quản lý bài" (đầu trang) → hộp thoại, tab "Quản lý bài" → "Giao bài cho lớp" (xác nhận "Sau khi giao sẽ không sửa được câu hỏi. Tiếp tục?") → PUBLISHED, "Đã giao bài cho lớp.".

## 5. Alternate flows
### A1 — Sửa/xóa câu (chỉ DRAFT)
1. "Sửa hoặc xóa" ở từng câu → form sửa; "Xóa câu này" (xác nhận) → đánh lại thứ tự.
### A2 — Đóng / mở lại
1. Hộp thoại "Quản lý bài" → công tắc mở/đóng: PUBLISHED → tắt → CLOSED (HS không làm/nộp nữa); CLOSED → bật → PUBLISHED.
### A3 — Sửa thông tin bài
1. Hộp thoại "Quản lý bài" → tab "Chi tiết" sửa tên, hướng dẫn, hạn, cho nộp muộn ở mọi trạng thái; bài đã giao mà đổi hạn thì hạn mới phải ở tương lai.

## 6. Exception / failure flows
| ID | Điều kiện | Thông điệp | Mã |
|---|---|---|---|
| E1 | Giao bài chưa có câu | "Bài cần ít nhất một câu hỏi trước khi giao." | NO_QUESTIONS |
| E2 | Giao bài khi hạn đã qua | "Hạn nộp đã qua. Hãy sửa hạn nộp trước khi giao bài." | DUE_IN_PAST |
| E3 | Sửa/xóa câu khi không còn DRAFT | "Chỉ sửa câu hỏi khi bài còn ở trạng thái nháp." | NOT_DRAFT |
| E4 | MCQ < 2 hoặc > 6 lựa chọn, lựa chọn trống | "Trắc nghiệm cần 2–6 lựa chọn, không để trống." | INVALID_QUESTION |
| E5 | MCQ đáp án ngoài phạm vi / chưa chọn | "Chọn đáp án đúng." | INVALID_QUESTION |
| E6 | SHORT không có đáp án | "Nhập ít nhất một đáp án được chấp nhận." | INVALID_QUESTION |
| E7 | Điểm ≤ 0, > 100, lệch bước | "Điểm từ 0,25 đến 100, bước 0,25." | INVALID_QUESTION |
| E8 | Đổi hạn bài đã giao về quá khứ | Lỗi ô hạn "Chọn thời điểm trong tương lai." | DUE_IN_PAST |
| E9 | GV khác/GV dạy thay mở bài | 404 | Forbidden |

## 7. Business rules and validations
BR-048, BR-049. Tên 3–200, hướng dẫn ≤ 5000, nội dung câu ≤ 5000.

## 8. Permissions and data effects
`assignment.author` + GV chính. Ghi: assignments, questions.

## 9. Postconditions
Bài PUBLISHED có ≥ 1 câu, hạn ở tương lai tại thời điểm giao; HS ghi danh ACTIVE thấy ở "Bài cần làm".

## 10. Non-functional constraints
Đáp án đúng chỉ hiển thị trong cổng GV (in đậm "(đúng)"), không bao giờ trong payload cho HS (UC-009).

## 11. UI/API/data references
SCREEN-029, SCREEN-030 · API-016, API-017 · Q-019, Q-020 · ENT-013, ENT-014.

## 12. Acceptance criteria / test scenarios
TC-023, TC-024, TC-025; TC-UAT-09.

## 13. Open questions / assumptions / history
- Ngân hàng câu hỏi, nhân bản bài, ảnh trong câu hỏi: Pha 2.
