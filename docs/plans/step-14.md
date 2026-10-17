# KẾ HOẠCH BƯỚC 14: AI BỔ SUNG GIÁO TRÌNH & VIDEO BÀI GIẢNG (GĐ3)
*Mã bước: STEP-14 | Nhánh: `step-14-video-curriculum` | Trạng thái: Đang thực hiện*

---

## 1. Mục tiêu & Phạm vi
Triển khai BƯỚC 14 thuộc Giai đoạn 3 (GĐ3) theo đặc tả `CORELINK_MASTER.md`:
- **Nghiệp vụ M05 mở rộng (GĐ3)**:
  - FR-503 / AI-02 (TC-074): Đối soát cây giáo trình với khung chuẩn (`standards`), AI đề xuất mục tiêu còn thiếu (`curriculum_suggestions`), Trưởng bộ môn duyệt/bỏ từng đề xuất, tạo phiên bản giáo trình mới với nhãn "AI".
  - FR-506 / AI-04 (TC-075): Video bài giảng mức 1 (slides_tts <= 10 phút). Quy tắc nghiêm ngặt: chỉ dựng video sau khi kịch bản được duyệt (`ck_vid_render`), ghép slide thương hiệu + giọng đọc TTS + phụ đề, hoàn tất dưới 15 phút.
- **2 Test cases**:
  1. `TC-074` (FR-503): Đề xuất bổ sung giáo trình từ AI, Trưởng bộ môn từ chối 1 đề xuất và duyệt 1 đề xuất; chỉ đề xuất được duyệt vào phiên bản mới mang nhãn "AI".
  2. `TC-075` (FR-506): Video chỉ dựng sau khi duyệt kịch bản (nếu chưa duyệt bị chặn với mã 400); duyệt xong dựng video thành công có phụ đề và thời lượng <= 10 phút.
- **Màn hình Frontend**:
  - `apps/web/src/app/teacher/curriculum/suggestions/page.tsx` (So sánh khung chuẩn, xem đề xuất AI, duyệt/từ chối).
  - `apps/web/src/app/teacher/curriculum/videos/page.tsx` (Sinh kịch bản video AI, duyệt kịch bản, tiến trình dựng video FFmpeg/TTS).

---
