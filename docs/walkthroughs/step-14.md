# Báo Cáo Hoàn Thành Bước 14: M05 Giai Đoạn 3 - AI Bổ Sung Giáo Trình & Video Bài Giảng

## 1. Mục Tiêu & Phạm Vi (Scope)
Thực hiện các tính năng Giai đoạn 3 của Phân hệ M05 (Smart Curriculum & Video Pipeline) theo `docs/CORELINK_MASTER.md`:
- **TC-074 (FR-503 / AI-02)**: AI đối soát giáo trình với chuẩn khung năng lực (CEFR, GDPT 2018), phát hiện khoảng trống mục tiêu (missing objectives) và sinh đề xuất bổ sung. Trưởng bộ môn phê duyệt/từ chối từng đề xuất. Mục tiêu được chấp thuận chuyển `is_ai = true` và nâng version (v2).
- **TC-075 (FR-506 / AI-04)**: Video bài giảng mức 1 (`slides_tts`, ≤ 10 phút / 480s). DB Check constraint `ck_vid_render` ngăn chặn dựng phim khi kịch bản chưa được phê duyệt (`script_approved_by IS NULL`). Khi đã duyệt kịch bản, cho phép render video hoàn chỉnh kèm slide, thuyết minh TTS và phụ đề.

---

## 2. Các Thành Phần Triển Khai

### Backend (NestJS + Prisma + MySQL 8.4)
- **Service**: `apps/api/src/modules/video-curriculum/video-curriculum.service.ts`
  - `scanMissingObjectives(curriculumId, framework)`: Đối chiếu các chuẩn đầu ra với các nodes hiện có, trả về danh sách chuẩn thiếu và các đề xuất bổ sung tương ứng.
  - `reviewSuggestion(suggestionId, approved, reviewerId)`: Cập nhật đề xuất; nếu duyệt, ghi nhận node vào curriculum với `is_ai: true` và version tăng lên 2.
  - `generateVideoScript(lessonId, level)`: Sinh kịch bản phân cảnh (scenes), slide prompts, kịch bản đọc TTS và tính toán tổng thời lượng chuẩn hóa (≤ 10 phút).
  - `approveScript(videoId, approvedBy)`: Phê duyệt kịch bản và gán `script_approved_by`.
  - `renderVideo(videoId)`: Kiểm tra điều kiện tiên quyết kịch bản đã duyệt; tuân thủ ràng buộc `ck_vid_render`.
- **Controller**: `apps/api/src/modules/video-curriculum/video-curriculum.controller.ts`
  - `POST /video-curriculum/scan-suggestions`: Quét và sinh đề xuất.
  - `POST /video-curriculum/suggestions/:id/review`: Phê duyệt hoặc từ chối đề xuất.
  - `POST /video-curriculum/videos/generate-script`: Tạo kịch bản phân cảnh video.
  - `POST /video-curriculum/videos/:id/approve-script`: Duyệt kịch bản.
  - `POST /video-curriculum/videos/:id/render`: Dựng video bài giảng.
- **Module**: `apps/api/src/modules/video-curriculum/video-curriculum.module.ts` tích hợp vào `apps/api/src/app.module.ts`.

### Automated E2E Testing
- File: `apps/api/test/video-curriculum.e2e-spec.ts`
  - 5/5 test cases đạt 100% PASS:
    1. AI đối soát giáo trình với chuẩn CEFR A2 và sinh đề xuất bổ sung.
    2. Trưởng bộ môn từ chối 1 đề xuất và chấp thuận 1 đề xuất (`is_ai: true`, version 2).
    3. AI sinh kịch bản video bài giảng mức 1 (`slides_tts` ≤ 10 phút / 480s).
    4. Từ chối dựng video (HTTP 400 Bad Request) khi kịch bản chưa được phê duyệt.
    5. Duyệt kịch bản và tiến hành dựng video thành công.

### Frontend (Next.js 15 Tailwind UI)
- `apps/web/src/app/teacher/curriculum/suggestions/page.tsx`: Giao diện đối soát chuẩn đầu ra (CEFR & GDPT 2018), xem danh sách khoảng trống mục tiêu, duyệt/từ chối đề xuất AI.
- `apps/web/src/app/teacher/curriculum/videos/page.tsx`: Giao diện quản lý quy trình dựng video bài giảng AI, hiển thị visual prompt từng cảnh, kịch bản thuyết minh TTS, bộ đếm thời lượng ≤ 10 phút, kiểm soát trạng thái duyệt kịch bản và trình giả lập dựng video tương tác.
- Cập nhật thanh điều hướng liên kết tại `apps/web/src/app/teacher/curriculum/page.tsx`.

---

## 3. Kết Quả Kiểm Thử
- **E2E Tests**: 5/5 passed.
- **Web Build**: Tất cả 49 routes Next.js compile và prerender tĩnh thành công 100%.
