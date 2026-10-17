import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('M03 Quản lý đào tạo — Lớp, lịch, phòng, ghi danh (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;

  let adminUserId: string;
  let teacherUserId: string;
  let teacherId: string;
  let otherTeacherId: string;
  let studentUserId: string;
  let studentId: string;
  let secondStudentId: string;

  let programId: string;
  let schoolCurriculumProgramId: string;
  let roomId: string;
  let secondRoomId: string;
  let levelId: string;
  let sharedClassId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const cleanup = async () => {
      try {
        const sGroups = await prisma.study_groups.findMany({
          where: { name: { startsWith: 'Nhóm ' } },
          select: { id: true },
        });
        if (sGroups.length > 0) {
          const sGroupIds = sGroups.map((g) => g.id);
          await prisma.study_group_members.deleteMany({
            where: { group_id: { in: sGroupIds } },
          });
          await prisma.study_groups.deleteMany({
            where: { id: { in: sGroupIds } },
          });
        }

        const testClasses = await prisma.classes.findMany({
          where: {
            OR: [
              { code: { startsWith: 'CLS-TEST-' } },
              { code: { startsWith: 'CLS-CAP1-' } },
              { code: { startsWith: 'CLS-OVERLAP-' } },
              { code: { startsWith: 'CLS-TARGET-' } },
              { code: { startsWith: 'FR308-CLS-' } },
              { code: { startsWith: 'CONFLICT-' } },
            ],
          },
          select: { id: true },
        });
        if (testClasses.length > 0) {
          const testClassIds = testClasses.map((c) => c.id);
          await prisma.reschedule_requests.deleteMany({
            where: { class_sessions: { class_id: { in: testClassIds } } },
          });
          await prisma.attendance.deleteMany({
            where: { class_sessions: { class_id: { in: testClassIds } } },
          });
          await prisma.class_sessions.deleteMany({
            where: { class_id: { in: testClassIds } },
          });
          await prisma.enrollments.deleteMany({
            where: { class_id: { in: testClassIds } },
          });
          await prisma.class_teachers.deleteMany({
            where: { class_id: { in: testClassIds } },
          });
          await prisma.classes.deleteMany({
            where: { id: { in: testClassIds } },
          });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };

    await cleanup();

    // 1. Lấy cơ sở
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // 2. Roles
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });

    // 3. Tạo Admin
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_step5@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active', failed_login_count: 0, locked_until: null },
      create: {
        branch_id: branchId,
        full_name: 'Admin Academic Test',
        email: 'admin_step5@corelink.edu.vn',
        phone: '+84988880055',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    adminUserId = adminUser.id;
    if (adminRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: adminUser.id, role_id: adminRole.id } },
        update: {},
        create: { user_id: adminUser.id, role_id: adminRole.id },
      });
    }

    // 4. Tạo Teacher 1 & Teacher 2
    const teacherUser = await prisma.users.upsert({
      where: { email: 'teacher_step5@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Nguyễn Văn Nam (IELTS)',
        email: 'teacher_step5@corelink.edu.vn',
        phone: '+84988880056',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacherUserId = teacherUser.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: teacherUser.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: teacherUser.id, role_id: teacherRole.id },
      });
    }
    const teacher = await prisma.teachers.upsert({
      where: { user_id: teacherUser.id },
      update: { other_workplace: 'THPT Chu Văn An' },
      create: {
        user_id: teacherUser.id,
        branch_id: branchId,
        bio_public: 'Giáo viên luyện thi IELTS 8.5',
        other_workplace: 'THPT Chu Văn An',
        is_public: true,
      },
    });
    teacherId = teacher.id;

    const otherTeacherUser = await prisma.users.upsert({
      where: { email: 'teacher2_step5@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Cô Trần Mai Lan',
        email: 'teacher2_step5@corelink.edu.vn',
        phone: '+84988880057',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: otherTeacherUser.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: otherTeacherUser.id, role_id: teacherRole.id },
      });
    }
    const otherTeacher = await prisma.teachers.upsert({
      where: { user_id: otherTeacherUser.id },
      update: {},
      create: {
        user_id: otherTeacherUser.id,
        branch_id: branchId,
        bio_public: 'Giáo viên giao tiếp',
        is_public: true,
      },
    });
    otherTeacherId = otherTeacher.id;

    // 5. Tạo Student 1 & Student 2
    const studentUser = await prisma.users.upsert({
      where: { email: 'student_step5@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Lê Bảo Châu',
        email: 'student_step5@corelink.edu.vn',
        phone: '+84988880058',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    studentUserId = studentUser.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: studentUser.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: studentUser.id, role_id: studentRole.id },
      });
    }
    const student = await prisma.students.upsert({
      where: { user_id: studentUser.id },
      update: { school_name: 'THPT Chu Văn An' },
      create: {
        user_id: studentUser.id,
        branch_id: branchId,
        code: 'HS-S5-001',
        school_name: 'THPT Chu Văn An',
        is_young_account: false,
      },
    });
    studentId = student.id;

    const secondStudentUser = await prisma.users.upsert({
      where: { email: 'student2_step5@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Hoàng Minh Khang',
        email: 'student2_step5@corelink.edu.vn',
        phone: '+84988880059',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    const secondStudent = await prisma.students.upsert({
      where: { user_id: secondStudentUser.id },
      update: {},
      create: {
        user_id: secondStudentUser.id,
        branch_id: branchId,
        code: 'HS-S5-002',
        is_young_account: false,
      },
    });
    secondStudentId = secondStudent.id;

    // 6. Lấy Tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_step5@corelink.edu.vn', password: 'Test@123456' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_step5@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student_step5@corelink.edu.vn', password: 'Test@123456' });
    studentToken = studentLogin.body.accessToken;

    // 7. Phòng học & Cấp học & Khóa học
    const room = await prisma.rooms.upsert({
      where: { branch_id_name: { branch_id: branchId, name: 'Phòng Lab 501' } },
      update: { capacity: 15, is_active: true },
      create: { branch_id: branchId, name: 'Phòng Lab 501', capacity: 15, is_active: true },
    });
    roomId = room.id;

    const room2 = await prisma.rooms.upsert({
      where: { branch_id_name: { branch_id: branchId, name: 'Phòng 502' } },
      update: { capacity: 15, is_active: true },
      create: { branch_id: branchId, name: 'Phòng 502', capacity: 15, is_active: true },
    });
    secondRoomId = room2.id;

    const level = await prisma.levels.findFirst();
    levelId = level!.id;

    const program = await prisma.programs.upsert({
      where: { branch_id_code: { branch_id: branchId, code: 'ENG-TEST-S5' } },
      update: { is_school_curriculum: false },
      create: {
        branch_id: branchId,
        level_id: levelId,
        code: 'ENG-TEST-S5',
        name: 'Tiếng Anh Giao Tiếp Step 5',
        framework: 'CEFR',
        target_level: 'B1',
        is_school_curriculum: false,
      },
    });
    programId = program.id;

    const schoolProg = await prisma.programs.upsert({
      where: { branch_id_code: { branch_id: branchId, code: 'GDPT-LOP10-S5' } },
      update: { is_school_curriculum: true },
      create: {
        branch_id: branchId,
        level_id: levelId,
        code: 'GDPT-LOP10-S5',
        name: 'Tiếng Anh Phổ Thông Lớp 10 (GDPT 2018)',
        framework: 'GDPT2018',
        target_level: 'Lop10',
        is_school_curriculum: true,
      },
    });
    schoolCurriculumProgramId = schoolProg.id;

    const defaultClass = await prisma.classes.findFirst({ where: { branch_id: branchId } });
    if (defaultClass) {
      sharedClassId = defaultClass.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cây đào tạo & Sĩ số lấp đầy (FR-301, TC-039)', () => {
    it('TC-039: Hiển thị cây Cấp học → Chương trình → Lớp học kèm fill_rate và cảnh báo < 50%', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/tree')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const firstLevel = res.body[0];
      expect(firstLevel).toHaveProperty('id');
      expect(firstLevel).toHaveProperty('code');
      expect(firstLevel).toHaveProperty('programs');
      expect(Array.isArray(firstLevel.programs)).toBe(true);

      // Nếu có lớp học, kiểm tra thuộc tính fillRate và lowFillWarning
      const allPrograms = res.body.flatMap((l: any) => l.programs);
      const programWithClasses = allPrograms.find((p: any) => p.classes.length > 0);
      if (programWithClasses) {
        const cls = programWithClasses.classes[0];
        expect(cls).toHaveProperty('activeStudents');
        expect(cls).toHaveProperty('capacity');
        expect(cls).toHaveProperty('fillRate');
        expect(cls).toHaveProperty('lowFillWarning');
        if (cls.fillRate < 0.5) {
          expect(cls.lowFillWarning).toBe(true);
        }
      }
    });
  });

  describe('Tạo lớp học & Tự sinh lịch có loại trừ ngày lễ (FR-302, TC-040..TC-042)', () => {
    let createdClassId: string;
    const testCode = 'CLS-TEST-' + Date.now();

    it('TC-040: Tạo lớp học tự sinh class_sessions theo recurrence và bỏ qua ngày lễ trong holidays', async () => {
      // 1. Thêm một ngày nghỉ lễ vào ngày Thứ 3 tuần tới
      const nextTuesday = new Date();
      nextTuesday.setDate(nextTuesday.getDate() + ((2 - nextTuesday.getDay() + 7) % 7 || 7));
      const holidayDateStr = nextTuesday.toISOString().slice(0, 10);

      await prisma.holidays.upsert({
        where: { branch_id_holiday_on: { branch_id: branchId, holiday_on: new Date(holidayDateStr) } },
        update: {},
        create: { branch_id: branchId, holiday_on: new Date(holidayDateStr), name: 'Ngày Nhà Giáo Việt Nam' },
      });

      // 2. Tạo lớp học bắt đầu từ hôm nay trong vòng 3 tuần vào các ngày Thứ 3 và Thứ 5
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 21);

      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programId,
          code: testCode,
          name: 'Lớp Kiểm thử TC-040',
          mode: 'offline',
          roomId,
          capacity: 12,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          recurrence: [
            { weekday: 2, start: '18:00', end: '19:30' },
            { weekday: 4, start: '18:00', end: '19:30' },
          ],
          homeroomTeacherId: teacherId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.code).toBe(testCode);
      expect(res.body.totalSessions).toBeGreaterThan(0);
      createdClassId = res.body.id;
      sharedClassId = res.body.id;

      // 3. Kiểm tra DB: không có buổi học nào rơi vào ngày lễ
      const sessions = await prisma.class_sessions.findMany({
        where: { class_id: createdClassId },
      });

      const holidaySessions = sessions.filter(
        (s) => s.starts_at.toISOString().slice(0, 10) === holidayDateStr
      );
      expect(holidaySessions.length).toBe(0); // Ngày lễ đã được tự động loại bỏ!
    });

    it('TC-041: Phát hiện trùng phòng học cùng khung giờ -> Trả về 409 Conflict', async () => {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14);

      // Cố tình tạo một lớp khác trùng phòng `roomId` và khung giờ Thứ 3 18:00
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programId,
          code: 'CONFLICT-ROOM-' + Date.now(),
          name: 'Lớp Trùng Phòng',
          roomId, // Trùng roomId với lớp trên
          capacity: 12,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          recurrence: [{ weekday: 2, start: '18:00', end: '19:30' }],
          homeroomTeacherId: otherTeacherId, // Giáo viên khác
        })
        .expect(409);

      expect(res.body.conflictType).toBe('room');
      expect(res.body.message).toContain('Trùng phòng học');
    });

    it('TC-042: Phát hiện trùng lịch giáo viên cùng khung giờ -> Trả về 409 Conflict', async () => {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14);

      // Cố tình tạo một lớp khác trùng giáo viên `teacherId` ở phòng khác `secondRoomId`
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programId,
          code: 'CONFLICT-TEACHER-' + Date.now(),
          name: 'Lớp Trùng Giáo Viên',
          roomId: secondRoomId, // Phòng khác
          capacity: 12,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          recurrence: [{ weekday: 4, start: '18:00', end: '19:30' }], // Trùng Thứ 5 18:00
          homeroomTeacherId: teacherId, // Trùng giáo viên!
        })
        .expect(409);

      expect(res.body.conflictType).toBe('teacher');
      expect(res.body.message).toContain('Trùng lịch giáo viên');
    });
  });

  describe('Thời khóa biểu tuần & Dạy thay (FR-303, FR-304, TC-043..TC-045)', () => {
    it('TC-043: Thời khóa biểu tuần đa chiều (getSchedule) bảo đảm RBAC 2 tầng', async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21);

      const res = await request(app.getHttpServer())
        .get('/api/v1/academic/schedule')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        })
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        const item = res.body[0];
        expect(item).toHaveProperty('classCode');
        expect(item).toHaveProperty('className');
        expect(item).toHaveProperty('startsAt');
        expect(item).toHaveProperty('endsAt');
        expect(item).toHaveProperty('teacherName');
      }
    });

    it('TC-044: Gợi ý giáo viên dạy thay rảnh lịch và đúng chuyên môn', async () => {
      // Tìm một buổi học bất kỳ
      const session = await prisma.class_sessions.findFirst({
        where: { teacher_id: teacherId, status: 'scheduled' },
      });
      expect(session).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/academic/sessions/${session!.id}/substitute-suggestions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('suggestedTeachers');
      expect(Array.isArray(res.body.suggestedTeachers)).toBe(true);

      // Giáo viên hiện tại không được nằm trong danh sách gợi ý
      const ids = res.body.suggestedTeachers.map((t: any) => t.teacherId);
      expect(ids).not.toContain(teacherId);
    });

    it('TC-045: Giáo viên đề xuất đổi lịch và Giáo vụ phê duyệt cập nhật class_sessions', async () => {
      const session = await prisma.class_sessions.findFirst({
        where: { teacher_id: teacherId, status: 'scheduled' },
      });

      // 1. Giáo viên gửi yêu cầu
      const newStartsAt = new Date(session!.starts_at.getTime() + 60 * 60 * 1000).toISOString();
      const newEndsAt = new Date(session!.ends_at.getTime() + 60 * 60 * 1000).toISOString();

      const reqRes = await request(app.getHttpServer())
        .post('/api/v1/academic/reschedule-requests')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: session!.id,
          type: 'reschedule',
          newStartsAt,
          newEndsAt,
          reason: 'Bận việc gia đình đột xuất',
        })
        .expect(201);

      expect(reqRes.body).toHaveProperty('id');
      expect(reqRes.body.status).toBe('pending');
      const requestId = reqRes.body.id;

      // 2. Giáo vụ phê duyệt
      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/academic/reschedule-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(approveRes.body.message).toContain('thành công');

      // 3. Kiểm tra session trong DB đã được cập nhật
      const updatedSession = await prisma.class_sessions.findUnique({
        where: { id: session!.id },
      });
      expect(new Date(updatedSession!.starts_at).toISOString()).toBe(newStartsAt);
    });
  });

  describe('Ghi danh, Chuyển lớp & Xung đột dạy thêm (FR-305, FR-308, TC-046..TC-050)', () => {
    let smallCapacityClassId: string;
    let enrollmentToTransferId: string;
    let targetClassId: string;

    it('TC-046: Ghi danh học sinh thành công khi lớp còn chỗ', async () => {
      // Tạo lớp nhỏ có capacity = 1
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14);

      const clsRes = await request(app.getHttpServer())
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programId,
          code: 'CLS-CAP1-' + Date.now(),
          name: 'Lớp Sĩ Số 1',
          roomId: secondRoomId,
          capacity: 1, // Sức chứa 1 em!
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          recurrence: [{ weekday: 1, start: '18:00', end: '19:30' }],
          homeroomTeacherId: otherTeacherId,
        })
        .expect(201);

      smallCapacityClassId = clsRes.body.id;

      // Ghi danh học sinh 1 -> Thành công
      const enrollRes = await request(app.getHttpServer())
        .post(`/api/v1/academic/classes/${smallCapacityClassId}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentId })
        .expect(201);

      expect(enrollRes.body).toHaveProperty('enrollmentId');
      enrollmentToTransferId = enrollRes.body.enrollmentId;
    });

    it('TC-047: Chặn ghi danh khi lớp học đã đầy sĩ số tối đa (capacity)', async () => {
      // Cố tình ghi danh học sinh thứ 2 vào lớp có capacity = 1 (đã có 1 em)
      const res = await request(app.getHttpServer())
        .post(`/api/v1/academic/classes/${smallCapacityClassId}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentId: secondStudentId })
        .expect(400);

      expect(res.body.message).toContain('đã đầy sĩ số');
    });

    it('TC-048: Phát hiện trùng lịch học của học sinh giữa 2 lớp -> Trả về 409 Conflict', async () => {
      // Tạo lớp thứ 2 có lịch học trùng với lớp học sinh 1 đang học (Thứ 2 18:00)
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14);

      const cls2Res = await request(app.getHttpServer())
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programId,
          code: 'CLS-OVERLAP-' + Date.now(),
          name: 'Lớp Trùng Lịch HS',
          roomId,
          capacity: 10,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          recurrence: [{ weekday: 1, start: '18:00', end: '19:30' }], // Trùng Thứ 2 18:00
          homeroomTeacherId: teacherId,
        })
        .expect(201);

      // Cố tình ghi danh học sinh 1 vào lớp thứ 2 này -> 409 Conflict
      const res = await request(app.getHttpServer())
        .post(`/api/v1/academic/classes/${cls2Res.body.id}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentId })
        .expect(409);

      expect(res.body.conflictType).toBe('student_schedule');
      expect(res.body.message).toContain('bị trùng lịch');
    });

    it('TC-049: Chuyển lớp giữ nguyên lịch sử và cập nhật liên kết transferred_to_enrollment_id', async () => {
      // Tạo lớp đích vào Thứ 6 (không trùng lịch)
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14);

      const targetClsRes = await request(app.getHttpServer())
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programId,
          code: 'CLS-TARGET-' + Date.now(),
          name: 'Lớp Đích Thứ 6',
          roomId,
          capacity: 10,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          recurrence: [{ weekday: 5, start: '18:00', end: '19:30' }],
          homeroomTeacherId: otherTeacherId,
        })
        .expect(201);
      targetClassId = targetClsRes.body.id;

      // Thực hiện chuyển lớp
      const transferRes = await request(app.getHttpServer())
        .post(`/api/v1/academic/enrollments/${enrollmentToTransferId}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetClassId,
          reason: 'Chuyển sang ca học Thứ 6',
        })
        .expect(200);

      expect(transferRes.body).toHaveProperty('newEnrollmentId');

      // Kiểm tra DB
      const oldEnr = await prisma.enrollments.findUnique({
        where: { id: enrollmentToTransferId },
      });
      expect(oldEnr?.status).toBe('transferred');
      expect(oldEnr?.transferred_to_enrollment_id).toBe(transferRes.body.newEnrollmentId);

      const newEnr = await prisma.enrollments.findUnique({
        where: { id: transferRes.body.newEnrollmentId },
      });
      expect(newEnr?.status).toBe('active');
      expect(newEnr?.class_id).toBe(targetClassId);
    });

    it('TC-050: Cảnh báo xung đột quy định dạy thêm (FR-308) khi GV dạy chính học sinh trường ngoài', async () => {
      // Tạo lớp có `is_school_curriculum = 1` với giáo viên dạy tại 'THPT Chu Văn An'
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14);

      const fr308ClsRes = await request(app.getHttpServer())
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programId: schoolCurriculumProgramId, // Chương trình phổ thông
          code: 'FR308-CLS-' + Date.now(),
          name: 'Lớp Phổ Thông Lớp 10',
          roomId,
          capacity: 10,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          recurrence: [{ weekday: 6, start: '14:00', end: '15:30' }],
          homeroomTeacherId: teacherId, // GV dạy tại THPT Chu Văn An
        })
        .expect(201);

      const fr308ClassId = fr308ClsRes.body.id;

      // 1. Thử ghi danh học sinh (học tại THPT Chu Văn An) không có lý do -> Bị chặn
      const failRes = await request(app.getHttpServer())
        .post(`/api/v1/academic/classes/${fr308ClassId}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentId })
        .expect(400);

      expect(failRes.body.message).toContain('FR-308');

      // 2. Ghi danh kèm lý do giải trình -> Thành công và có cảnh báo
      const successRes = await request(app.getHttpServer())
        .post(`/api/v1/academic/classes/${fr308ClassId}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId,
          conflictAckReason: 'Đã có đơn cam kết của phụ huynh và được Ban giám hiệu phê duyệt',
        })
        .expect(201);

      expect(successRes.body.conflictWarning).toContain('FR-308');
    });
  });

  describe('Nhóm học tập trong lớp (FR-306)', () => {
    it('Tạo nhóm học tập chờ duyệt và Giáo vụ phê duyệt', async () => {
      // 1. Tạo nhóm học tập
      const groupRes = await request(app.getHttpServer())
        .post('/api/v1/academic/study-groups')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: sharedClassId,
          name: 'Nhóm Tăng Cường Nghe',
          purpose: 'Luyện đề nghe bổ trợ cuối tuần',
          studentIds: [studentId],
        })
        .expect(201);

      expect(groupRes.body).toHaveProperty('id');
      expect(groupRes.body.status).toBe('pending');
      const groupId = groupRes.body.id;

      // 2. Giáo vụ phê duyệt
      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/academic/study-groups/${groupId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(approveRes.body.message).toContain('thành công');
    });
  });
});
