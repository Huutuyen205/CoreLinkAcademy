import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M11/M01/M02/M09 GĐ3: Hoàn thiện GĐ2–GĐ3 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let adminToken: string;
  let adminUserId: string;

  let parentToken: string;
  let parentUserId: string;

  let studentId: string;
  let studentUserId: string;

  let invoiceId: string;
  let campaignId: string;
  let conversationId: string;
  let messageId: string;

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

    // 3. Admin User
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_step16@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Quản trị viên Step 16',
        email: 'admin_step16@corelink.edu.vn',
        phone: '+84988880161',
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

    // 4. Parent User
    const pUser = await prisma.users.upsert({
      where: { email: 'parent_step16@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phụ huynh Nguyễn Thu Thảo',
        email: 'parent_step16@corelink.edu.vn',
        phone: '+84988880162',
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

    // 5. Student User & Profile
    const sUser = await prisma.users.upsert({
      where: { email: 'student_step16@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Trần Bảo Nam',
        email: 'student_step16@corelink.edu.vn',
        phone: '+84988880163',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    studentUserId = sUser.id;

    const student = await prisma.students.upsert({
      where: { user_id: sUser.id },
      update: {},
      create: {
        user_id: sUser.id,
        branch_id: branchId,
        code: `HS-S16-${Date.now().toString().slice(-6)}`,
        school_name: 'THCS Lê Quý Đôn',
        school_class: '8A2',
        goal: 'IELTS 6.5',
      },
    });
    studentId = student.id;

    // 6. Test Invoice for Online Payment (TC-132)
    const inv = await prisma.invoices.create({
      data: {
        branch_id: branchId,
        student_id: student.id,
        description: 'Học phí Khóa Tiếng Anh Thiếu Niên K12 (Kỳ Thu 2026)',
        amount_vnd: 5000000,
        discount_vnd: 500000,
        paid_vnd: 0,
        due_date: new Date('2026-11-15'),
        status: 'unpaid',
        created_by: adminUser.id,
      },
    });
    invoiceId = inv.id;

    // 7. Seasonal Campaign with Coupon (FR-109)
    const code = `SUMMER26_${Date.now().toString().slice(-4)}`;
    const camp = await prisma.campaigns.create({
      data: {
        branch_id: branchId,
        name: 'Chiến Dịch Hè Rực Rỡ 2026',
        utm_campaign: 'summer_2026',
        channel: 'facebook',
        discount_code: code,
        discount_percent: 15,
        starts_on: new Date('2026-05-01'),
        ends_on: new Date('2026-12-31'),
        cost_vnd: 15000000,
      },
    });
    campaignId = camp.id;

    // 8. Test Conversation & Message for Search & Pin (FR-907)
    const conv = await prisma.conversations.create({
      data: {
        branch_id: branchId,
        kind: 'guardian_staff',
        student_id: student.id,
      },
    });
    conversationId = conv.id;

    await prisma.conversation_participants.createMany({
      data: [
        { conversation_id: conv.id, user_id: adminUser.id },
        { conversation_id: conv.id, user_id: pUser.id },
      ],
    });

    const msg = await prisma.messages.create({
      data: {
        conversation_id: conv.id,
        sender_id: adminUser.id,
        body: 'Thông báo lịch thi kiểm tra giữa kỳ vào ngày 25/10/2026. Phụ huynh vui lòng chuẩn bị cho con đúng giờ.',
      },
    });
    messageId = msg.id;

    // Login tokens
    const aLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_step16@corelink.edu.vn', password: 'Test@123456' });
    adminToken = aLogin.body.accessToken;

    const pLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'parent_step16@corelink.edu.vn', password: 'Test@123456' });
    parentToken = pLogin.body.accessToken;
  });

  afterAll(async () => {
    try {
      await prisma.receipts.deleteMany({
        where: { payment_id: { in: (await prisma.payments.findMany({ where: { invoice_id: invoiceId } })).map((p) => p.id) } },
      });
      await prisma.payments.deleteMany({ where: { invoice_id: invoiceId } });
      await prisma.invoices.deleteMany({ where: { id: invoiceId } });
      await prisma.messages.deleteMany({ where: { conversation_id: conversationId } });
      await prisma.conversation_participants.deleteMany({ where: { conversation_id: conversationId } });
      await prisma.conversations.deleteMany({ where: { id: conversationId } });
      await prisma.campaigns.deleteMany({ where: { id: campaignId } });
      await prisma.students.deleteMany({ where: { id: studentId } });
    } catch (e) {
      // Ignored
    }
    await app.close();
  });

  // =========================================================================
  // TC-132 (FR-1103): THANH TOÁN ONLINE TỰ ĐỐI SOÁT QUA WEBHOOK
  // =========================================================================
  describe('TC-132 (FR-1103): Thanh toán online tự đối soát', () => {
    it('Webhook có chữ ký số không hợp lệ -> Bị từ chối (401 Unauthorized)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/final-integration/payments/webhook')
        .send({
          invoiceId,
          gatewayTxnId: `TXN-FAKE-${Date.now()}`,
          amountVnd: 4500000,
          paidAt: new Date().toISOString(),
          signature: 'invalid_tampered_signature',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Chữ ký số Webhook không hợp lệ');
    });

    it('Quét mã QR và thanh toán đủ số tiền -> Trong vòng 5 phút khoản thu chuyển "Đã đóng" (paid) & có biên nhận', async () => {
      // TC-132: Phụ huynh quét mã QR, thanh toán đủ (4.500.000 VND = 5.000.000 - 500.000)
      const txnId = `TXN-OK-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/final-integration/payments/webhook')
        .send({
          invoiceId,
          gatewayTxnId: txnId,
          amountVnd: 4500000,
          paidAt: new Date().toISOString(),
          signature: 'test_valid_signature_tc132',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('paid'); // TC-132: Chuyển "Đã đóng"
      expect(res.body.isReconciled).toBe(true);
      expect(res.body.receiptNo).toMatch(/^BN-\d{4}-\d{6}$/);

      // Đối soát trực tiếp trong CSDL
      const invInDb = await prisma.invoices.findUnique({ where: { id: invoiceId } });
      expect(invInDb?.status).toBe('paid');
      expect(Number(invInDb?.paid_vnd)).toBe(4500000);
    });
  });

  // =========================================================================
  // FR-109: CHIẾN DỊCH THEO MÙA & MÃ ƯU ĐÃI
  // =========================================================================
  describe('FR-109: Chiến dịch theo mùa & mã ưu đãi', () => {
    it('Lấy thông tin chi tiết chiến dịch theo mã giảm giá và báo cáo hiệu quả', async () => {
      const campaign = await prisma.campaigns.findUnique({ where: { id: campaignId } });
      const res = await request(app.getHttpServer())
        .get(`/api/v1/final-integration/campaigns/${campaign!.discount_code}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Chiến Dịch Hè Rực Rỡ 2026');
      expect(res.body.discountPercent).toBe(15);
      expect(res.body.isValid).toBe(true);
      expect(res.body.stats).toBeDefined();
    });
  });

  // =========================================================================
  // FR-210: QUY TRÌNH NGỪNG HỌC & ẨN DANH HÓA
  // =========================================================================
  describe('FR-210: Ngừng học & lưu trữ ẩn danh', () => {
    it('Chuyển trạng thái học sinh sang ngừng học (stopped) & khóa tài khoản', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/final-integration/students/${studentId}/discontinue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Gia đình chuyển nơi sinh sống sang tỉnh khác' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.studentStatus).toBe('stopped');
      expect(res.body.userAccountStatus).toBe('locked');

      const sInDb = await prisma.students.findUnique({ where: { id: studentId } });
      expect(sInDb?.status).toBe('stopped');

      const uInDb = await prisma.users.findUnique({ where: { id: studentUserId } });
      expect(uInDb?.status).toBe('locked');
    });

    it('Admin thực hiện quyền xóa theo yêu cầu (GDPR) -> Ẩn danh hóa thông tin cá nhân', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/final-integration/students/${studentId}/anonymize`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.isAnonymized).toBe(true);

      const uInDb = await prisma.users.findUnique({ where: { id: studentUserId } });
      expect(uInDb?.full_name).toContain('Học viên ẩn danh');
      expect(uInDb?.email).toContain('@corelink.internal');
      expect(uInDb?.phone).toMatch(/^\+8400\d{8}$/);
    });
  });

  // =========================================================================
  // FR-907: TÌM KIẾM & GHIM TIN NHẮN TRONG HỘI THOẠI
  // =========================================================================
  describe('FR-907: Tìm kiếm & ghim tin nhắn', () => {
    it('Tìm kiếm tin nhắn theo từ khóa trong hội thoại', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/final-integration/conversations/${conversationId}/messages/search?q=lịch thi`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].body).toContain('lịch thi');
    });

    it('Ghim tin nhắn quan trọng trong hội thoại', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/final-integration/conversations/${conversationId}/messages/${messageId}/pin`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.pinnedMessageId).toBe(messageId);
      expect(res.body.pinnedBy).toBe(adminUserId);
    });
  });
});
