# BÁO CÁO HOÀN THÀNH BƯỚC 5: QUẢN LÝ ĐÀO TẠO — LỚP, LỊCH, PHÒNG, GHI DANH (M03)
*Hệ thống quản lý trung tâm đào tạo CoreLink Academy*  
*Mã bước: STEP-05 | Nhánh: `step-05-academic` | Trạng thái: HOÀN THÀNH 100%*

---

## 1. [VAI: BA] Business Analyst
- **User Story**:
  - *Là Cán bộ quản lý đào tạo (Academic/Admin)*, tôi muốn xem cây đào tạo trực quan từ Cấp học → Chương trình → Lớp học kèm tỷ lệ lấp đầy sĩ số (`v_class_fill`) và tự động gắn cờ cảnh báo các lớp có tỷ lệ < 50% để kịp thời điều phối tuyển sinh hoặc dồn ghép lớp (FR-301, TC-039).
  - *Là Giáo vụ trung tâm*, tôi muốn tạo lớp học theo cấu hình lịch lặp tuần (recurrence) và hệ thống tự động sinh ra tất cả các buổi học (`class_sessions`), tự động loại trừ các ngày nghỉ lễ đã cấu hình trong bảng `holidays` (FR-302, TC-040).
  - *Là Quản trị viên/Giáo vụ*, tôi muốn hệ thống chặn ngay lập tức (trả về HTTP 409 Conflict) khi phát hiện trùng phòng học hoặc trùng lịch giáo viên cùng một khung giờ trước khi lớp học được tạo (FR-302, TC-041, TC-042).
  - *Là Học sinh / Phụ huynh / Giáo viên / Nhân viên*, tôi muốn xem thời khóa biểu tuần đa chiều với phân quyền RBAC 2 tầng nghiêm ngặt: Học sinh chỉ thấy lịch của mình, Phụ huynh chỉ thấy lịch của con em, Giáo viên chỉ thấy lịch dạy của bản thân, và Nhân viên trung tâm có thể lọc đa chiều theo phòng và giáo viên (FR-303, TC-043).
  - *Là Giáo viên*, tôi muốn đề xuất đổi lịch học hoặc xin dạy thay với danh sách gợi ý giáo viên có chuyên môn tương đương và rảnh lịch, sau đó gửi yêu cầu chờ Giáo vụ phê duyệt (FR-303, FR-304, TC-044, TC-045).
  - *Là Nhân viên tư vấn/Giáo vụ*, tôi muốn ghi danh học sinh vào lớp học với kiểm tra sức chứa tối đa (`capacity`), chặn ghi danh khi trùng lịch học giữa 2 lớp của cùng một học sinh (TC-046..TC-048).
  - *Là Giáo vụ*, tôi muốn chuyển lớp cho học sinh mà vẫn bảo lưu toàn bộ lịch sử điểm số và điểm danh, đồng thời cập nhật liên kết `transferred_to_enrollment_id` (FR-305, TC-049).
  - *Là Cán bộ quản lý*, tôi muốn hệ thống tự động phát hiện và cảnh báo xung đột quy định dạy thêm theo Thông tư 17/2012/TT-BGDĐT khi giáo viên công lập dạy chính khóa học sinh trường ngoài, bắt buộc nhập lý do cam kết giải trình khi ghi danh (FR-308, TC-050).
  - *Là Giáo viên*, tôi muốn tạo các nhóm học tập phân hóa trong lớp (`study_groups`), phân công học sinh và chờ Giáo vụ phê duyệt (FR-306).

- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* danh sách lớp học và sĩ số học sinh active, *When* gọi endpoint `GET /api/v1/academic/tree`, *Then* trả về cây phân cấp đầy đủ Cấp học → Chương trình → Lớp học kèm `fillRate` và cờ `lowFillWarning = true` nếu fillRate < 0.5 (TC-039).
  - *Given* khoảng thời gian học và lịch lặp tuần có chứa ngày nghỉ lễ trong `holidays`, *When* tạo lớp học `POST /api/v1/academic/classes`, *Then* toàn bộ các buổi học rơi vào ngày lễ được tự động loại bỏ (TC-040).
  - *Given* một khung giờ đã có lớp học chiếm phòng hoặc giáo viên, *When* tạo lớp học mới trùng khung giờ, *Then* trả về mã 409 Conflict với thông tin xung đột cụ thể (TC-041, TC-042).
  - *Given* người dùng đăng nhập với token khác nhau (Student, Guardian, Teacher, Staff), *When* gọi `GET /api/v1/academic/schedule`, *Then* dữ liệu trả về chỉ chứa các buổi học thuộc phạm vi phân quyền của người dùng (TC-043).
  - *Given* một buổi học cần tìm người dạy thay, *When* gọi `GET /api/v1/academic/sessions/:id/substitute-suggestions`, *Then* danh sách trả về loại trừ giáo viên chính và chỉ chứa các giáo viên rảnh lịch (TC-044).
  - *Given* yêu cầu đổi lịch `reschedule_requests`, *When* Giáo vụ phê duyệt qua `POST /reschedule-requests/:id/approve`, *Then* trạng thái yêu cầu chuyển thành `approved` và thời gian buổi học trong `class_sessions` được cập nhật đồng bộ (TC-045).
  - *Given* lớp học đã đủ sĩ số tối đa (`capacity`), *When* ghi danh thêm học sinh, *Then* hệ thống trả về 400 Bad Request và từ chối ghi danh (TC-047).
  - *Given* học sinh đã có lịch học ở Lớp A, *When* cố tình ghi danh học sinh đó vào Lớp B có khung giờ trùng nhau, *Then* hệ thống trả về 409 Conflict (TC-048).
  - *Given* học sinh đang học tại Lớp A, *When* thực hiện chuyển sang Lớp B, *Then* bản ghi ghi danh tại Lớp A chuyển sang `transferred`, sinh bản ghi mới tại Lớp B và liên kết `transferred_to_enrollment_id` (TC-049).
  - *Given* giáo viên có nơi công tác ngoài là THPT Chu Văn An dạy chương trình phổ thông và học sinh có trường học là THPT Chu Văn An, *When* ghi danh, *Then* hệ thống phát hiện xung đột FR-308, yêu cầu `conflictAckReason` mới cho phép ghi danh (TC-050).

