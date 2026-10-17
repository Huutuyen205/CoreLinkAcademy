# KẾ HOẠCH BƯỚC 5: QUẢN LÝ ĐÀO TẠO — LỚP, LỊCH, PHÒNG, GHI DANH (M03)
*Mã bước: STEP-05 | Nhánh: `step-05-academic` | Độ ưu tiên: P1*

---

## 1. [VAI: BA] Business Analyst & Phạm vi nghiệp vụ
- **Phạm vi yêu cầu**:
  - Module M03: FR-301 đến FR-309.
  - Test case: TC-039 đến TC-050.
  - Màn hình giao diện: S38 (Quản lý lớp học & TKB), S39 (Ghi danh & Chuyển lớp), S27 (Lịch học cá nhân).
- **User Stories & Given/When/Then**:
  - **US-01 (Cây đào tạo & Sĩ số - FR-301, TC-039)**:
    - *Là Giáo vụ/Admin*, tôi muốn xem tổng quan cây Cấp học → Chương trình → Lớp học cùng sĩ số và tỷ lệ lấp đầy để biết lớp nào vắng (dưới 50%) nhằm đẩy mạnh tuyển sinh.
    - *Given* danh sách các lớp với sức chứa (`capacity`) và số học sinh đang hoạt động, *When* truy vấn `v_class_fill`, *Then* hệ thống trả về chính xác `active_students`, `fill_rate` và gắn cờ cảnh báo nếu `fill_rate < 0.5`.
  - **US-02 (Tạo lớp & Sinh lịch tự động - FR-302, TC-040, TC-041, TC-042)**:
    - *Là Giáo vụ*, tôi muốn tạo lớp học mới với lịch lặp tuần (ví dụ Thứ 3 và Thứ 5 từ 18:00 đến 19:30) để hệ thống tự động sinh tất cả các buổi học trong kỳ.
    - *Given* ngày bắt đầu, ngày kết thúc và cấu hình `recurrence`, *When* tạo lớp, *Then* hệ thống tự động sinh các bản ghi `class_sessions`, tự động loại trừ các ngày nghỉ lễ trong bảng `holidays`.
    - *Given* phòng học hoặc giáo viên đã bị phân công dạy lớp khác trong cùng khung giờ, *When* bấm tạo lớp, *Then* hệ thống từ chối với mã HTTP 409 Conflict kèm danh sách chi tiết các buổi và lớp bị xung đột.
  - **US-03 (Lịch tuần đa chiều & Dạy thay - FR-303, FR-304, TC-043, TC-044, TC-045)**:
    - *Là Giáo viên*, tôi muốn xem thời khóa biểu của mình, hoặc đề xuất đổi lịch/dạy thay khi có việc bận đột xuất.
    - *Given* yêu cầu dạy thay, *When* Giáo vụ tìm người thay, *Then* hệ thống chỉ gợi ý các giáo viên đang rảnh lịch và có chuyên môn phù hợp.
    - *Given* đề xuất đổi lịch, *When* Giáo vụ phê duyệt, *Then* hệ thống cập nhật buổi học và gửi thông báo trong 1 phút cho phụ huynh và học sinh.
  - **US-04 (Ghi danh, Chuyển lớp & Chặn lớp đầy - FR-305, TC-046, TC-047, TC-048, TC-049)**:
    - *Là Tư vấn viên/Giáo vụ*, tôi muốn ghi danh học sinh vào lớp học phù hợp.
    - *Given* lớp học đã đủ sĩ số tối đa (`active_students >= capacity`), *When* cố tình ghi danh thêm, *Then* hệ thống chặn lại với lỗi 400 Bad Request ("Lớp học đã đầy sĩ số").
    - *Given* học sinh đã có lịch học trùng với lớp định ghi danh, *When* kiểm tra thời khóa biểu, *Then* hệ thống cảnh báo xung đột 409 Conflict.
    - *Given* học sinh muốn chuyển sang lớp khác, *When* thực hiện chuyển lớp, *Then* hệ thống giữ nguyên toàn bộ lịch sử điểm số, điểm danh và gắn liên kết `transferred_to_enrollment_id`.
  - **US-05 (Cảnh báo xung đột quy định dạy thêm - FR-308, TC-050)**:
    - *Given* giáo viên đang công tác tại trường phổ thông X và học sinh cũng học tại trường X, *When* phân công giáo viên dạy lớp có chương trình phổ thông (`is_school_curriculum = 1`), *Then* hệ thống bật cảnh báo xung đột FR-308 và bắt buộc người thao tác phải nhập lý do giải trình (`conflict_ack_reason`).

---

## 2. [VAI: Tech Lead] Thiết kế kỹ thuật & API Endpoints

