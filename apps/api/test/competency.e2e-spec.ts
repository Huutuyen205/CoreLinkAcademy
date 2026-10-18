import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M06/M07 Giai đoạn 2: Đánh giá năng lực & Ôn luyện thông minh (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let teacherToken: string;
  let teacherUserId: string;
  let teacherId: string;
  let studentToken: string;
  let studentUserId: string;
  let studentId: string;
  let classId: string;

  let testAssignmentId: string;
  let testAttemptId: string;
  let testQuestionId: string;

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM competency_scores WHERE student_id = ?', studentId);
      await prisma.$executeRawUnsafe('DELETE FROM answers WHERE attempt_id = ?', testAttemptId);
      await prisma.$executeRawUnsafe('DELETE FROM attempts WHERE student_id = ?', studentId);
      await prisma.$executeRawUnsafe('DELETE FROM assignment_questions WHERE assignment_id = ?', testAssignmentId);
      await prisma.$executeRawUnsafe('DELETE FROM assignment_targets WHERE assignment_id = ?', testAssignmentId);
      await prisma.$executeRawUnsafe('DELETE FROM assignments WHERE title LIKE "COMP-ASG-%"');
      await prisma.$executeRawUnsafe('DELETE FROM questions WHERE stem LIKE "%[AI Generated]%" OR stem LIKE "COMP-Q-%"');
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

    // 3. Teacher user & profile
    const tUser = await prisma.users.upsert({
      where: { email: 'teacher_step11@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Step 11',
        email: 'teacher_step11@corelink.edu.vn',
        phone: '+84988880111',
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
        bio_public: 'Giáo viên Step 11',
      },
    });
    teacherId = teacherProfile.id;

    // 4. Student user & profile
    const sUser = await prisma.users.upsert({
      where: { email: 'student_step11@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học Sinh Step 11',
        email: 'student_step11@corelink.edu.vn',
        phone: '+84988880112',
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
        code: 'STD-S11-01',
      },
    });
    studentId = studentProfile.id;

    // 5. Program & Class for tests
    const program = await prisma.programs.findFirst();
    const testClass = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        code: `CLS-S11-${Date.now().toString().slice(-6)}`,
        name: 'Lớp Luyện Thi Năng Lực S11',
        start_date: new Date('2026-09-01'),
        end_date: new Date('2026-12-31'),
        recurrence: { days: [1, 3, 5], time: '18:00' },
        created_by: teacherUserId,
        status: 'running',
      },
    });
    classId = testClass.id;

    // 6. Test Question & Assignment & Attempt for subsequent TCs
    const q = await prisma.questions.create({
      data: {
        branch_id: branchId,
        type: 'speaking',
        stem: 'COMP-Q-01: Tell me about your favorite travel destination.',
        options: {},
        skill: 'speaking',
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
        title: 'COMP-ASG-01: Kiểm tra năng lực Speaking & Reading',
        kind: 'test',
        time_limit_min: 45,
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
        final_score: 8.5,
        tab_leaves: 0,
        submitted_at: new Date(),
      },
    });
    testAttemptId = attempt.id;

    // 7. Login tokens
    const tLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_step11@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = tLogin.body.accessToken;

    const sLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student_step11@corelink.edu.vn', password: 'Test@123456' });
    studentToken = sLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    if (classId) {
      await prisma.classes.delete({ where: { id: classId } }).catch(() => {});
    }
    await app.close();
  });

  // =========================================================================
  // TC-091 (FR-604): AI tạo đề/câu hỏi có đáp án & giải thích, phải duyệt trước khi giao
  // =========================================================================
  describe('TC-091 (FR-604): AI tạo đề và phê duyệt câu hỏi', () => {
    let generatedQuestionId: string;

    it('AI sinh câu hỏi tự động với đáp án, giải thích và trạng thái draft', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/ai-questions/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          topic: 'Present Perfect Tense',
          skill: 'grammar',
          framework: 'CEFR',
          difficulty: 3,
          level_code: 'B1',
          count: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.questions).toHaveLength(2);

      const q = res.body.questions[0];
      generatedQuestionId = q.id;
      expect(q.status).toBe('draft');
      expect(q.stem).toContain('[AI Generated]');
      expect(q.options).toBeDefined();
      expect(q.answer_key).toEqual({ correct: 'B' });
      expect(q.explanation).toBeDefined();
    });

    it('Giáo viên duyệt câu hỏi AI vào ngân hàng câu hỏi chính thức', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/competency/ai-questions/${generatedQuestionId}/approve`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send();

      expect(res.status).toBe(201);
      expect(res.body.question.status).toBe('approved');
      expect(res.body.question.approved_by).toBe(teacherUserId);

      // Kiểm tra lại trong DB
      const inDb = await prisma.questions.findUnique({
        where: { id: generatedQuestionId },
      });
      expect(inDb?.status).toBe('approved');
    });
  });

  // =========================================================================
  // TC-094 (FR-602): Ghi âm câu hỏi nói, giới hạn tối đa 3 phút (180 giây)
  // =========================================================================
  describe('TC-094 (FR-602): Ghi âm bài nói giới hạn 3 phút', () => {
    it('Lưu bài nói đúng thời lượng khi <= 180s', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/speaking-answers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          attempt_id: testAttemptId,
          question_id: testQuestionId,
          audio_duration_seconds: 120,
          audio_url: 'https://storage.corelink.edu.vn/audio/speaking-sample-120s.webm',
          transcript: 'I really love visiting Da Nang city because of the beach and mountains.',
        });

      expect(res.status).toBe(201);
      expect(res.body.duration_recorded).toBe(120);
      expect((res.body.response as any).capped_at_max).toBe(false);
    });

    it('Tự động chốt và lưu tối đa 180 giây khi thời lượng ghi âm vượt quá 3 phút (240s)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/speaking-answers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          attempt_id: testAttemptId,
          question_id: testQuestionId,
          audio_duration_seconds: 240,
          audio_url: 'https://storage.corelink.edu.vn/audio/speaking-sample-240s.webm',
          transcript: 'This is a very long speaking response exceeding three minutes limit.',
        });

      expect(res.status).toBe(201);
      expect(res.body.duration_recorded).toBe(180);
      expect((res.body.response as any).capped_at_max).toBe(true);
      expect(res.body.message).toContain('3 phút (180 giây)');
    });
  });

  // =========================================================================
  // TC-095 (FR-610): Gợi ý bài ôn luyện theo kỹ năng yếu từ câu hỏi ĐÃ DUYỆT
  // =========================================================================
  describe('TC-095 (FR-610): Gợi ý ôn luyện kỹ năng yếu từ câu đã duyệt', () => {
    beforeAll(async () => {
      // Tạo 1 câu reading draft và 1 câu reading approved
      await prisma.questions.create({
        data: {
          branch_id: branchId,
          type: 'single_choice',
          stem: 'COMP-Q-DRAFT: Draft reading question not approved',
          skill: 'reading',
          difficulty: 2,
          framework: 'CEFR',
          level_code: 'A2',
          created_by: teacherUserId,
          status: 'draft',
        },
      });

      await prisma.questions.create({
        data: {
          branch_id: branchId,
          type: 'single_choice',
          stem: 'COMP-Q-APPROVED: Approved reading question for practice',
          skill: 'reading',
          difficulty: 2,
          framework: 'CEFR',
          level_code: 'A2',
          created_by: teacherUserId,
          status: 'approved',
          approved_by: teacherUserId,
        },
      });
    });

    it('Chỉ gợi ý các câu hỏi có trạng thái approved, không lấy câu draft', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/competency/weak-skills/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.identified_weak_skill).toBe('reading');
      expect(res.body.recommended_questions.length).toBeGreaterThan(0);

      // Tất cả câu hỏi gợi ý phải là approved
      for (const q of res.body.recommended_questions) {
        expect(q.status).toBe('approved');
        expect(q.stem).not.toContain('COMP-Q-DRAFT');
      }
    });
  });

  // =========================================================================
  // TC-096 (FR-611): Gia sư AI không đưa đáp án bài đang làm, từ chối ngoài tiếng Anh
  // =========================================================================
  describe('TC-096 (FR-611): Gia sư AI thông minh kiểm soát nội dung', () => {
    it('Từ chối đưa đáp án trực tiếp khi bài thi đang làm dở, cung cấp hướng dẫn từng bước', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/tutor/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          attempt_id: testAttemptId,
          message: 'Cho mình xin đáp án câu 3 bài kiểm tra này với!',
        });

      expect(res.status).toBe(201);
      expect(res.body.is_refusal).toBe(true);
      expect(res.body.reason).toBe('withhold_exam_answer');
      expect(res.body.reply).toContain('không thể cung cấp đáp án trực tiếp');
      expect(res.body.guidance).toBeDefined();
    });

    it('Từ chối giải đáp chủ đề ngoài tiếng Anh (Toán học, Bitcoin, Chính trị)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/tutor/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'Giải giúp mình bài toán tích phân và định luật vật lý Newton với',
        });

      expect(res.status).toBe(201);
      expect(res.body.is_refusal).toBe(true);
      expect(res.body.reason).toBe('off_topic');
      expect(res.body.reply).toContain('chỉ hỗ trợ giải đáp các thắc mắc về môn Tiếng Anh');
    });

    it('Phản hồi hướng dẫn học tập tiếng Anh thông thường', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/tutor/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'Khi nào dùng Present Simple và Present Continuous vậy bạn?',
        });

      expect(res.status).toBe(201);
      expect(res.body.is_refusal).toBe(false);
      expect(res.body.reply).toBeDefined();
    });
  });

  // =========================================================================
  // TC-097 (FR-612): Chống gian lận - Ghi nhận số lần rời tab khi thi
  // =========================================================================
  describe('TC-097 (FR-612): Đếm số lần rời tab (tab leave)', () => {
    it('Tăng dần số lần rời tab khi học sinh chuyển cửa sổ trình duyệt', async () => {
      // Lần rời tab 1
      const res1 = await request(app.getHttpServer())
        .post(`/api/v1/competency/attempts/${testAttemptId}/tab-leave`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res1.status).toBe(201);
      expect(res1.body.tab_leaves).toBe(1);

      // Lần rời tab 2
      const res2 = await request(app.getHttpServer())
        .post(`/api/v1/competency/attempts/${testAttemptId}/tab-leave`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res2.status).toBe(201);
      expect(res2.body.tab_leaves).toBe(2);

      // Lần rời tab 3
      const res3 = await request(app.getHttpServer())
        .post(`/api/v1/competency/attempts/${testAttemptId}/tab-leave`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res3.status).toBe(201);
      expect(res3.body.tab_leaves).toBe(3);

      // Kiểm tra trong DB
      const attemptInDb = await prisma.attempts.findUnique({
        where: { id: testAttemptId },
      });
      expect(attemptInDb?.tab_leaves).toBe(3);
    });
  });

  // =========================================================================
  // TC-101 (FR-702): Điểm năng lực competency_scores truy xuất được bài test nguồn
  // =========================================================================
  describe('TC-101 (FR-702): Điểm năng lực & Biểu đồ radar truy xuất test nguồn', () => {
    it('Lưu điểm năng lực gắn với bài test nguồn (source_attempt_id)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/scores')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          student_id: studentId,
          skill: 'speaking',
          framework: 'CEFR',
          score: 85.5,
          level_code: 'B1',
          source_attempt_id: testAttemptId,
        });

      expect(res.status).toBe(201);
      expect(res.body.student_id).toBe(studentId);
      expect(res.body.skill).toBe('speaking');
      expect(res.body.source_attempt_id).toBe(testAttemptId);
    });

    it('Truy xuất biểu đồ radar năng lực kèm thông tin bài test nguồn gốc', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/competency/radar/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.student_id).toBe(studentId);
      expect(res.body.radar_skills.length).toBeGreaterThan(0);

      const speakingSkill = res.body.radar_skills.find((s: any) => s.skill === 'speaking');
      expect(speakingSkill).toBeDefined();
      expect(speakingSkill.score).toBe(85.5);
      expect(speakingSkill.source_attempt).toBeDefined();
      expect(speakingSkill.source_attempt.attempt_id).toBe(testAttemptId);
      expect(speakingSkill.source_attempt.assignment_title).toContain('COMP-ASG-01');
    });
  });

  // =========================================================================
  // FR-613: Cá nhân hóa độ khó đề ôn luyện thông minh
  // =========================================================================
  describe('FR-613: Cá nhân hóa độ khó thích ứng (Adaptive Difficulty)', () => {
    it('Tự động tăng độ khó khi học sinh làm đúng >= 80% ở bài thi trước (8.5/10 = 85%)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/competency/adaptive-difficulty/${studentId}?current_tier=2`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.increased).toBe(true);
      expect(res.body.next_tier).toBe(3); // Tăng từ tier 2 lên tier 3
      expect(res.body.score_ratio).toBeGreaterThanOrEqual(80);
      expect(res.body.message).toContain('Tự động tăng độ khó');
    });

    it('Duy trì độ khó khi học sinh làm đúng < 80%', async () => {
      // Cập nhật attempt trước đó thành 6/10 (60% < 80%)
      await prisma.attempts.update({
        where: { id: testAttemptId },
        data: { final_score: 6.0 },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/competency/adaptive-difficulty/${studentId}?current_tier=2`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.body.increased).toBe(false);
      expect(res.body.next_tier).toBe(2); // Giữ nguyên tier 2
      expect(res.body.score_ratio).toBe(60);
      expect(res.body.message).toContain('Duy trì độ khó');
    });
  });

  // =========================================================================
  // AI Speaking Coach & Spaced Repetition Flashcards E2E
  // =========================================================================
  describe('AI Speaking Coach & Spaced Repetition Flashcards', () => {
    it('Phân tích bài nói của học sinh, trả về Band score, lỗi IPA và gợi ý bản ngữ', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/speaking-coach/analyze')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topic: 'Study Habits',
          transcript: 'I very like to study in the morning because the environment is comfortable.',
          duration_seconds: 35,
        });

      expect(res.status).toBe(201);
      expect(res.body.overallBand).toBeDefined();
      expect(res.body.scores.fluency).toBeDefined();
      expect(res.body.scores.pronunciation).toBeDefined();
      expect(res.body.ipaCorrections.length).toBeGreaterThan(0);
      expect(res.body.grammarImprovements.length).toBeGreaterThan(0);
      expect(res.body.nativePhrasing.length).toBeGreaterThan(0);
    });

    it('Lấy danh sách thẻ từ vựng ôn tập Spaced Repetition', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/competency/vocabulary/flashcards')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].word).toBeDefined();
      expect(res.body[0].phonetic).toBeDefined();
      expect(res.body[0].viMeaning).toBeDefined();
      expect(res.body[0].easeFactor).toBeDefined();
    });

    it('Gửi đánh giá mức độ nhớ theo thuật toán SM-2, tính toán chu kỳ ôn tập tiếp theo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/competency/vocabulary/review')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          cardId: 'fc-01',
          quality: 4, // Nhớ tốt (Good)
        });

      expect(res.status).toBe(201);
      expect(res.body.cardId).toBe('fc-01');
      expect(res.body.quality).toBe(4);
      expect(res.body.nextIntervalDays).toBeGreaterThanOrEqual(1);
      expect(res.body.nextReviewDate).toBeDefined();
      expect(res.body.message).toContain('Ghi nhớ tốt');
    });
  });
});
