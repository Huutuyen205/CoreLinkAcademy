import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M06, M07, M08, M09 GĐ2: AI Chấm bài & Báo cáo phụ huynh (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let teacherToken: string;
  let teacherUserId: string;
  let teacherId: string;
  let studentUserId: string;
  let studentId: string;
  let classId: string;

  let testAssignmentId: string;
  let testAttemptId: string;
  let testQuestionId: string;

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM monthly_reports WHERE report_month = "2026-10"');
      await prisma.$executeRawUnsafe('DELETE FROM answers WHERE attempt_id = ?', testAttemptId);
      await prisma.$executeRawUnsafe('DELETE FROM attempts WHERE student_id = ?', studentId);
      await prisma.$executeRawUnsafe('DELETE FROM assignment_questions WHERE assignment_id = ?', testAssignmentId);
      await prisma.$executeRawUnsafe('DELETE FROM assignments WHERE title LIKE "AI-GRADE-%"');
      await prisma.$executeRawUnsafe('DELETE FROM questions WHERE stem LIKE "AI-GRADE-%"');
      await prisma.$executeRawUnsafe('DELETE FROM enrollments WHERE class_id = ?', classId);
      await prisma.$executeRawUnsafe('DELETE FROM classes WHERE id = ?', classId);
    } catch (e) {
      // Ignored
    }
  };

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
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });

    // 3. Teacher user
    const tUser = await prisma.users.upsert({
      where: { email: 'teacher_step12@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Cô Mai Phương (Step 12)',
        email: 'teacher_step12@corelink.edu.vn',
        phone: '+84988880121',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacherUserId = tUser.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: tUser.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: tUser.id, role_id: teacherRole.id },
      });
    }
    const teacherProfile = await prisma.teachers.upsert({
      where: { user_id: tUser.id },
      update: {},
      create: {
        user_id: tUser.id,
        branch_id: branchId,
        bio_public: 'Giáo viên Step 12',
      },
    });
    teacherId = teacherProfile.id;

    // 4. Student user
    const sUser = await prisma.users.upsert({
      where: { email: 'student_step12@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phạm Minh Châu',
        email: 'student_step12@corelink.edu.vn',
        phone: '+84988880122',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    studentUserId = sUser.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: sUser.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: sUser.id, role_id: studentRole.id },
      });
    }
    const studentProfile = await prisma.students.upsert({
      where: { user_id: sUser.id },
      update: {},
      create: {
        user_id: sUser.id,
        branch_id: branchId,
        code: 'STD-S12-01',
      },
    });
    studentId = studentProfile.id;

    // 5. Program & Class for monthly reports batch
    const program = await prisma.programs.findFirst();
    const testClass = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        code: `CLS-S12-${Date.now().toString().slice(-6)}`,
        name: 'Lớp IELTS Foundation Step 12',
        start_date: new Date('2026-09-01'),
        end_date: new Date('2026-12-31'),
        recurrence: { days: [2, 4, 6], time: '18:00' },
        created_by: teacherUserId,
        status: 'running',
      },
    });
    classId = testClass.id;

    // Enroll student in class
    await prisma.enrollments.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        student_id: studentId,
        enrolled_on: new Date(),
        created_by: teacherUserId,
        status: 'active',
      },
    });

    // 6. Test Essay Question, Assignment & Attempt
    const q = await prisma.questions.create({
      data: {
        branch_id: branchId,
        type: 'essay',
        stem: 'AI-GRADE-Q01: Write a 150-word essay about environmental protection.',
        options: {},
        skill: 'writing',
        difficulty: 3,
        framework: 'CEFR',
        level_code: 'B1',
        created_by: teacherUserId,
        status: 'approved',
        approved_by: teacherUserId,
      },
    });
    testQuestionId = q.id;

    const asg = await prisma.assignments.create({
      data: {
        branch_id: branchId,
        title: 'AI-GRADE-ASG: Bài viết luận bảo vệ môi trường',
        kind: 'homework',
        time_limit_min: 60,
        attempts_allowed: 1,
        published_at: new Date(),
        created_by: teacherUserId,
      },
    });
    testAssignmentId = asg.id;

    const attempt = await prisma.attempts.create({
      data: {
        assignment_id: asg.id,
        student_id: studentId,
        attempt_no: 1,
        max_score: 10,
        tab_leaves: 0,
        submitted_at: new Date(),
      },
    });
    testAttemptId = attempt.id;

    // 7. Login Token
    const tLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_step12@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = tLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  // =========================================================================
  // TC-093 (FR-607): Ảnh bài viết mờ không đọc được -> Báo lỗi, không đưa điểm
  // =========================================================================
  describe('TC-093 (FR-607): Ảnh bài viết mờ không đọc được', () => {
    it('AI từ chối chấm và thông báo ảnh mờ, không gán điểm giả định', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-grading/writing')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          attempt_id: testAttemptId,
          question_id: testQuestionId,
          image_url: 'https://storage.corelink.edu.vn/uploads/blurry_essay_sample.jpg',
          is_blurry: true, // TC-093
        });

      expect(res.status).toBe(201);
      expect(res.body.is_unreadable).toBe(true);
      expect(res.body.error_code).toBe('IMAGE_BLURRY_UNREADABLE');
      expect(res.body.ai_points).toBeNull();
      expect(res.body.message).toContain('bị mờ');

      // Đảm bảo không có answer ghi điểm bừa bãi
      const ans = await prisma.answers.findUnique({
        where: {
          attempt_id_question_id: {
            attempt_id: testAttemptId,
            question_id: testQuestionId,
          },
        },
      });
      expect(ans).toBeNull();
    });
  });

  // =========================================================================
  // TC-092 (FR-607): AI chấm bài viết tay rõ nét theo rubric & GV xác nhận điểm
  // =========================================================================
  describe('TC-092 (FR-607): AI chấm bài viết tay & Giáo viên xác nhận điểm cuối', () => {
    let answerId: string;

    it('AI nhận dạng chữ, chấm theo rubric từng tiêu chí và trích dẫn câu cụ thể', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-grading/writing')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          attempt_id: testAttemptId,
          question_id: testQuestionId,
          is_blurry: false,
          text_content:
            'In recent years, protecting the environment has become an essential responsibility for everyone. To reduce plastic pollution, governments should encourage recycling programs and ban single-use plastic bags. Furthermore, schools must educate students about conserving energy.',
        });

      expect(res.status).toBe(201);
      expect(res.body.is_unreadable).toBe(false);
      expect(res.body.answer_id).toBeDefined();
      expect(res.body.ai_points).toBeGreaterThan(0);
      expect(res.body.transcript).toContain('protecting the environment');

      // Kiểm tra trích dẫn câu và tiêu chí
      const feedback = res.body.ai_feedback;
      expect(feedback.rubric_breakdown.length).toBe(4);
      expect(feedback.rubric_breakdown[0].quote).toBeDefined();
      expect(feedback.rubric_breakdown[0].criterion).toBe('Task Achievement');

      answerId = res.body.answer_id;
    });

    it('Giáo viên xem xét bản chữ, sửa điểm và xác nhận điểm cuối cùng (final_score)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/ai-grading/confirm/${answerId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          final_points: 8.5,
          teacher_feedback: 'Bài viết tốt, đã sửa điểm lên 8.5 sau khi xem xét lập luận.',
        });

      expect(res.status).toBe(201);
      expect(res.body.final_points).toBe(8.5);
      expect(res.body.deviation).toBeDefined();

      // Kiểm tra trong cơ sở dữ liệu
      const dbAnswer = await prisma.answers.findUnique({
        where: { id: answerId },
      });
      expect(Number(dbAnswer?.final_points)).toBe(8.5);
      expect(Number(dbAnswer?.ai_points)).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // TC-102 (FR-704): Nhận xét AI không suy diễn điều ngoài dữ liệu
  // =========================================================================
  describe('TC-102 (FR-704): Nhận xét AI thuần túy dựa trên sự kiện có thật', () => {
    it('Không nhắc đến thái độ nếu dữ liệu đầu vào không có thông tin thái độ', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-grading/evaluation-facts')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          student_id: studentId,
          attendance_rate: 95,
          test_average: 8.5,
          homework_completed_ratio: 1.0,
          // Không truyền attitude
        });

      expect(res.status).toBe(201);
      expect(res.body.generated_comment).toContain('95%');
      expect(res.body.generated_comment).toContain('8.5/10');
      expect(res.body.generated_comment).not.toContain('thái độ');
      expect(res.body.generated_comment).not.toContain('ý thức');
      expect(res.body.contains_attitude_speculation).toBe(false);
    });

    it('Chỉ đưa nhận xét về thái độ khi giáo viên cung cấp dữ kiện thái độ cụ thể', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-grading/evaluation-facts')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          student_id: studentId,
          attendance_rate: 95,
          test_average: 8.5,
          homework_completed_ratio: 1.0,
          attitude: 'Tích cực xung phong phát biểu và hỗ trợ bạn cùng bàn',
        });

      expect(res.status).toBe(201);
      expect(res.body.generated_comment).toContain('Tích cực xung phong phát biểu');
    });
  });

  // =========================================================================
  // TC-107 & TC-108 (FR-803): Báo cáo tháng cho phụ huynh & Nhắc nhở duyệt
  // =========================================================================
  describe('TC-107 & TC-108 (FR-803): Soạn nháp hàng loạt, duyệt cả lớp & nhắc nhở ngày 3', () => {
    let generatedReportId: string;

    it('TC-107: Job tự động tạo bản nháp báo cáo tháng cho toàn bộ học sinh trong lớp', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-grading/monthly-reports/generate-batch')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          month: '2026-10',
        });

      expect(res.status).toBe(201);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.reports[0].status).toBe('drafted');
      expect(res.body.reports[0].ai_draft).toContain('Báo cáo tháng 2026-10');

      generatedReportId = res.body.reports[0].id;
    });

    it('TC-108: Tác vụ kiểm tra phát hiện báo cáo tháng chưa duyệt và gửi nhắc nhở (đến ngày 3)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ai-grading/monthly-reports/reminder-check?month=2026-10')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pending_count).toBeGreaterThan(0);
      expect(res.body.reminder_sent).toBe(true);
      expect(res.body.message).toContain('chưa được duyệt');
    });

    it('TC-107: Giáo viên chỉnh sửa nội dung và duyệt hàng loạt cả lớp trên 1 màn hình', async () => {
      const editedText =
        'Bản báo cáo tháng 10 đã được cô giáo hiệu chỉnh: Em Phạm Minh Châu học rất tốt, ngữ pháp vững vàng.';

      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-grading/monthly-reports/approve-batch')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          class_id: classId,
          month: '2026-10',
          reports: [
            {
              id: generatedReportId,
              final_text: editedText,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.approved_count).toBe(1);

      // Kiểm tra DB: Trạng thái chuyển thành sent, lưu người duyệt
      const rep = await prisma.monthly_reports.findUnique({
        where: { id: generatedReportId },
      });
      expect(rep?.status).toBe('sent');
      expect(rep?.approved_by).toBe(teacherUserId);
      expect(rep?.final_text).toBe(editedText);
    });
  });

  // =========================================================================
  // TC-120 (FR-906): Gợi ý trả lời tin nhắn phụ huynh từ AI không bao giờ tự gửi
  // =========================================================================
  describe('TC-120 (FR-906): Gợi ý trả lời tin nhắn từ AI', () => {
    it('Chỉ tạo bản nháp gợi ý trong ô soạn thảo, tuyệt đối không tự động gửi tin nhắn', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai-grading/suggest-reply')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          conversation_id: 'conv-test-120',
          incoming_message: 'Thầy cho em hỏi lịch đóng học phí tháng 11 của bé Châu với ạ?',
          student_name: 'Minh Châu',
        });

      expect(res.status).toBe(201);
      expect(res.body.suggestion).toBeDefined();
      expect(res.body.suggestion).toContain('học phí');
      expect(res.body.automatically_sent).toBe(false); // TC-120 safeguard

      // Đảm bảo không có tin nhắn nào bị tự động lưu/gửi vào bảng messages
      const msgCount = await prisma.messages.count({
        where: { body: res.body.suggestion },
      });
      expect(msgCount).toBe(0);
    });
  });

  // =========================================================================
  // Thống kê độ lệch điểm AI vs Giáo viên
  // =========================================================================
  describe('Thống kê độ lệch điểm AI vs Giáo viên', () => {
    it('Thống kê được độ lệch trung bình và tỷ lệ đồng thuận giữa AI và Giáo viên', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ai-grading/deviation')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total_graded).toBeGreaterThan(0);
      expect(res.body.average_deviation).toBeDefined();
      expect(res.body.agreement_rate).toBeDefined();
    });
  });
});
