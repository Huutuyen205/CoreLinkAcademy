import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import * as argon2 from 'argon2';

describe('M01 Public & Admissions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(60000);

  let adminToken: string;
  let guardianToken: string;
  let branchId: string;
  let guardianId: string;
  let guardianUserId: string;
  let guardianRefCode: string;
  let testClassId: string;
  let testProgramId: string;
  let testFeePlanId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Lấy branch
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // 1. Tạo/lấy Admin
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_m01@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active', failed_login_count: 0, locked_until: null },
      create: {
        branch_id: branchId,
        full_name: 'Admin M01 Test',
        email: 'admin_m01@corelink.edu.vn',
        phone: '+84988880099',
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

    // Đăng nhập Admin lấy token
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_m01@corelink.edu.vn', password: 'Test@123456' });
    adminToken = adminLoginRes.body.accessToken;

    // 2. Tạo Phụ huynh có mã giới thiệu
    const guardianRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });
    const guardianPhone = `+8491${Math.floor(1000000 + Math.random() * 9000000)}`;
    const guardianUser = await prisma.users.create({
      data: {
        branch_id: branchId,
        full_name: 'Phụ Huynh Giới Thiệu',
        phone: guardianPhone,
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    guardianUserId = guardianUser.id;

    if (guardianRole) {
      await prisma.user_roles.create({
        data: { user_id: guardianUser.id, role_id: guardianRole.id },
      });
    }

    guardianRefCode = `REF-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    const guardianRecord = await prisma.guardians.create({
      data: {
        user_id: guardianUser.id,
        branch_id: branchId,
        referral_code: guardianRefCode,
      },
    });
    guardianId = guardianRecord.id;

    // Đăng nhập Guardian lấy token
    const guardianLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: guardianPhone, password: 'Test@123456' });
    guardianToken = guardianLoginRes.body.accessToken;

    // 3. Chuẩn bị Level, FeePlan, Program, Class cho kiểm thử chuyển đổi (TC-020)
    let level = await prisma.levels.findFirst();
    if (!level) {
      level = await prisma.levels.create({
        data: {
          code: 'LV-M01',
          name: 'Level Test M01',
          sort_order: 1,
        },
      });
    }

    let feePlan = await prisma.fee_plans.findFirst();
    if (!feePlan) {
      feePlan = await prisma.fee_plans.create({
        data: {
          branch_id: branchId,
          name: 'Gói Học Phí Chuẩn M01',
          billing_unit: 'course',
          amount_vnd: BigInt(5000000),
          sessions_included: 24,
        },
      });
    }
    testFeePlanId = feePlan.id;

    let program = await prisma.programs.findFirst();
    if (!program) {
      program = await prisma.programs.create({
        data: {
          branch_id: branchId,
          level_id: level.id,
          code: 'PROG-M01',
          name: 'Chương Trình Anh Ngữ M01',
          framework: 'CEFR',
          total_sessions: 24,
          default_fee_plan_id: feePlan.id,
        },
      });
    }
    testProgramId = program.id;

    let testClass = await prisma.classes.findFirst();
    if (!testClass) {
      testClass = await prisma.classes.create({
        data: {
          branch_id: branchId,
          program_id: program.id,
          code: `CLS-${Date.now()}`,
          name: 'Lớp Tiếng Anh Test M01',
          capacity: 15,
          status: 'planned',
          start_date: new Date(),
          end_date: new Date(Date.now() + 90 * 24 * 3600 * 1000),
          recurrence: [{ weekday: 2, start: '18:00', end: '19:30' }],
          created_by: adminUser.id,
        },
      });
    }
    testClassId = testClass.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Phần công khai (Public Endpoints)', () => {
    it('TC-001: Xem danh mục khóa học kèm học phí niêm yết (GET /api/v1/public/courses)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/courses')
        .expect(200);

      expect(res.body).toHaveProperty('courses');
      expect(Array.isArray(res.body.courses)).toBe(true);
      if (res.body.courses.length > 0) {
        expect(res.body.courses[0]).toHaveProperty('id');
        expect(res.body.courses[0]).toHaveProperty('name');
        expect(res.body.courses[0]).toHaveProperty('code');
      }
    });

    it('TC-002: Xem hồ sơ đội ngũ giáo viên đạt chuẩn chuyên môn (GET /api/v1/public/teachers)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/teachers')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('TC-003: Công khai thông tin pháp lý & quy chế theo TT 29/2024 (GET /api/v1/public/info)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/info')
        .expect(200);

      expect(res.body).toHaveProperty('centerName');
      expect(res.body).toHaveProperty('legalFramework');
      expect(res.body).toHaveProperty('levels');
      expect(res.body).toHaveProperty('feeRange');
    });

    it('TC-004: Kiểm tra tính hợp lệ của mã giới thiệu (GET /api/v1/public/referrals/:code)', async () => {
      // Mã hợp lệ
      const validRes = await request(app.getHttpServer())
        .get(`/api/v1/public/referrals/${guardianRefCode}`)
        .expect(200);

      expect(validRes.body.isValid).toBe(true);
      expect(validRes.body.referralCode).toBe(guardianRefCode);

      // Mã không tồn tại
      const invalidRes = await request(app.getHttpServer())
        .get('/api/v1/public/referrals/REF-KHONG-TON-TAI')
        .expect(404);

      expect(invalidRes.body.message).toContain('không tồn tại');
    });

    it('TC-005 & TC-006: Lấy đề kiểm tra năng lực đầu vào và nộp bài chấm điểm tự động', async () => {
      // Lấy đề
      const testRes = await request(app.getHttpServer())
        .get('/api/v1/public/placement-tests/sample-token')
        .expect(200);

      expect(testRes.body).toHaveProperty('questions');
      expect(Array.isArray(testRes.body.questions)).toBe(true);

      // Nộp bài
      const submitRes = await request(app.getHttpServer())
        .post('/api/v1/public/placement-tests/sample-token/submit')
        .send({
          answers: {
            'mock-q1': 'goes',
            'mock-q2': 'since',
            'mock-q3': 'will cancel',
          },
        })
        .expect(200);

      expect(submitRes.body).toHaveProperty('score');
      expect(submitRes.body).toHaveProperty('projectedLevel');
      expect(submitRes.body).toHaveProperty('totalQuestions');
    });
  });

  describe('Đăng ký & Quản lý khách tiềm năng (Leads & Admissions)', () => {
    let createdLeadId: string;
    const testLeadPhone = `098${Math.floor(1000000 + Math.random() * 9000000)}`;

    it('TC-015: Đăng ký học thử công khai kèm UTM và mã giới thiệu (POST /api/v1/public/leads)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/public/leads')
        .send({
          parentName: 'Phụ huynh Test TC015',
          phone: testLeadPhone,
          childName: 'Học sinh Test TC015',
          childGrade: 7,
          goal: 'Luyện thi Chuyên ngữ',
          freeSlots: ['Thứ 2 - 4 - 6 tối'],
          referralCode: guardianRefCode,
          utmSource: 'facebook_ads',
          utmCampaign: 'autumn_camp_2026',
          consentGiven: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.isExisting).toBe(false);
      createdLeadId = res.body.id;
    });

    it('TC-016: Đăng ký lại với cùng số điện thoại -> Merge thông tin không tạo bản ghi mới', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/public/leads')
        .send({
          parentName: 'Phụ huynh Test TC015 (Cập nhật)',
          phone: testLeadPhone,
          childName: 'Học sinh Test TC015',
          goal: 'Thêm mục tiêu ôn IELTS Foundation',
          utmSource: 'zalo_oa',
          consentGiven: true,
        })
        .expect(201);

      expect(res.body.id).toBe(createdLeadId);
      expect(res.body.isExisting).toBe(true);
    });

    it('TC-017: Cập nhật trạng thái khách tiềm năng & Ghi nhận hoạt động tương tác', async () => {
      // Đổi trạng thái sang contacted
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/v1/leads/${createdLeadId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'contacted' })
        .expect(200);

      expect(patchRes.body.status).toBe('contacted');
      expect(patchRes.body.first_contacted_at).not.toBeNull();

      // Thêm ghi chú cuộc gọi
      const actRes = await request(app.getHttpServer())
        .post(`/api/v1/leads/${createdLeadId}/activities`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'call',
          content: 'Đã gọi điện tư vấn, phụ huynh đồng ý cho con học thử vào tối thứ 4',
        })
        .expect(201);

      expect(actRes.body.content).toContain('Đã gọi điện tư vấn');
    });

    it('TC-018: Nhận diện khách tiềm năng quá 24h chưa liên hệ (isOverdue24h)', async () => {
      // Tạo một lead cố tình có created_at 2 ngày trước và status 'new'
      const oldPhone = `+8497${Math.floor(1000000 + Math.random() * 9000000)}`;
      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
      const oldLead = await prisma.leads.create({
        data: {
          branch_id: branchId,
          parent_name: 'Khách Quá Hạn 24h',
          phone: oldPhone,
          status: 'new',
          consent_given_at: new Date(),
          created_at: twoDaysAgo,
        },
      });

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const foundOld = listRes.body.find((l: any) => l.id === oldLead.id);
      expect(foundOld).toBeDefined();
      expect(foundOld.isOverdue24h).toBe(true);
    });

    it('TC-019: Chuyển sang "lost" bắt buộc phải có lý do (lostReason)', async () => {
      // Thử chuyển sang lost không kèm lý do -> Bị từ chối 400
      const failRes = await request(app.getHttpServer())
        .patch(`/api/v1/leads/${createdLeadId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'lost' })
        .expect(400);

      expect(failRes.body.message).toContain('bắt buộc phải chọn lý do');

      // Chuyển sang lost có lý do hợp lệ -> Thành công 200
      const successRes = await request(app.getHttpServer())
        .patch(`/api/v1/leads/${createdLeadId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'lost',
          lostReason: 'Học phí cao hơn ngân sách dự kiến của gia đình',
        })
        .expect(200);

      expect(successRes.body.status).toBe('lost');
      expect(successRes.body.lost_reason).toBe('Học phí cao hơn ngân sách dự kiến của gia đình');
    });

    it('TC-020: Chuyển đổi Lead thành Học viên chính thức trong 1 Transaction (FR-106)', async () => {
      // Tạo lead mới để chuyển đổi
      const convertPhone = `+8496${Math.floor(1000000 + Math.random() * 9000000)}`;
      const leadToConvert = await prisma.leads.create({
        data: {
          branch_id: branchId,
          parent_name: 'Mẹ Trần Hương',
          phone: convertPhone,
          child_name: 'Trần Gia Bảo',
          child_grade: 6,
          status: 'trial_done',
          consent_given_at: new Date(),
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/leads/${leadToConvert.id}/convert`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: testClassId,
          feePlanId: testFeePlanId,
          discountVnd: 500000,
          discountReason: 'Ưu đãi đăng ký sớm',
        })
        .expect(201);

      expect(res.body).toHaveProperty('studentId');
      expect(res.body).toHaveProperty('studentCode');
      expect(res.body).toHaveProperty('guardianId');
      expect(res.body).toHaveProperty('enrollmentId');
      expect(res.body).toHaveProperty('invoiceId');
      expect(res.body).toHaveProperty('tempPassword');

      // Kiểm tra DB lead đã chuyển thành enrolled
      const updatedLead = await prisma.leads.findUnique({ where: { id: leadToConvert.id } });
      expect(updatedLead?.status).toBe('enrolled');
      expect(updatedLead?.converted_student_id).toBe(res.body.studentId);
    });
  });

  describe('Chiến dịch Marketing & Báo cáo Phễu (Campaigns & Funnel)', () => {
    let campaignId: string;
    const testUtm = `fb_ads_${Date.now()}`;
    const testDiscount = `DISC${Math.floor(1000 + Math.random() * 9000)}`;

    it('TC-021: Tạo chiến dịch marketing và tính CAC thực tế (POST & GET /api/v1/campaigns)', async () => {
      // Tạo chiến dịch
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chiến Dịch Hè Rực Rỡ 2026',
          channel: 'facebook',
          costVnd: 10000000,
          utmCampaign: testUtm,
          discountCode: testDiscount,
          discountPercent: 15,
        })
        .expect(201);

      expect(createRes.body).toHaveProperty('id');
      expect(createRes.body.name).toBe('Chiến Dịch Hè Rực Rỡ 2026');
      campaignId = createRes.body.id;

      // Lấy danh sách kiểm tra CAC và ROI
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const createdCamp = listRes.body.find((c: any) => c.id === campaignId);
      expect(createdCamp).toBeDefined();
      expect(createdCamp.costVnd).toBe(10000000);
      expect(createdCamp).toHaveProperty('cacVnd');
      expect(createdCamp).toHaveProperty('conversionRate');
    });

    it('TC-022: Lấy dữ liệu báo cáo phễu chuyển đổi tuyển sinh (GET /api/v1/leads/funnel)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/leads/funnel')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('TC-023: Phụ huynh xem thống kê mã giới thiệu và phần thưởng tích lũy (GET /api/v1/campaigns/referral-stats)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/campaigns/referral-stats')
        .set('Authorization', `Bearer ${guardianToken}`)
        .expect(200);

      expect(res.body.referralCode).toBe(guardianRefCode);
      expect(res.body).toHaveProperty('totalReferred');
      expect(res.body).toHaveProperty('enrolledCount');
      expect(res.body).toHaveProperty('totalRewardVnd');
    });
  });
});