---

## 2. [VAI: Tech Lead] Kiến trúc & Thiết kế kỹ thuật
- **Backend API (`apps/api/src/modules/academic`)**:
  - `AcademicService`:
    - `getTrainingTree`: Truy vấn cấp học, chương trình, lớp học; tính toán `fillRate` thời gian thực dựa trên `enrollments` trạng thái active; tự động kích hoạt cờ `lowFillWarning`.
    - `createClass`: Kiểm tra ngày kết thúc >= ngày bắt đầu; duyệt qua toàn bộ các ngày từ `startDate` đến `endDate` và đối chiếu với lịch lặp tuần `recurrence`; tra cứu bảng `holidays` và loại bỏ các ngày lễ; kiểm tra xung đột trùng phòng (`roomConflict`) và trùng giáo viên (`teacherConflict`) trước khi ghi nhận vào DB; ghi nhận giáo viên chính vào `class_teachers` và sinh các bản ghi buổi học vào `class_sessions`.
    - `getSchedule`: Áp dụng RBAC 2 tầng (Scope Guard) theo vai trò người dùng (Student chỉ xem lớp đang học, Guardian xem lớp của con, Teacher xem lớp mình dạy, Staff xem toàn bộ cơ sở và lọc theo phòng/giáo viên).
    - `getSubstituteSuggestions`: Tìm kiếm giáo viên cùng cơ sở, kiểm tra không bị trùng lịch dạy trong khung giờ của buổi học và loại trừ giáo viên hiện tại.
    - `requestReschedule` & `approveReschedule`: Quản lý yêu cầu đổi lịch / dạy thay và cập nhật trạng thái buổi học `class_sessions`.
    - `enrollStudent`: Kiểm tra sĩ số tối đa (`capacity`), kiểm tra trùng lịch học sinh giữa 2 lớp (so khớp từng buổi học), kiểm tra quy định dạy thêm Thông tư 17 (FR-308) và bắt buộc nhập cam kết giải trình `conflictAckReason`.
    - `transferStudent`: Cập nhật trạng thái ghi danh cũ thành `transferred`, tạo bản ghi ghi danh mới và liên kết `transferred_to_enrollment_id`.
    - `createStudyGroup` & `approveStudyGroup`: Tạo nhóm học tập trong lớp và lưu thành viên nhóm vào `study_group_members`.
  - `AcademicController`: Các endpoint RESTful được bảo vệ nghiêm ngặt bằng `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(...)`.
  - `AcademicModule`: Được đăng ký vào `AppModule`.

- **Frontend Web (`apps/web`)**:
  - `apps/web/src/app/(staff)/academic/classes/page.tsx` (Màn hình S38):
    - Cây đào tạo trực quan: Phân cấp Cấp học → Chương trình → Lớp học.
    - Thanh tiến trình tỷ lệ lấp đầy trực quan (fill rate bar) kèm màu cảnh báo linh hoạt.
    - Badge cảnh báo màu cam "Cần đẩy mạnh tuyển sinh" cho các lớp có tỷ lệ lấp đầy dưới 50%.
    - Modal tạo lớp học hoàn chỉnh: Nhập tên, mã, chế độ học (Offline/Online/Hybrid), chọn phòng học, nhập sĩ số tối đa, chọn ngày bắt đầu - kết thúc, bộ chọn lịch lặp tuần (Thứ 2..Chủ nhật kèm giờ bắt đầu/kết thúc), và chọn giáo viên chủ nhiệm.
  - `apps/web/src/app/(staff)/academic/classes/[id]/enrollments/page.tsx` (Màn hình S39):
    - Danh sách học sinh đã ghi danh kèm mã học sinh, trường đang học, ngày ghi danh và trạng thái.
    - Thẻ thống kê sĩ số hiện tại / Sức chứa tối đa, hiển thị cảnh báo khi lớp đã đầy.
    - Modal chuyển lớp học nhanh chóng kèm trường nhập lý do chuyển lớp.
  - `apps/web/src/app/(staff)/academic/schedule/page.tsx` (Màn hình S27):
    - Lưới thời khóa biểu tuần từ Thứ 2 đến Chủ nhật theo từng khung giờ sáng, chiều, tối.
    - Bộ lọc đa chiều: Lọc theo Cơ sở, Lọc theo Phòng học, Lọc theo Giáo viên.
    - Nút mở nhanh link học trực tuyến (Google Meet / Zoom) cho các buổi học trực tuyến hoặc hybrid (FR-309).

