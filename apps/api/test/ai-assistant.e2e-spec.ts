import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M07/M12/M13 GĐ3: Trợ Lý Điều Hành AI & Chỉ Số Đánh Giá (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let adminToken: string;
  let parentToken: string;
  let parentUserId: string;

  let teacherAUserId: string;
  let teacherAId: string;

  let teacherBUserId: string;
  let teacherBId: string;

  let studentId: string;
  let guardianId: string;
  let classId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Branch
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // 2. Roles
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const guardianRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });

    // 3. Admin User
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_step15@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Giám đốc Điều hành CoreLink',
        email: 'admin_step15@corelink.edu.vn',
        phone: '+84988880151',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    if (adminRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: adminUser.id, role_id: adminRole.id } },
        update: {},
        create: { user_id: adminUser.id, role_id: adminRole.id },
      });
    }

    // 4. Parent User & Guardian record
    const pUser = await prisma.users.upsert({
      where: { email: 'parent_step15@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phụ huynh Hoàng Thu Trang',
        email: 'parent_step15@corelink.edu.vn',
        phone: '+84988880152',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    parentUserId = pUser.id;
    if (guardianRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: pUser.id, role_id: guardianRole.id } },
        update: {},
        create: { user_id: pUser.id, role_id: guardianRole.id },
      });
    }

    const guardian = await prisma.guardians.upsert({
      where: { user_id: pUser.id },
      update: {},
      create: {
        user_id: pUser.id,
        branch_id: branchId,
      },
    });
    guardianId = guardian.id;

    // 5. Student User & Profile
    const sUser = await prisma.users.upsert({
      where: { email: 'student_step15@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Hoàng Minh Khang',
        email: 'student_step15@corelink.edu.vn',
        phone: '+84988880153',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });

    const student = await prisma.students.upsert({
      where: { user_id: sUser.id },
      update: {},
      create: {
        user_id: sUser.id,
        branch_id: branchId,
        code: 'HS-STEP15-01',
      },
    });
    studentId = student.id;

    // Link Parent to Student via Guardianship
    await prisma.guardianships.upsert({
      where: {
        student_id_guardian_id: {
          student_id: student.id,
          guardian_id: guardian.id,
        },
      },
      update: {},
      create: {
        student_id: student.id,
        guardian_id: guardian.id,
        relation: 'mother',
      },
    });

    // 6. Teacher A (Dạy con của phụ huynh)
    const tAUser = await prisma.users.upsert({
      where: { email: 'teachera_step15@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Nguyễn Văn An (Dạy con P)',
        email: 'teachera_step15@corelink.edu.vn',
        phone: '+84988880154',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacherAUserId = tAUser.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: tAUser.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: tAUser.id, role_id: teacherRole.id },
      });
    }

    const teacherA = await prisma.teachers.upsert({
      where: { user_id: tAUser.id },
      update: {},
      create: {
        user_id: tAUser.id,
        branch_id: branchId,
        bio_public: 'Thạc sĩ Ngôn ngữ học ứng dụng với 8 năm kinh nghiệm giảng dạy',
      },
    });
    teacherAId = teacherA.id;

    // 7. Teacher B (Không dạy con của phụ huynh)
    const tBUser = await prisma.users.upsert({
      where: { email: 'teacherb_step15@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Cô Lê Hoàng Mai (GV Lớp khác)',
        email: 'teacherb_step15@corelink.edu.vn',
        phone: '+84988880155',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacherBUserId = tBUser.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: tBUser.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: tBUser.id, role_id: teacherRole.id },
      });
    }

    const teacherB = await prisma.teachers.upsert({
      where: { user_id: tBUser.id },
      update: {},
      create: {
        user_id: tBUser.id,
        branch_id: branchId,
        bio_public: 'Chuyên gia luyện thi IELTS 8.5',
      },
    });
    teacherBId = teacherB.id;

    // 8. Program & Class
    const program = await prisma.programs.findFirst();
    const cls = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        code: `CLS-S15-${Date.now()}`,
        name: 'Lớp Tiếng Anh Giao Tiếp Step 15',
        start_date: new Date('2026-10-01'),
        end_date: new Date('2026-12-31'),
        recurrence: { days: ['Tue', 'Thu'], time: '18:00-19:30' },
        homeroom_teacher_id: teacherA.id,
        created_by: adminUser.id,
      },
    });
    classId = cls.id;

    // Enroll student in Class taught by Teacher A
    await prisma.enrollments.create({
      data: {
        branch_id: branchId,
        class_id: cls.id,
        student_id: student.id,
        status: 'active',
        enrolled_on: new Date(),
        created_by: adminUser.id,
      },
    });

    // 9. Login tokens
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_step15@corelink.edu.vn', password: 'Test@123456' });
    adminToken = adminLoginRes.body.accessToken;

    const parentLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'parent_step15@corelink.edu.vn', password: 'Test@123456' });
    parentToken = parentLoginRes.body.accessToken;
  });

  afterAll(async () => {
    try {
      await prisma.enrollments.deleteMany({ where: { class_id: classId } });
      await prisma.classes.deleteMany({ where: { id: classId } });
      await prisma.guardianships.deleteMany({ where: { guardian_id: guardianId } });
      await prisma.students.deleteMany({ where: { id: studentId } });
      await prisma.guardians.deleteMany({ where: { id: guardianId } });
      await prisma.teacher_metrics.deleteMany({
        where: { teacher_id: { in: [teacherAId, teacherBId] } },
      });
      await prisma.teachers.deleteMany({
        where: { id: { in: [teacherAId, teacherBId] } },
      });
    } catch (e) {
      // Ignored
    }
    await app.close();
  });

  // =========================================================================
  // TC-137: HỎI ĐÁP SỐ LIỆU CHỈ ĐỌC (FR-1204 / AI-14)
  // =========================================================================
  describe('TC-137 (FR-1204 / AI-14): Trợ lý số liệu chỉ đọc cho Admin', () => {
    it('Admin hỏi câu hỏi phân tích thống kê hợp lệ -> Trả về câu trả lời kèm bảng số liệu gốc', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-assistant/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'tháng này bao nhiêu học sinh mới từ Facebook?' });

      expect(res.status).toBe(201);
      expect(res.body.isReadOnlyRefusal).toBe(false);
      expect(res.body.answer).toContain('Facebook');
      expect(res.body.dataTable).toBeDefined();
      expect(res.body.dataTable.columns).toBeInstanceOf(Array);
      expect(res.body.dataTable.rows).toBeInstanceOf(Array);
      expect(res.body.dataTable.rows.length).toBeGreaterThan(0);
    });

    it('Admin hỏi lệnh ghi/xóa ("xóa giúp tôi khách tháng 10") -> Hệ thống TỪ CHỐI thao tác ghi, chỉ trả về dữ liệu chỉ đọc', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-assistant/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'xóa giúp tôi khách tháng 10' });

      expect(res.status).toBe(201);
      // TC-137: "Từ chối thao tác ghi; chỉ trả số liệu"
      expect(res.body.isReadOnlyRefusal).toBe(true);
      expect(res.body.answer).toContain('CHỈ ĐỌC (Read-Only)');
      expect(res.body.answer).toContain('từ chối thực hiện thao tác');
      expect(res.body.dataTable).toBeDefined();
      expect(res.body.dataTable.title).toContain('chỉ đọc');
    });
  });

  // =========================================================================
  // TC-140: PHỤ HUYNH CHỈ XEM ĐIỂM TỔNG HỢP GV CỦA CON (FR-1302)
  // =========================================================================
  describe('TC-140 (FR-1302): Phụ huynh chỉ xem điểm tổng hợp GV của con', () => {
    it('Phụ huynh mở trang GV của con (Thầy A) -> Thấy sao trung bình và số lượt đánh giá', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/ai-assistant/teacher-metrics/${teacherAId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.teacherId).toBe(teacherAId);
      expect(res.body.isOwnChildTeacher).toBe(true);
      expect(res.body.surveyAvg).toBeDefined();
      expect(typeof res.body.surveyAvg).toBe('number');
      expect(res.body.surveyCount).toBeDefined();
      // Ẩn các chỉ số nội bộ đối với phụ huynh
      expect(res.body.replyMedianMin).toBeUndefined();
      expect(res.body.onTimeGradingRate).toBeUndefined();
    });

    it('Phụ huynh gọi API metrics của GV khác (Cô B không dạy con) -> Trả về 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/ai-assistant/teacher-metrics/${teacherBId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      // TC-140: "API GV khác trả 403"
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('TC-140');
      expect(res.body.message).toContain('chỉ được xem chỉ số đánh giá của giáo viên đang trực tiếp giảng dạy con mình');
    });

    it('Admin xem chỉ số nội bộ của giáo viên -> Thấy đầy đủ các chỉ số chuyên môn', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/ai-assistant/teacher-metrics/${teacherAId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.surveyAvg).toBeDefined();
      expect(res.body.classAttendanceRate).toBeDefined();
      expect(res.body.replyMedianMin).toBe(15);
      expect(res.body.onTimeGradingRate).toBe(0.98);
    });
  });

  // =========================================================================
  // FR-705 (AI-10): CẢNH BÁO SỚM HỌC SINH CÓ NGUY CƠ TỤT ĐIỂM / BỎ HỌC
  // =========================================================================
  describe('FR-705 (AI-10): Cảnh báo sớm học sinh có nguy cơ', () => {
    it('Lấy danh sách cảnh báo sớm kèm lý do cụ thể và hành động đề xuất', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ai-assistant/early-warnings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const highRisk = res.body.find((item: any) => item.riskLevel === 'high');
      expect(highRisk).toBeDefined();
      expect(highRisk.reasons).toBeInstanceOf(Array);
      expect(highRisk.reasons.some((r: string) => r.includes('Điểm Đọc') || r.includes('Vắng'))).toBe(true);
      expect(highRisk.suggestedAction).toBeDefined();
    });
  });

  // =========================================================================
  // FR-307 (AI-11): GỢI Ý XẾP LỚP & PHÂN CÔNG GIÁO VIÊN THEO NĂNG LỰC
  // =========================================================================
  describe('FR-307 (AI-11): Gợi ý xếp lớp & Admin phê duyệt', () => {
    it('Lấy danh sách gợi ý xếp lớp với giải thích lý do', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ai-assistant/placement-suggestions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].reason).toBeDefined();
      expect(res.body[0].scoreMatch).toBeGreaterThan(80);
    });

    it('Admin bấm duyệt gợi ý xếp lớp -> Áp dụng thành công', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-assistant/placement-suggestions/plc-001/apply')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('applied');
      expect(res.body.approvedBy).toBeDefined();
    });
  });
});