### 2.1 Backend Modules (`apps/api/src/modules/academic`)
- `AcademicModule`:
  - `academic.service.ts`:
    - `getTrainingTree(branchId)`: Truy vấn cây cấp học -> chương trình -> lớp kèm số liệu `v_class_fill`.
    - `getClasses(branchId, filters)`: Danh sách lớp học, lọc theo program, status, level.
    - `createClass(branchId, userId, dto)`:
      - Kiểm tra trùng lịch phòng học (`checkRoomConflict`).
      - Kiểm tra trùng lịch giáo viên (`checkTeacherConflict`).
      - Tạo lớp `classes` và sinh `class_sessions` tự động dựa vào `recurrence` + lọc trừ `holidays`.
    - `getSchedule(branchId, user, query)`: Thời khóa biểu tuần theo giáo viên, phòng, lớp hoặc học sinh (bảo đảm RBAC).
    - `enrollStudent(branchId, userId, classId, dto)`:
      - Kiểm tra sĩ số `capacity` (chặn lớp đầy).
      - Kiểm tra xung đột lịch của học sinh.
      - Kiểm tra cảnh báo FR-308 (trùng trường học giữa giáo viên và học sinh).
      - Tạo bản ghi `enrollments`.
    - `transferStudent(branchId, userId, enrollmentId, targetClassId, reason)`:
      - Kiểm tra lớp đích còn chỗ và không trùng lịch.
      - Cập nhật enrollment cũ sang `transferred`, tạo enrollment mới liên kết `transferred_to_enrollment_id`.
    - `requestReschedule(userId, dto)`: Tạo yêu cầu đổi lịch hoặc dạy thay (`reschedule_requests`).
    - `approveReschedule(userId, requestId)`: Duyệt đổi lịch và cập nhật `class_sessions`.
    - `createStudyGroup(userId, classId, name, studentIds)`: Tạo nhóm học tập chờ duyệt (`study_groups`).
    - `approveStudyGroup(userId, groupId)`: Duyệt nhóm học tập.

### 2.2 REST Endpoints
- `GET /api/v1/academic/tree`: Cây đào tạo & tỷ lệ lấp đầy (Admin, Academic, Consultant).
- `GET /api/v1/academic/classes`: Danh sách lớp học kèm `fill_rate` và sĩ số.
- `POST /api/v1/academic/classes`: Tạo lớp học, tự sinh lịch, kiểm tra xung đột phòng/GV (409 Conflict).
- `GET /api/v1/academic/classes/:id`: Chi tiết lớp, danh sách buổi học, học sinh.
- `GET /api/v1/academic/schedule`: Thời khóa biểu theo tuần (lọc theo teacherId, roomId, classId, studentId).
- `POST /api/v1/academic/classes/:id/enroll`: Ghi danh học sinh vào lớp (chặn lớp đầy, kiểm tra FR-308).
- `POST /api/v1/academic/enrollments/:id/transfer`: Chuyển lớp giữ lịch sử học tập.
- `POST /api/v1/academic/enrollments/:id/status`: Đổi trạng thái ghi danh (`active`, `paused`, `stopped`).
- `POST /api/v1/academic/reschedule-requests`: Đề xuất đổi lịch hoặc dạy thay.
- `POST /api/v1/academic/reschedule-requests/:id/approve`: Duyệt đổi lịch.
- `POST /api/v1/academic/study-groups`: Tạo nhóm học tập trong lớp (chờ duyệt).
- `POST /api/v1/academic/study-groups/:id/approve`: Duyệt nhóm học tập.

### 2.3 Frontend Screens (`apps/web`)
1. `apps/web/src/app/(staff)/academic/classes/page.tsx` (S38):
   - Cây đào tạo trực quan: Cấp học > Chương trình > Lớp học.
   - Thẻ hiển thị sĩ số, thanh tiến trình tỷ lệ lấp đầy (% fill rate), cảnh báo vàng/đỏ khi < 50%.
   - Modal tạo lớp học thông minh với bộ cấu hình ngày và lịch lặp tuần (Thứ 2..Chủ nhật).
2. `apps/web/src/app/(staff)/academic/classes/[id]/enrollments/page.tsx` (S39):
   - Danh sách học sinh ghi danh trong lớp.
   - Nút "Ghi danh học viên" và Modal "Chuyển lớp 1-click".
   - Cảnh báo vàng/đỏ FR-308 kèm ô nhập lý do bắt buộc.
3. `apps/web/src/app/(student)/schedule/page.tsx` & `apps/web/src/app/(staff)/teacher/schedule/page.tsx` (S27):
   - Grid thời khóa biểu tuần từ Thứ 2 đến Chủ nhật.
   - Hiển thị phòng học, trạng thái lớp, link trực tuyến Meet/Zoom (FR-309).
   - Nút hành động "Đề xuất đổi lịch" (giáo viên) và "Xin nghỉ phép" (học sinh/phụ huynh).