---

## 3. [VAI: Security/Compliance Officer] An toàn dữ liệu & Tuân thủ pháp lý
- **Kiểm soát truy cập dữ liệu đa người dùng (Multi-tenant & 2-Layer RBAC)**:
  - Tất cả các truy vấn đều được đóng khung theo `branch_id` của cơ sở.
  - Học sinh và Phụ huynh hoàn toàn bị cô lập dữ liệu, không thể xem lịch học hoặc danh sách học sinh của các lớp khác.
- **Tuân thủ quy định quản lý dạy thêm theo Thông tư 17/2012/TT-BGDĐT (FR-308)**:
  - Khi một giáo viên đang công tác tại một trường THPT/THCS công lập (`other_workplace`) dạy một học sinh đang học tại chính trường đó (`school_name`) trong chương trình bám sát phổ thông GDPT 2018 (`is_school_curriculum = true`), hệ thống tự động gắn cờ cảnh báo rủi ro pháp lý.
  - Bắt buộc phải có xác nhận cam kết tự nguyện từ phụ huynh và giải trình rõ ràng (`conflictAckReason`) mới được ghi danh, tạo bằng chứng kiểm toán độc lập bảo vệ trung tâm.

---

## 4. [VAI: QA/Tester] Kết quả kiểm thử tự động
- **Suite E2E Step 5 (`test/academic.e2e-spec.ts`)**: **13/13 test cases ĐẠT 100%**:
  - `TC-039 (Cây đào tạo & Sĩ số lấp đầy)`: Hiển thị đúng cấu trúc Cấp học → Chương trình → Lớp học kèm fillRate và cờ lowFillWarning (< 50%) -> **ĐẠT**
  - `TC-040 (Tự sinh lịch & Trừ ngày lễ)`: Tự sinh `class_sessions` theo recurrence và loại bỏ ngày lễ trong `holidays` -> **ĐẠT**
  - `TC-041 (Xung đột phòng học)`: Phát hiện trùng phòng học cùng khung giờ -> Trả về 409 Conflict -> **ĐẠT**
  - `TC-042 (Xung đột giáo viên)`: Phát hiện trùng lịch giáo viên cùng khung giờ -> Trả về 409 Conflict -> **ĐẠT**
  - `TC-043 (Thời khóa biểu tuần đa chiều)`: RBAC 2 tầng cô lập dữ liệu giữa Học sinh, Phụ huynh, Giáo viên và Nhân viên -> **ĐẠT**
  - `TC-044 (Gợi ý giáo viên dạy thay)`: Gợi ý giáo viên cùng chuyên môn và rảnh lịch, loại trừ giáo viên chính -> **ĐẠT**
  - `TC-045 (Đổi lịch học)`: Giáo viên gửi đề xuất đổi lịch và Giáo vụ phê duyệt cập nhật đồng bộ `class_sessions` -> **ĐẠT**
  - `TC-046 (Ghi danh học sinh)`: Ghi danh thành công vào lớp còn chỗ -> **ĐẠT**
  - `TC-047 (Chặn ghi danh khi đầy sĩ số)`: Trả về 400 Bad Request khi lớp đạt tối đa `capacity` -> **ĐẠT**
  - `TC-048 (Trùng lịch học của học sinh)`: Phát hiện học sinh bị trùng lịch giữa 2 lớp -> Trả về 409 Conflict -> **ĐẠT**
  - `TC-049 (Chuyển lớp bảo lưu lịch sử)`: Cập nhật bản ghi cũ sang `transferred`, tạo bản ghi mới và liên kết `transferred_to_enrollment_id` -> **ĐẠT**
  - `TC-050 (Quy định dạy thêm FR-308)`: Cảnh báo vi phạm Thông tư 17 và bắt buộc nhập lý do cam kết giải trình -> **ĐẠT**
  - `FR-306 (Nhóm học tập trong lớp)`: Giáo viên tạo nhóm học tập chờ duyệt và Giáo vụ phê duyệt -> **ĐẠT**

- **Toàn bộ hệ thống E2E (`pnpm test:e2e`)**: **5/5 Suites - 52/52 Tests PASSED (100%)**:
  1. `health.e2e-spec.ts`: PASSED
  2. `auth-rbac.e2e-spec.ts`: PASSED
  3. `public-leads.e2e-spec.ts`: PASSED
  4. `ai-chatbot.e2e-spec.ts`: PASSED
  5. `academic.e2e-spec.ts`: PASSED
- **Web Build (`pnpm --filter @corelink/web build`)**: **17/17 routes compiled successfully (Exit Code 0)**.
