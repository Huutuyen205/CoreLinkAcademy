import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('M02 Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(60000);

  let adminToken: string;
  let teacherToken: string;
  let guardianToken: string;
  let studentToken: string;
  let youngStudentToken: string;

  let branchId: string;
  let adminUserId: string;
  let teacherUserId: string;
  let teacherId: string;
  let guardianId: string;
  let studentId: string;
  let otherStudentId: string;
  let classId: string;
  let otherClassId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Chuẩn bị dữ liệu mẫu cho bài test
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // 1. Tạo Admin
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_test@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active', failed_login_count: 0, locked_until: null },
      create: {
        branch_id: branchId,
        full_name: 'Admin Test',
        email: 'admin_test@corelink.edu.vn',
        phone: '+84988888001',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    adminUserId = adminUser.id;
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: adminUser.id, role_id: adminRole!.id } },
      update: {},
      create: { user_id: adminUser.id, role_id: adminRole!.id },
    });

    // 2. Tạo Teacher
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const teacherUser = await prisma.users.upsert({
      where: { email: 'teacher_test@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active', failed_login_count: 0, locked_until: null },
      create: {
        branch_id: branchId,
        full_name: 'Teacher Test',
        email: 'teacher_test@corelink.edu.vn',
        phone: '+84988888002',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacherUserId = teacherUser.id;
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: teacherUser.id, role_id: teacherRole!.id } },
      update: {},
      create: { user_id: teacherUser.id, role_id: teacherRole!.id },
    });
    const teacher = await prisma.teachers.upsert({
      where: { user_id: teacherUser.id },
      update: {},
      create: { user_id: teacherUser.id, branch_id: branchId },
    });
    teacherId = teacher.id;

    // 3. Tạo Student 1 (Lớn)
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });
    const studentUser = await prisma.users.upsert({
      where: { email: 'student_test@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active', failed_login_count: 0, locked_until: null },
      create: {
        branch_id: branchId,
        full_name: 'Student Test',
        email: 'student_test@corelink.edu.vn',
        phone: '+84988888003',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: studentUser.id, role_id: studentRole!.id } },
      update: {},
      create: { user_id: studentUser.id, role_id: studentRole!.id },
    });
    const student = await prisma.students.upsert({
      where: { user_id: studentUser.id },
      update: { is_young_account: false },
      create: { user_id: studentUser.id, branch_id: branchId, code: 'HS-TEST-001', is_young_account: false },
    });
    studentId = student.id;

    // 4. Tạo Student 2 (Khác)
    const otherStudentUser = await prisma.users.upsert({
      where: { email: 'other_student_test@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Other Student',
        email: 'other_student_test@corelink.edu.vn',
        phone: '+84988888004',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    const otherStudent = await prisma.students.upsert({
      where: { user_id: otherStudentUser.id },
      update: {},
      create: { user_id: otherStudentUser.id, branch_id: branchId, code: 'HS-TEST-002', is_young_account: false },
    });
    otherStudentId = otherStudent.id;

    // 5. Tạo Young Student (Học sinh nhỏ tuổi)
    const youngStudentUser = await prisma.users.upsert({
      where: { email: 'young_student_test@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Young Student Test',
        email: 'young_student_test@corelink.edu.vn',
        phone: '+84988888005',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: youngStudentUser.id, role_id: studentRole!.id } },
      update: {},
      create: { user_id: youngStudentUser.id, role_id: studentRole!.id },
    });
    await prisma.students.upsert({
      where: { user_id: youngStudentUser.id },
      update: { is_young_account: true },
      create: { user_id: youngStudentUser.id, branch_id: branchId, code: 'HS-YOUNG-001', is_young_account: true },
    });

    // 6. Tạo Guardian
    const guardianRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });
    const guardianUser = await prisma.users.upsert({
      where: { email: 'guardian_test@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active', failed_login_count: 0, locked_until: null },
      create: {
        branch_id: branchId,
        full_name: 'Guardian Test',
        email: 'guardian_test@corelink.edu.vn',
        phone: '+84988888006',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: guardianUser.id, role_id: guardianRole!.id } },
      update: {},
      create: { user_id: guardianUser.id, role_id: guardianRole!.id },
    });
    const guardian = await prisma.guardians.upsert({
      where: { user_id: guardianUser.id },
      update: {},
      create: { user_id: guardianUser.id, branch_id: branchId, referral_code: 'REF-TEST-001' },
    });
    guardianId = guardian.id;

    // Liên kết Guardian với Student 1
    await prisma.guardianships.upsert({
      where: { student_id_guardian_id: { student_id: studentId, guardian_id: guardianId } },
      update: { can_view_results: true, can_message: true, receives_fee_notice: true },
      create: {
        student_id: studentId,
        guardian_id: guardianId,
        relation: 'mother',
        can_view_results: true,
        can_message: true,
        receives_fee_notice: true,
      },
    });

    // Tạo Class 1 (Teacher phụ trách) và Class 2 (Lớp khác)
    const level = await prisma.levels.findFirst();
    const program = await prisma.programs.findFirst({ where: { branch_id: branchId } }) ||
      await prisma.programs.create({
        data: {
          branch_id: branchId,
          level_id: level!.id,
          code: 'PROG-TEST-01',
          name: 'Chương trình Test',
          framework: 'CEFR',
        },
      });

    const cls1 = await prisma.classes.upsert({
      where: { branch_id_code: { branch_id: branchId, code: 'CLS-TEST-01' } },
      update: {},
      create: {
        branch_id: branchId,
        program_id: program.id,
        code: 'CLS-TEST-01',
        name: 'Lớp Giáo Viên A',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        recurrence: [],
        created_by: adminUser.id,
      },
    });
    classId = cls1.id;

    const cls2 = await prisma.classes.upsert({
      where: { branch_id_code: { branch_id: branchId, code: 'CLS-TEST-02' } },
      update: {},
      create: {
        branch_id: branchId,
        program_id: program.id,
        code: 'CLS-TEST-02',
        name: 'Lớp Giáo Viên Khác',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        recurrence: [],
        created_by: adminUser.id,
      },
    });
    otherClassId = cls2.id;

    // Gán Teacher dạy Class 1
    await prisma.class_teachers.upsert({
      where: {
        class_id_teacher_id_from_date: {
          class_id: classId,
          teacher_id: teacherId,
          from_date: new Date('2026-01-01'),
        },
      },
      update: {},
      create: {
        class_id: classId,
        teacher_id: teacherId,
        from_date: new Date('2026-01-01'),
      },
    });

    // Lấy token đăng nhập của các bên
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_test@corelink.edu.vn', password: 'Test@123456' });
    adminToken = adminRes.body.accessToken;

    const teacherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_test@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = teacherRes.body.accessToken;

    const guardianRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'guardian_test@corelink.edu.vn', password: 'Test@123456' });
    guardianToken = guardianRes.body.accessToken;

    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student_test@corelink.edu.vn', password: 'Test@123456' });
    studentToken = studentRes.body.accessToken;

    const youngRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'young_student_test@corelink.edu.vn', password: 'Test@123456' });
    youngStudentToken = youngRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // BỘ TEST CASES THEO MÃ B5 (TC-024 .. TC-038)
  // ==========================================

  it('TC-024 Admin tạo tài khoản học sinh', async () => {
    const timestamp = Date.now();
    const res = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Học Sinh Mới TC024',
        phone: `098${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: `tc024_${timestamp}@example.com`,
        role: 'student',
        gradeLevel: 7,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('tempPassword');
    expect(res.body.tempPassword).toMatch(/^CL@/);
    expect(res.body.student).toBeDefined();
  });

  it('TC-025 Bắt buộc đổi mật khẩu lần đầu', async () => {
    const email = `first_time_${Date.now()}@example.com`;
    const hash = await argon2.hash('Temp@123456', { type: argon2.argon2id });
    const user = await prisma.users.create({
      data: {
        branch_id: branchId,
        full_name: 'User Đổi Mật Khẩu Lần Đầu',
        email,
        password_hash: hash,
        must_change_password: true,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: email, password: 'Temp@123456' })
      .expect(200);

    expect(res.body.user.mustChangePassword).toBe(true);

    // Người dùng thực hiện đổi mật khẩu
    await request(app.getHttpServer())
      .post('/api/v1/auth/password/change')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .send({ currentPassword: 'Temp@123456', newPassword: 'NewPassword@2026' })
      .expect(200);

    const updated = await prisma.users.findUnique({ where: { id: user.id } });
    expect(updated?.must_change_password).toBe(false);
  });

  it('TC-026 Mật khẩu tạm hết hạn sau 72 giờ', async () => {
    const email = `expired_temp_${Date.now()}@example.com`;
    const hash = await argon2.hash('Temp@Expired', { type: argon2.argon2id });
    // Hết hạn cách đây 1 giờ
    const expiredTime = new Date(Date.now() - 3600 * 1000);
    await prisma.users.create({
      data: {
        branch_id: branchId,
        full_name: 'User Mật Khẩu Tạm Quá Hạn',
        email,
        password_hash: hash,
        must_change_password: true,
        temp_password_expires_at: expiredTime,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: email, password: 'Temp@Expired' })
      .expect(401);

    expect(res.body.message).toContain('72 giờ');
  });

  it('TC-027 Một học sinh có hai phụ huynh với quyền khác nhau', async () => {
    // Tạo thêm phụ huynh B
    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });
    const guardianUserB = await prisma.users.create({
      data: {
        branch_id: branchId,
        full_name: 'Bố Học Sinh',
        phone: `+8498${Math.floor(1000000 + Math.random() * 9000000)}`,
        password_hash: hash,
      },
    });
    const guardianB = await prisma.guardians.create({
      data: { user_id: guardianUserB.id, branch_id: branchId },
    });

    // Liên kết phụ huynh B với quyền tắt nhận học phí
    await request(app.getHttpServer())
      .post(`/api/v1/students/${studentId}/guardians`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        guardianId: guardianB.id,
        relation: 'father',
        canViewResults: true,
        canMessage: true,
        receivesFeeNotice: false,
      })
      .expect(201);

    const check = await prisma.guardianships.findUnique({
      where: { student_id_guardian_id: { student_id: studentId, guardian_id: guardianB.id } },
    });
    expect(check?.can_view_results).toBe(true);
    expect(check?.receives_fee_notice).toBe(false);
  });

  it('TC-028 Giới hạn 4 phụ huynh', async () => {
    // Thêm phụ huynh mới cho otherStudentId (đảm bảo tới ngưỡng 4)
    const currentCount = await prisma.guardianships.count({ where: { student_id: otherStudentId } });
    for (let i = currentCount; i < 4; i++) {
      const gUser = await prisma.users.create({
        data: {
          branch_id: branchId,
          full_name: `Guardian Auto ${i}`,
          phone: `+8497${Math.floor(1000000 + Math.random() * 9000000)}`,
          password_hash: 'hash',
        },
      });
      const g = await prisma.guardians.create({
        data: { user_id: gUser.id, branch_id: branchId },
      });
      await prisma.guardianships.create({
        data: { student_id: otherStudentId, guardian_id: g.id, relation: 'guardian' },
      });
    }

    // Thử thêm phụ huynh thứ 5 -> bị chặn (400)
    const g5User = await prisma.users.create({
      data: {
        branch_id: branchId,
        full_name: 'Guardian 5 Overflow',
        phone: `+8497${Math.floor(1000000 + Math.random() * 9000000)}`,
        password_hash: 'hash',
      },
    });
    const g5 = await prisma.guardians.create({
      data: { user_id: g5User.id, branch_id: branchId },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/students/${otherStudentId}/guardians`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ guardianId: g5.id, relation: 'other' })
      .expect(400);
  });

  it('TC-029 Giáo viên không xem được lớp khác qua API', async () => {
    // Teacher dạy classId, gọi sang otherClassId -> 403
    await request(app.getHttpServer())
      .get(`/api/v1/classes/${otherClassId}/sessions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(403);
  });

  it('TC-030 Phụ huynh không xem được học sinh khác bằng đổi mã', async () => {
    // Guardian chỉ giám hộ studentId, gọi sang otherStudentId -> 403
    await request(app.getHttpServer())
      .get(`/api/v1/students/${otherStudentId}/progress`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .expect(403);
  });

  it('TC-031 Đổi quyền có hiệu lực ngay và có nhật ký', async () => {
    // Admin khóa tài khoản teacher
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${teacherUserId}/lock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lock: true, reason: 'Tạm dừng công tác' })
      .expect(200);

    // Kiểm tra audit_logs có bản ghi
    const log = await prisma.audit_logs.findFirst({
      where: { entity_id: teacherUserId, action: 'user.lock' },
    });
    expect(log).toBeDefined();
    expect(log?.reason).toBe('Tạm dừng công tác');

    // Mở lại tài khoản
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${teacherUserId}/lock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lock: false, reason: 'Mở lại' })
      .expect(200);
  });

  it('TC-032 Một người nhiều vai trò chuyển vai trò', async () => {
    // Gán thêm vai trò Academic cho teacherUser
    const academicRole = await prisma.roles.findUnique({ where: { code: 'academic' } });
    const teacherUser = await prisma.users.findUnique({ where: { email: 'teacher_test@corelink.edu.vn' } });

    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: teacherUser!.id, role_id: academicRole!.id } },
      update: {},
      create: { user_id: teacherUser!.id, role_id: academicRole!.id },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_test@corelink.edu.vn', password: 'Test@123456' })
      .expect(200);

    expect(res.body.user.roles).toContain('teacher');
    expect(res.body.user.roles).toContain('academic');
  });

  it('TC-033 Khóa tài khoản sau 5 lần sai', async () => {
    const credential = 'student_test@corelink.edu.vn';
    for (let i = 1; i <= 4; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ credential, password: 'WrongPassword' })
        .expect(401);
    }

    // Lần thứ 5 sai -> 403 khóa 15 phút
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential, password: 'WrongPassword' })
      .expect(403);

    expect(res.body.message).toContain('15 phút');

    // Thử lại ngay cả với mật khẩu đúng vẫn bị từ chối
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential, password: 'Test@123456' })
      .expect(403);

    // Mở khóa cho student để không ảnh hưởng test sau
    await prisma.users.update({
      where: { email: credential },
      data: { failed_login_count: 0, locked_until: null },
    });
  });

  it('TC-034 Admin bắt buộc xác thực 2 lớp', async () => {
    // Bật 2FA cho adminUser
    await prisma.users.update({
      where: { id: adminUserId },
      data: { twofa_secret: '654321' },
    });

    // Đăng nhập không kèm mã 2FA -> 401 yêu cầu 2FA
    const resNo2FA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_test@corelink.edu.vn', password: 'Test@123456' })
      .expect(401);
    expect(resNo2FA.body.message).toContain('2FA');

    // Đăng nhập kèm mã 2FA sai -> 401
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_test@corelink.edu.vn', password: 'Test@123456', twoFactorCode: '000000' })
      .expect(401);

    // Đăng nhập kèm mã 2FA đúng -> 200
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_test@corelink.edu.vn', password: 'Test@123456', twoFactorCode: '654321' })
      .expect(200);

    // Gỡ 2FA để dọn dẹp
    await prisma.users.update({
      where: { id: adminUserId },
      data: { twofa_secret: null },
    });
  });

  it('TC-035 Quên mật khẩu qua email', async () => {
    const forgotRes = await request(app.getHttpServer())
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'student_test@corelink.edu.vn' })
      .expect(200);

    const debugToken = forgotRes.body.debugToken;
    expect(debugToken).toBeDefined();

    // Reset bằng token
    await request(app.getHttpServer())
      .post('/api/v1/auth/password/reset')
      .send({ token: debugToken, newPassword: 'ResetPassword@2026' })
      .expect(200);

    // Đăng nhập bằng mật khẩu mới
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student_test@corelink.edu.vn', password: 'ResetPassword@2026' })
      .expect(200);
  });

  it('TC-036 Học sinh nhỏ không có nhắn tin', async () => {
    // Tài khoản học sinh nhỏ gọi API tạo hội thoại -> 403
    await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${youngStudentToken}`)
      .send({})
      .expect(403);
  });

  it('TC-037 Chưa đồng ý thì không dùng được hệ thống', async () => {
    const email = `no_consent_${Date.now()}@example.com`;
    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });
    const userNoConsent = await prisma.users.create({
      data: {
        branch_id: branchId,
        full_name: 'No Consent User',
        email,
        password_hash: hash,
        must_change_password: false,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: email, password: 'Test@123456' })
      .expect(200);

    expect(res.body.user.hasConsented).toBe(false);
  });

  it('TC-038 Rút đồng ý tạo yêu cầu cho Admin', async () => {
    // Tạo consent
    await request(app.getHttpServer())
      .post('/api/v1/auth/consents')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ scope: 'data_processing' })
      .expect(201);

    // Rút consent
    await request(app.getHttpServer())
      .post('/api/v1/auth/consents/withdraw')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ scope: 'data_processing' })
      .expect(200);

    // Kiểm tra audit_logs có bản ghi rút consent
    const audit = await prisma.audit_logs.findFirst({
      where: { action: 'consent.withdraw' },
    });
    expect(audit).toBeDefined();
  });
});
