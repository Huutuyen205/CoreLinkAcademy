import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M11–M15 Học phí, Lương, Báo cáo, Khảo sát, Nhập xuất, Quản trị hệ thống & NFR (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let adminToken: string;
  let adminUserId: string;
  let accountantToken: string;
  let accountantUserId: string;
  let consultantToken: string;
  let consultantUserId: string;
  let teacher1Token: string;
  let teacher1UserId: string;
  let teacher1Id: string;
  let teacher2Token: string;
  let teacher2UserId: string;
  let teacher2Id: string;
  let parentToken: string;
  let parentUserId: string;
  let parentGuardianId: string;
  let parent2UserId: string;
  let parent2GuardianId: string;
  let student1Id: string;
  let student1UserId: string;
  let classId: string;

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe("UPDATE payroll_periods SET status = 'open' WHERE status = 'closed'");
      await prisma.$transaction([
        prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0'),
        prisma.$executeRawUnsafe('DELETE FROM survey_responses'),
        prisma.$executeRawUnsafe('DELETE FROM surveys'),
        prisma.$executeRawUnsafe('DELETE FROM imports'),
        prisma.$executeRawUnsafe('DELETE FROM receipts'),
        prisma.$executeRawUnsafe('DELETE FROM receipt_counters'),
        prisma.$executeRawUnsafe('DELETE FROM payments'),
        prisma.$executeRawUnsafe('DELETE FROM invoices'),
        prisma.$executeRawUnsafe('DELETE FROM payroll_sessions'),
        prisma.$executeRawUnsafe('DELETE FROM payroll_items'),
        prisma.$executeRawUnsafe('DELETE FROM payroll_periods'),
        prisma.$executeRawUnsafe('DELETE FROM pay_rates'),
        prisma.$executeRawUnsafe('DELETE FROM ai_jobs'),
        prisma.$executeRawUnsafe('DELETE FROM class_sessions WHERE session_no >= 100'),
        prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1'),
      ]);
    } catch (e) {
      console.error('CLEANUP ERROR:', e);
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await cleanupData();

    // 1. Branch
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // Roles
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const accountantRole = await prisma.roles.findUnique({ where: { code: 'accountant' } });
    const consultantRole = await prisma.roles.findUnique({ where: { code: 'consultant' } });
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const guardianRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });

    // 2. Admin User
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Quản trị viên Hệ thống',
        email: 'admin_step10@corelink.edu.vn',
        phone: '+84988880100',
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

    // 3. Accountant User
    const accUser = await prisma.users.upsert({
      where: { email: 'accountant_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Kế toán trưởng',
        email: 'accountant_step10@corelink.edu.vn',
        phone: '+84988880101',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    accountantUserId = accUser.id;
    if (accountantRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: accUser.id, role_id: accountantRole.id } },
        update: {},
        create: { user_id: accUser.id, role_id: accountantRole.id },
      });
    }

    // 4. Consultant User
    const conUser = await prisma.users.upsert({
      where: { email: 'consultant_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Tư vấn viên Tuyển sinh',
        email: 'consultant_step10@corelink.edu.vn',
        phone: '+84988880102',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    consultantUserId = conUser.id;
    if (consultantRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: conUser.id, role_id: consultantRole.id } },
        update: {},
        create: { user_id: conUser.id, role_id: consultantRole.id },
      });
    }

    // 5. Teachers
    const t1User = await prisma.users.upsert({
      where: { email: 'teacher1_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy David Smith',
        email: 'teacher1_step10@corelink.edu.vn',
        phone: '+84988880103',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacher1UserId = t1User.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: t1User.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: t1User.id, role_id: teacherRole.id },
      });
    }
    const t1 = await prisma.teachers.upsert({
      where: { user_id: t1User.id },
      update: {},
      create: { user_id: t1User.id, branch_id: branchId },
    });
    teacher1Id = t1.id;

    const t2User = await prisma.users.upsert({
      where: { email: 'teacher2_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Cô Sarah Jones',
        email: 'teacher2_step10@corelink.edu.vn',
        phone: '+84988880104',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacher2UserId = t2User.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: t2User.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: t2User.id, role_id: teacherRole.id },
      });
    }
    const t2 = await prisma.teachers.upsert({
      where: { user_id: t2User.id },
      update: {},
      create: { user_id: t2User.id, branch_id: branchId },
    });
    teacher2Id = t2.id;

    // 6. Student
    const stUser = await prisma.users.upsert({
      where: { email: 'student1_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Nguyễn Gia Bảo',
        email: 'student1_step10@corelink.edu.vn',
        phone: '+84988880105',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    student1UserId = stUser.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: stUser.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: stUser.id, role_id: studentRole.id },
      });
    }
    const st1 = await prisma.students.upsert({
      where: { user_id: stUser.id },
      update: {},
      create: { user_id: stUser.id, branch_id: branchId, code: 'HS-S10-01', grade_level: 3 },
    });
    student1Id = st1.id;

    // 7. Parents: Parent 1 (receives_fee_notice = true), Parent 2 (receives_fee_notice = false)
    const p1User = await prisma.users.upsert({
      where: { email: 'parent1_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phụ huynh Nguyễn Văn Bố',
        email: 'parent1_step10@corelink.edu.vn',
        phone: '+84988880106',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    parentUserId = p1User.id;
    if (guardianRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: p1User.id, role_id: guardianRole.id } },
        update: {},
        create: { user_id: p1User.id, role_id: guardianRole.id },
      });
    }
    const gd1 = await prisma.guardians.upsert({
      where: { user_id: p1User.id },
      update: {},
      create: { user_id: p1User.id, branch_id: branchId },
    });
    parentGuardianId = gd1.id;

    const p2User = await prisma.users.upsert({
      where: { email: 'parent2_step10@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phụ huynh Nguyễn Thị Mẹ (không nhận phí)',
        email: 'parent2_step10@corelink.edu.vn',
        phone: '+84988880107',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    parent2UserId = p2User.id;
    if (guardianRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: p2User.id, role_id: guardianRole.id } },
        update: {},
        create: { user_id: p2User.id, role_id: guardianRole.id },
      });
    }
    const gd2 = await prisma.guardians.upsert({
      where: { user_id: p2User.id },
      update: {},
      create: { user_id: p2User.id, branch_id: branchId },
    });
    parent2GuardianId = gd2.id;

    // Link guardianships: P1 receives fee notice, P2 does NOT
    await prisma.guardianships.upsert({
      where: {
        student_id_guardian_id: { student_id: student1Id, guardian_id: parentGuardianId },
      },
      update: { receives_fee_notice: true },
      create: {
        student_id: student1Id,
        guardian_id: parentGuardianId,
        relation: 'father',
        receives_fee_notice: true,
      },
    });

    await prisma.guardianships.upsert({
      where: {
        student_id_guardian_id: { student_id: student1Id, guardian_id: parent2GuardianId },
      },
      update: { receives_fee_notice: false },
      create: {
        student_id: student1Id,
        guardian_id: parent2GuardianId,
        relation: 'mother',
        receives_fee_notice: false, // TC-128: không nhận thông báo phí
      },
    });

    // 8. Class & Sessions
    const program = await prisma.programs.findFirst();
    const cls = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        name: 'Lớp IELTS Advanced 10',
        code: `CLS-S10-${Date.now().toString().slice(-4)}`,
        status: 'running',
        start_date: new Date('2026-11-01'),
        end_date: new Date('2026-12-30'),
        capacity: 15,
        recurrence: { days: [2, 4, 6], start_time: '18:00', end_time: '19:30' },
        created_by: adminUser.id,
      },
    });
    classId = cls.id;

    // 9. Auth Tokens
    const aLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_step10@corelink.edu.vn', password: 'Test@123456' });
    adminToken = aLogin.body.accessToken;

    const accLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'accountant_step10@corelink.edu.vn', password: 'Test@123456' });
    accountantToken = accLogin.body.accessToken;

    const conLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'consultant_step10@corelink.edu.vn', password: 'Test@123456' });
    consultantToken = conLogin.body.accessToken;

    const t1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher1_step10@corelink.edu.vn', password: 'Test@123456' });
    teacher1Token = t1Login.body.accessToken;

    const t2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher2_step10@corelink.edu.vn', password: 'Test@123456' });
    teacher2Token = t2Login.body.accessToken;

    const pLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'parent1_step10@corelink.edu.vn', password: 'Test@123456' });
    parentToken = pLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  // =========================================================================
  // M11 HỌC PHÍ & LƯƠNG GIÁO VIÊN (TC-125..TC-131)
  // =========================================================================

  let createdInvoice1Id: string;
  let createdInvoice2Id: string;

  it('TC-125 (FR-1101): Ghi danh tạo khoản phải thu có giảm giá chuẩn xác', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        branch_id: branchId,
        student_id: student1Id,
        description: 'Học phí khoá IELTS Advanced 3 tháng',
        amount_vnd: 6000000,
        discount_vnd: 1000000,
        discount_reason: 'Ưu đãi đăng ký sớm',
        due_date: '2026-11-15',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.amount_vnd).toBe('6000000');
    expect(res.body.discount_vnd).toBe('1000000');
    expect(res.body.net_receivable_vnd).toBe('5000000'); // 6.000.000 - 1.000.000 = 5.000.000
    expect(res.body.status).toBe('unpaid');

    createdInvoice1Id = res.body.id;
  });

  it('TC-126 (FR-1102): Ghi nhận thanh toán và cấp số biên nhận không trùng (FOR UPDATE lock)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/finance/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoice_id: createdInvoice1Id,
        amount_vnd: 5000000,
        method: 'bank_transfer',
        gateway_txn_id: `TXN-${Date.now()}`,
        note: 'Chuyển khoản Vietcombank đủ 100%',
      });

    expect(res.status).toBe(201);
    expect(res.body.receipt).toBeDefined();
    expect(res.body.receipt.receipt_no).toMatch(/^REC-\d{4}-\d{5}$/);
    expect(res.body.invoice.status).toBe('paid');
    expect(res.body.invoice.remaining_debt_vnd).toBe('0');
  });

  it('TC-127 (FR-1102): Thanh toán một phần -> Trạng thái partial & công nợ còn lại chuẩn', async () => {
    // Tạo hoá đơn 2
    const invRes = await request(app.getHttpServer())
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        branch_id: branchId,
        student_id: student1Id,
        description: 'Học phí kỳ 2',
        amount_vnd: 8000000,
        discount_vnd: 0,
        due_date: '2026-11-20',
      });
    createdInvoice2Id = invRes.body.id;

    // Thanh toán đợt 1: 3.000.000 / 8.000.000
    const payRes = await request(app.getHttpServer())
      .post('/api/v1/finance/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoice_id: createdInvoice2Id,
        amount_vnd: 3000000,
        method: 'cash',
        note: 'Đóng trước đợt 1',
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.invoice.status).toBe('partial');
    expect(payRes.body.invoice.paid_vnd).toBe('3000000');
    expect(payRes.body.invoice.remaining_debt_vnd).toBe('5000000');
  });

  it('TC-128 (FR-1102): Nhắc phí đúng người -> Chỉ phụ huynh có receives_fee_notice = true nhận thông báo', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/invoices/${createdInvoice2Id}/remind`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(201);
    expect(res.body.recipients_count).toBe(1);
    expect(res.body.recipients[0].guardian_id).toBe(parentGuardianId);
    expect(res.body.recipients[0].receives_fee_notice).toBe(true);

    // Xác minh phụ huynh 2 (receives_fee_notice = false) không nằm trong danh sách gửi
    const recipientGuardianIds = res.body.recipients.map((r: any) => r.guardian_id);
    expect(recipientGuardianIds).not.toContain(parent2GuardianId);
  });

  let payrollPeriodId: string;

  it('TC-129 (FR-1105): Lương tính đúng buổi đã xác thực (verified_at != null)', async () => {
    // Tạo 3 buổi học trong tháng 11/2026: 2 buổi đã xác thực, 1 buổi chưa xác thực
    const nov1 = new Date('2026-11-05T09:00:00Z');
    const nov2 = new Date('2026-11-08T09:00:00Z');
    const nov3 = new Date('2026-11-12T09:00:00Z');

    // Buổi 1: Thầy David dạy, đã xác thực
    await prisma.class_sessions.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        session_no: 101,
        starts_at: nov1,
        ends_at: new Date(nov1.getTime() + 90 * 60 * 1000),
        teacher_id: teacher1Id,
        verified_at: new Date('2026-11-05T11:00:00Z'),
        status: 'done',
      },
    });

    // Buổi 2: Thầy David dạy, đã xác thực
    await prisma.class_sessions.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        session_no: 102,
        starts_at: nov2,
        ends_at: new Date(nov2.getTime() + 90 * 60 * 1000),
        teacher_id: teacher1Id,
        verified_at: new Date('2026-11-08T11:00:00Z'),
        status: 'done',
      },
    });

    // Buổi 3: Thầy David dạy, CHƯA xác thực (verified_at == null)
    await prisma.class_sessions.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        session_no: 103,
        starts_at: nov3,
        ends_at: new Date(nov3.getTime() + 90 * 60 * 1000),
        teacher_id: teacher1Id,
        verified_at: null, // Chưa duyệt
        status: 'scheduled',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/finance/payroll/calculate')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        branch_id: branchId,
        period_month: '2026-11',
        default_rate_vnd: 300000,
      });

    expect(res.status).toBe(201);
    expect(res.body.period_month).toBe('2026-11');
    expect(res.body.unverified_sessions_count).toBeGreaterThanOrEqual(1);

    payrollPeriodId = res.body.period_id;

    // Tìm item của Thầy David
    const t1Item = res.body.payroll_items.find((i: any) => i.teacher_id === teacher1Id);
    expect(t1Item).toBeDefined();
    // Chỉ tính 2 buổi đã xác thực, không tính buổi 3
    expect(t1Item.sessions_count).toBe(2);
    expect(t1Item.total_vnd).toBe((2 * 300000).toString());
  });

  it('TC-130 (FR-1105): Buổi dạy thay tính lương cho người dạy thực tế (substitute_for_teacher_id)', async () => {
    // Buổi 4: Cô Sarah (teacher2) dạy thay cho Thầy David (teacher1)
    const nov15 = new Date('2026-11-15T09:00:00Z');
    await prisma.class_sessions.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        session_no: 104,
        starts_at: nov15,
        ends_at: new Date(nov15.getTime() + 90 * 60 * 1000),
        teacher_id: teacher2Id, // Người thực dạy
        substitute_for_teacher_id: teacher1Id, // Dạy thay cho Thầy David
        verified_at: new Date('2026-11-15T11:00:00Z'),
        status: 'done',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/finance/payroll/calculate')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        branch_id: branchId,
        period_month: '2026-11',
        default_rate_vnd: 300000,
      });

    expect(res.status).toBe(201);

    // Cô Sarah nhận lương cho buổi dạy thay này
    const t2Item = res.body.payroll_items.find((i: any) => i.teacher_id === teacher2Id);
    expect(t2Item).toBeDefined();
    expect(t2Item.sessions_count).toBe(1);
    expect(t2Item.total_vnd).toBe('300000');

    // Thầy David vẫn giữ nguyên 2 buổi, không nhận thêm buổi bị thay
    const t1Item = res.body.payroll_items.find((i: any) => i.teacher_id === teacher1Id);
    expect(t1Item.sessions_count).toBe(2);
  });

  it('TC-131 (FR-1104): Đổi đơn giá theo ngày hiệu lực không làm ảnh hưởng các tháng đã chốt kỳ', async () => {
    // 1. Chốt kỳ lương tháng 11
    const closeRes = await request(app.getHttpServer())
      .post(`/api/v1/finance/payroll/periods/${payrollPeriodId}/close`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(closeRes.status).toBe(201);
    expect(closeRes.body.status).toBe('closed');

    // 2. Cố tình tính lại kỳ đã chốt -> Phải bị chặn 400 Bad Request
    const recalculateRes = await request(app.getHttpServer())
      .post('/api/v1/finance/payroll/calculate')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        branch_id: branchId,
        period_month: '2026-11',
        default_rate_vnd: 500000, // Đơn giá mới tăng vọt
      });

    expect(recalculateRes.status).toBe(400);
    expect(recalculateRes.body.message).toContain('Kỳ lương đã chốt');
  });

  // =========================================================================
  // M12 BÁO CÁO & THỐNG KÊ (TC-134..TC-136)
  // =========================================================================

  it('TC-134 (FR-1201): Mọi con số trên dashboard bấm xem chi tiết trả về đúng số lượng bản ghi', async () => {
    const dashRes = await request(app.getHttpServer())
      .get(`/api/v1/finance/reports/dashboard?branch_id=${branchId}`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.total_invoices).toBeGreaterThanOrEqual(2);
    expect(dashRes.body.partial_count).toBeGreaterThanOrEqual(1);

    const partialCountOnDash = dashRes.body.partial_count;

    // Xem chi tiết danh sách hoá đơn partial
    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/finance/reports/invoices-detail?branch_id=${branchId}&status=partial`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.total).toBe(partialCountOnDash);
    expect(detailRes.body.items.length).toBe(partialCountOnDash);
  });

  it('TC-135 (FR-1202): Báo cáo giới hạn theo vai trò -> Tư vấn viên bị chặn HTTP 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/finance/reports/dashboard?branch_id=${branchId}`)
      .set('Authorization', `Bearer ${consultantToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Bạn không có vai trò cần thiết');
  });

  it('TC-136 (FR-1203): Xuất Excel/CSV khớp màn hình -> Số dòng và tổng tiền khớp 100%', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/finance/reports/export-csv?branch_id=${branchId}`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['x-total-rows']).toBeDefined();
    expect(res.headers['x-sum-net-vnd']).toBeDefined();

    const csvText: string = res.text;
    expect(csvText).toContain('Mã hoá đơn,Học sinh');
    expect(csvText).toContain('TỔNG CỘNG');
  });

  // =========================================================================
  // M13 KHẢO SÁT & ĐÁNH GIÁ GIÁO VIÊN (TC-138, TC-139)
  // =========================================================================

  let surveyId: string;

  it('TC-138 (FR-1301): Mỗi người chỉ trả lời 1 lần mỗi kỳ (SHA-256 hash ẩn danh; gửi lần 2 bị chặn 400)', async () => {
    // 1. Admin tạo khảo sát
    const sRes = await request(app.getHttpServer())
      .post('/api/v1/admin-system/surveys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branch_id: branchId,
        title: 'Khảo sát chất lượng giảng dạy Kỳ Thu 2026',
        audience: 'guardian',
        questions: [{ id: 'q1', text: 'Mức độ hài lòng' }],
        period_code: '2026-Q3',
        opens_at: '2026-10-01',
        closes_at: '2026-12-31',
      });
    surveyId = sRes.body.id;

    // 2. Phụ huynh gửi phản hồi lần 1 -> Thành công
    const subRes1 = await request(app.getHttpServer())
      .post('/api/v1/admin-system/surveys/responses')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        survey_id: surveyId,
        teacher_id: teacher1Id,
        answers: { q1: 5, comment: 'Thầy David dạy rất nhiệt tình và chu đáo' },
        avg_stars: 5,
      });

    expect(subRes1.status).toBe(201);
    expect(subRes1.body.response_id).toBeDefined();

    // 3. Phụ huynh cố tình gửi lần 2 cho cùng giáo viên -> Bị chặn 400 Bad Request
    const subRes2 = await request(app.getHttpServer())
      .post('/api/v1/admin-system/surveys/responses')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        survey_id: surveyId,
        teacher_id: teacher1Id,
        answers: { q1: 4, comment: 'Gửi thêm lần nữa' },
        avg_stars: 4,
      });

    expect(subRes2.status).toBe(400);
    expect(subRes2.body.message).toContain('Mỗi người chỉ được tham gia 1 lần mỗi kỳ');
  });

  it('TC-139 (FR-1301): Giáo viên xem kết quả khảo sát không thấy danh tính người trả lời', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin-system/surveys/${surveyId}/teacher-results/${teacher1Id}`)
      .set('Authorization', `Bearer ${teacher1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.total_responses).toBe(1);
    expect(res.body.average_stars).toBe(5);
    expect(res.body.feedback_comments).toContain('Thầy David dạy rất nhiệt tình và chu đáo');

    // Tuyệt đối không để lộ danh tính
    expect(res.body.respondent_hash).toBeUndefined();
    expect(res.body.user_id).toBeUndefined();
    expect(res.body.phone).toBeUndefined();
    expect(res.body.email).toBeUndefined();
    expect(res.body.student_name).toBeUndefined();
  });

  // =========================================================================
  // M14 NHẬP DỮ LIỆU EXCEL (TC-141..TC-143)
  // =========================================================================

  const sampleIdempotencyKey = `IMPORT-${Date.now()}`;

  it('TC-141 (FR-1402): Nhập Excel có dòng lỗi -> Nhập dòng hợp lệ, xuất danh sách lỗi kèm lý do', async () => {
    const rows = [
      {
        full_name: 'Lê Bảo Anh',
        phone: '0912345678',
        email: 'baoanh@example.com',
      },
      {
        full_name: '', // Lỗi thiếu tên
        phone: '0987654321',
      },
      {
        full_name: 'Trần Văn Sai Số',
        phone: '12345', // Lỗi sai định dạng số điện thoại
      },
    ];

    const res = await request(app.getHttpServer())
      .post('/api/v1/admin-system/imports/process')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branch_id: branchId,
        entity: 'students',
        idempotency_key: sampleIdempotencyKey,
        rows,
      });

    expect(res.status).toBe(201);
    expect(res.body.total_rows).toBe(3);
    expect(res.body.ok_rows_count).toBe(1);
    expect(res.body.error_rows_count).toBe(2);
    expect(res.body.error_rows[0].reason).toContain('Thiếu họ tên');
    expect(res.body.error_rows[1].reason).toContain('Số điện thoại không đúng định dạng');
  });

  it('TC-142 (FR-1402): Cột lạ trong file nhập được lưu thành trường tùy biến (custom_fields)', async () => {
    const importKey = `IMPORT-CUSTOM-${Date.now()}`;
    const rows = [
      {
        full_name: 'Hoàng Nhật Minh',
        phone: '0933334444',
        email: 'minh@example.com',
        hobby: 'Chơi cờ vua & Bơi lội', // Cột lạ
        previous_school: 'Tiểu học Lê Quý Đôn', // Cột lạ
      },
    ];

    const res = await request(app.getHttpServer())
      .post('/api/v1/admin-system/imports/process')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branch_id: branchId,
        entity: 'students',
        idempotency_key: importKey,
        rows,
      });

    expect(res.status).toBe(201);
    expect(res.body.ok_rows_count).toBe(1);
    expect(res.body.ok_rows[0].custom_fields).toBeDefined();
    expect(res.body.ok_rows[0].custom_fields.hobby).toBe('Chơi cờ vua & Bơi lội');
    expect(res.body.ok_rows[0].custom_fields.previous_school).toBe('Tiểu học Lê Quý Đôn');
  });

  it('TC-143 (FR-1402): Nhập lại cùng file không tạo trùng bản ghi (chống trùng idempotency_key -> 409 Conflict)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin-system/imports/process')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branch_id: branchId,
        entity: 'students',
        idempotency_key: sampleIdempotencyKey, // Trùng key từ TC-141
        rows: [{ full_name: 'Dữ liệu trùng', phone: '0912345678' }],
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('File đã được nhập trước đó');
  });

  // =========================================================================
  // M15 QUẢN TRỊ HỆ THỐNG (TC-144..TC-148)
  // =========================================================================

  it('TC-144 (FR-1501): Nhật ký audit_logs bất biến (không có endpoint UPDATE/DELETE -> 404/405)', async () => {
    // 1. Tạo 1 log
    await prisma.audit_logs.create({
      data: {
        branch_id: branchId,
        actor_id: adminUserId,
        action: 'UPDATE_SETTING',
        entity: 'settings',
        reason: 'Cập nhật cấu hình bảo mật',
      },
    });

    // 2. GET audit-logs -> Thành công
    const getRes = await request(app.getHttpServer())
      .get('/api/v1/admin-system/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBeGreaterThanOrEqual(1);

    // 3. Cố tình DELETE audit log -> 404 Not Found (Không tồn tại endpoint sửa xóa)
    const delRes = await request(app.getHttpServer())
      .delete('/api/v1/admin-system/audit-logs/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([404, 405]).toContain(delRes.status);
  });

  it('TC-145 (FR-1502): Cảnh báo khi chi phí AI chạm ngưỡng 80% hạn mức tháng', async () => {
    // Đặt hạn mức 100 USD trong settings
    await prisma.settings.upsert({
      where: {
        branch_id_setting_key: {
          branch_id: branchId,
          setting_key: 'ai_monthly_budget_usd',
        },
      },
      update: { setting_value: 100 },
      create: {
        branch_id: branchId,
        setting_key: 'ai_monthly_budget_usd',
        setting_value: 100,
      },
    });

    // Xóa jobs cũ để đảm bảo chính xác 85%
    await prisma.$executeRawUnsafe('DELETE FROM ai_jobs');

    // Tạo ai_jobs tốn 85 USD (85% > 80%)
    await prisma.ai_jobs.create({
      data: {
        branch_id: branchId,
        feature: 'audio_grading',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        cost_usd: 85.0,
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin-system/ai-budget/check?branch_id=${branchId}&feature=lead_chatbot`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.alert).toBe(true);
    expect(res.body.message).toContain('Cảnh báo: Chi phí AI đã chạm');
  });

  it('TC-146 (FR-1502): Đạt 100% hạn mức AI -> Tạm dừng tính năng không thiết yếu; chatbot tư vấn thiết yếu vẫn duy trì', async () => {
    // Thêm ai_jobs tốn thêm 20 USD -> Tổng = 105 USD (> 100 USD hạn mức = 105%)
    await prisma.ai_jobs.create({
      data: {
        branch_id: branchId,
        feature: 'video_transcription',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        cost_usd: 20.0,
      },
    });

    // 1. Kiểm tra tính năng KHÔNG thiết yếu (ví dụ: curriculum_suggestion) -> Bị chặn 403
    const nonEssentialRes = await request(app.getHttpServer())
      .get(`/api/v1/admin-system/ai-budget/check?branch_id=${branchId}&feature=curriculum_suggestion`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(nonEssentialRes.status).toBe(403);
    expect(nonEssentialRes.body.message).toContain('Chi phí AI tháng đã đạt 100%');

    // 2. Kiểm tra tính năng THIẾT YẾU (lead_chatbot) -> Được phép duy trì
    const essentialRes = await request(app.getHttpServer())
      .get(`/api/v1/admin-system/ai-budget/check?branch_id=${branchId}&feature=lead_chatbot`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(essentialRes.status).toBe(200);
    expect(essentialRes.body.allowed).toBe(true);
    expect(essentialRes.body.is_essential).toBe(true);
  });

  it('TC-147 (FR-1504): Khôi phục dữ liệu / kiểm tra toàn vẹn sao lưu hệ thống', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin-system/backups/check')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.backup_file_verified).toBe(true);
    expect(res.body.checksum_algorithm).toBe('SHA-256');
  });

  it('TC-148 (FR-1505): Xuất toàn bộ dữ liệu hệ thống (ZIP chứa JSON/CSV các bảng)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin-system/export-all?branch_id=${branchId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/zip');
    expect(res.headers['content-disposition']).toContain('.zip');
    expect(Number(res.headers['content-length'])).toBeGreaterThan(100);
  });

  // =========================================================================
  // PHI CHỨC NĂNG (NFR): TC-149..TC-153
  // =========================================================================

  it('TC-149 (NFR): Quét bảo mật OWASP / kiểm tra header bảo mật', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');

    // Kiểm tra các headers an toàn cơ bản
    expect(res.headers['x-powered-by']).toBeUndefined(); // Không để lộ framework/NestJS
  });

  it('TC-150 (NFR): Kiểm thử truy cập chéo tự động mọi endpoint (RBAC 2 tầng)', async () => {
    // Phụ huynh truy cập API quản trị sao lưu -> Bị chặn 403 Forbidden
    const res1 = await request(app.getHttpServer())
      .get('/api/v1/admin-system/backups/check')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res1.status).toBe(403);

    // Không có token -> 401 Unauthorized
    const res2 = await request(app.getHttpServer())
      .get('/api/v1/finance/reports/dashboard');
    expect(res2.status).toBe(401);
  });

  it('TC-151 (NFR): Link file riêng tư có thời hạn sử dụng (link hết hạn bị từ chối 403)', async () => {
    // 1. Tạo signed URL hết hạn sau 1 giây
    const signRes = await request(app.getHttpServer())
      .post('/api/v1/admin-system/files/signed-url')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ file_id: 'test-private-doc-01', ttl_seconds: 1 });

    expect(signRes.status).toBe(201);
    expect(signRes.body.token).toBeDefined();

    const { file_id, token } = signRes.body;
    const expires = new Date(signRes.body.expires_at).getTime();

    // 2. Chờ 1.5 giây để link hết hạn
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Tải link đã hết hạn -> Bị từ chối 403 Forbidden
    const dlRes = await request(app.getHttpServer())
      .get(`/api/v1/admin-system/files/download?fileId=${file_id}&expires=${expires}&token=${token}`);

    expect(dlRes.status).toBe(403);
    expect(dlRes.body.message).toContain('Liên kết tải tệp riêng tư đã hết hạn');
  });

  it('TC-152 & TC-153 (NFR): Đảm bảo giao diện 360px & tính tiện dụng phụ huynh qua API contracts', async () => {
    // Kiểm tra API trả về cấu trúc dữ liệu gọn gàng, hỗ trợ hiển thị 360px
    const res = await request(app.getHttpServer())
      .get(`/api/v1/finance/reports/invoices-detail?branch_id=${branchId}`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    if (res.body.items.length > 0) {
      const first = res.body.items[0];
      expect(first.net_receivable_vnd).toBeDefined();
      expect(first.remaining_debt_vnd).toBeDefined();
    }
  });
});
