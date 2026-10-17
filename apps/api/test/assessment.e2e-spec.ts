import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M06 Bài tập, thi, ôn luyện (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let teacherToken: string;
  let teacherUserId: string;
  let student1Token: string;
  let student1UserId: string;
  let student1Id: string;
  let student2Token: string;
  let student2UserId: string;
  let student2Id: string;
  let parentToken: string;
  let parentUserId: string;
  let guardianId: string;
  let classId: string;

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM regrade_requests');
      await prisma.$executeRawUnsafe('DELETE FROM answers');
      await prisma.$executeRawUnsafe('DELETE FROM attempts');
      await prisma.$executeRawUnsafe('DELETE FROM assignment_targets');
      await prisma.$executeRawUnsafe('DELETE FROM assignment_questions');
      await prisma.$executeRawUnsafe('DELETE FROM assignments WHERE title LIKE "COM-ASG-%"');
      await prisma.$executeRawUnsafe('DELETE FROM questions WHERE stem LIKE "COM-Q-%"');
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

    await cleanupData();

    // Branch
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // Roles
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });
    const guardianRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });

    // 1. Teacher
    const tUser = await prisma.users.upsert({
      where: { email: 'teacher_step8@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Hoàng Nam',
        email: 'teacher_step8@corelink.edu.vn',
        phone: '+84988880081',
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

    // 2. Student 1
    const s1User = await prisma.users.upsert({
      where: { email: 'student1_step8@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Nguyễn Văn An',
        email: 'student1_step8@corelink.edu.vn',
        phone: '+84988880082',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    student1UserId = s1User.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: s1User.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: s1User.id, role_id: studentRole.id },
      });
    }
    const st1 = await prisma.students.upsert({
      where: { user_id: s1User.id },
      update: {},
      create: {
        user_id: s1User.id,
        branch_id: branchId,
        code: 'STD-S8-01',
      },
    });
    student1Id = st1.id;

    // 3. Student 2
    const s2User = await prisma.users.upsert({
      where: { email: 'student2_step8@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Trần Thị Bình',
        email: 'student2_step8@corelink.edu.vn',
        phone: '+84988880083',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    student2UserId = s2User.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: s2User.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: s2User.id, role_id: studentRole.id },
      });
    }
    const st2 = await prisma.students.upsert({
      where: { user_id: s2User.id },
      update: {},
      create: {
        user_id: s2User.id,
        branch_id: branchId,
        code: 'STD-S8-02',
      },
    });
    student2Id = st2.id;

    // 4. Guardian (Phụ huynh của Student 1)
    const pUser = await prisma.users.upsert({
      where: { email: 'parent_step8@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Nguyễn Văn Ba (Phụ huynh)',
        email: 'parent_step8@corelink.edu.vn',
        phone: '+84988880084',
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
    const gd = await prisma.guardians.upsert({
      where: { user_id: pUser.id },
      update: {},
      create: {
        user_id: pUser.id,
        branch_id: branchId,
      },
    });
    guardianId = gd.id;

    await prisma.guardianships.upsert({
      where: {
        student_id_guardian_id: {
          student_id: student1Id,
          guardian_id: guardianId,
        },
      },
      update: {},
      create: {
        student_id: student1Id,
        guardian_id: guardianId,
        relation: 'father',
      },
    });

    // 5. Login Tokens
    const tLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_step8@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = tLogin.body.accessToken;

    const s1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student1_step8@corelink.edu.vn', password: 'Test@123456' });
    student1Token = s1Login.body.accessToken;

    const s2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student2_step8@corelink.edu.vn', password: 'Test@123456' });
    student2Token = s2Login.body.accessToken;

    const pLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'parent_step8@corelink.edu.vn', password: 'Test@123456' });
    parentToken = pLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  // =========================================================================
  // 1. NGÂN HÀNG CÂU HỎI (FR-601, FR-602, TC-076..TC-078)
  // =========================================================================

  describe('Ngân hàng câu hỏi (FR-601, FR-602, TC-076..TC-078)', () => {
    let questionToFilterId: string;
    let questionInUseId: string;
    let assignmentId: string;

    it('TC-076: Lọc ngân hàng câu hỏi theo 3 nhãn (Nghe + A2 + khó = difficulty 4)', async () => {
      // 1. Tạo câu hỏi khớp cả 3 nhãn
      const matchRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'listening',
          stem: 'COM-Q-076: Nghe đoạn hội thoại và chọn câu trả lời đúng.',
          skill: 'listening',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 4,
          answerKey: { correct: 'B' },
        })
        .expect(201);
      questionToFilterId = matchRes.body.id;

      // 2. Tạo câu hỏi khác nhãn (Reading, B1, difficulty 2)
      await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'single_choice',
          stem: 'COM-Q-076-DIFF: Đọc bài văn sau...',
          skill: 'reading',
          framework: 'CEFR',
          levelCode: 'B1',
          difficulty: 2,
          answerKey: { correct: 'A' },
        })
        .expect(201);

      // 3. Lọc theo cả 3 nhãn: skill=listening, levelCode=A2, difficulty=4
      const filterRes = await request(app.getHttpServer())
        .get('/api/v1/assessment/questions?skill=listening&levelCode=A2&difficulty=4')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(filterRes.body.items.length).toBeGreaterThan(0);
      const allMatched = filterRes.body.items.every(
        (q: any) => q.skill === 'listening' && q.level_code === 'A2' && q.difficulty === 4,
      );
      expect(allMatched).toBe(true);
    });

    it('TC-077: Không xóa câu đang dùng trong bài chưa chấm -> Bị chặn, trả về 400 Bad Request', async () => {
      // 1. Tạo câu hỏi
      const qRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'single_choice',
          stem: 'COM-Q-077: Which sentence is correct in present simple?',
          skill: 'grammar',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 2,
          answerKey: { correct: 'A' },
        })
        .expect(201);
      questionInUseId = qRes.body.id;

      // 2. Tạo bài tập sử dụng câu hỏi này
      const asgRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-077: Bài tập đang dùng câu hỏi',
          kind: 'homework',
          questionIds: [questionInUseId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);
      assignmentId = asgRes.body.id;

      // 3. Cố gắng xóa câu hỏi này -> Phải bị chặn 400 Bad Request
      const delRes = await request(app.getHttpServer())
        .delete(`/api/v1/assessment/questions/${questionInUseId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(delRes.status).toBe(400);
      expect(delRes.body.message).toContain('Không thể xóa câu hỏi đang được sử dụng trong bài tập/đề thi');
      expect(delRes.body.message).toContain('COM-ASG-077');
    });

    it('TC-078: Đủ 9 dạng câu hỏi GĐ1 (tạo thành công cả 9 dạng)', async () => {
      const types = [
        { type: 'single_choice', stem: 'COM-Q-078-1: Trắc nghiệm 1 đáp án' },
        { type: 'multi_choice', stem: 'COM-Q-078-2: Trắc nghiệm nhiều đáp án' },
        { type: 'true_false', stem: 'COM-Q-078-3: Đúng hay sai' },
        { type: 'fill_blank', stem: 'COM-Q-078-4: Điền từ vào chỗ trống' },
        { type: 'matching', stem: 'COM-Q-078-5: Nối cặp tương ứng' },
        { type: 'ordering', stem: 'COM-Q-078-6: Sắp xếp thứ tự các từ' },
        { type: 'listening', stem: 'COM-Q-078-7: Nghe và trả lời' },
        { type: 'essay', stem: 'COM-Q-078-8: Viết đoạn văn ngắn 100 từ' },
        { type: 'file_upload', stem: 'COM-Q-078-9: Chụp ảnh bài viết tay tải lên' },
      ];

      for (const t of types) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/assessment/questions')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            type: t.type,
            stem: t.stem,
            skill: 'reading',
            framework: 'CEFR',
            levelCode: 'B1',
            difficulty: 3,
            answerKey: { correct: 'Sample' },
          })
          .expect(201);

        expect(res.body.id).toBeDefined();
        expect(res.body.type).toBe(t.type);
      }
    });
  });

  // =========================================================================
  // 2. GIAO BÀI & NHẮC HẠN (FR-603, TC-079, TC-080)
  // =========================================================================

  describe('Giao bài & Nhắc hạn (FR-603, TC-079, TC-080)', () => {
    let personalAssignmentId: string;
    let sampleQuestionId: string;

    beforeAll(async () => {
      const qRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'single_choice',
          stem: 'COM-Q-TARGET: Sample question for targeting',
          skill: 'reading',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 2,
          answerKey: { correct: 'A' },
        })
        .expect(201);
      sampleQuestionId = qRes.body.id;
    });

    it('TC-079: Giao bài cho cá nhân -> Chỉ học sinh đó nhận và thấy bài', async () => {
      // 1. Giáo viên giao bài CHỈ CHO Student 1
      const asgRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-079: Bài tập cá nhân cho Student 1',
          kind: 'homework',
          questionIds: [sampleQuestionId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);
      personalAssignmentId = asgRes.body.id;

      // 2. Student 1 gọi API lấy danh sách bài tập -> Phải thấy bài
      const s1Res = await request(app.getHttpServer())
        .get('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(200);

      const s1Found = s1Res.body.some((a: any) => a.id === personalAssignmentId);
      expect(s1Found).toBe(true);

      // 3. Student 2 gọi API lấy danh sách bài tập -> KHÔNG ĐƯỢC THẤY bài
      const s2Res = await request(app.getHttpServer())
        .get('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(200);

      const s2Found = s2Res.body.some((a: any) => a.id === personalAssignmentId);
      expect(s2Found).toBe(false);
    });

    it('TC-080: Nhắc 24 giờ trước hạn -> Học sinh chưa nộp nhận nhắc, học sinh đã nộp không nhận', async () => {
      // 1. Tạo bài tập có hạn nộp trong 12 giờ tới (thuộc khung 24h)
      const dueSoon = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const asgRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-080: Bài tập sắp hết hạn trong 12h',
          kind: 'homework',
          dueAt: dueSoon,
          questionIds: [sampleQuestionId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);

      // 2. Kích hoạt tác vụ nhắc 24h
      const jobRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/jobs/due-reminders')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      expect(jobRes.body.success).toBe(true);
      expect(jobRes.body.remindersSent).toBeGreaterThanOrEqual(1);

      // 3. Giả lập Student 1 nộp bài xong, chạy lại job -> remindersSent phải giảm (không gửi lại)
      const attRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${asgRes.body.id}/attempts`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${attRes.body.id}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);

      const job2Res = await request(app.getHttpServer())
        .post('/api/v1/assessment/jobs/due-reminders')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      // Student 1 đã nộp bài nên không còn trong danh sách gửi nhắc
      expect(job2Res.body.remindersSent).toBe(0);
    });
  });

  // =========================================================================
  // 3. LÀM BÀI, LƯU NHÁP & CHẤM TRẮC NGHIỆM (FR-605, FR-606, TC-081..TC-084)
  // =========================================================================

  describe('Làm bài, Lưu nháp & Chấm trắc nghiệm (FR-605, FR-606, TC-081..TC-084)', () => {
    let examAssignmentId: string;
    let q1Id: string;
    let q2Id: string;
    let q3EssayId: string;

    beforeAll(async () => {
      // Q1: single choice (Đáp án: B)
      const q1 = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'single_choice',
          stem: 'COM-Q-EXAM-1: What is the capital of England?',
          skill: 'grammar',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 1,
          points: 2,
          answerKey: { correct: 'B' },
          explanation: 'London is the capital of England.',
        })
        .expect(201);
      q1Id = q1.body.id;

      // Q2: true_false (Đáp án: true)
      const q2 = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'true_false',
          stem: 'COM-Q-EXAM-2: The earth revolves around the sun.',
          skill: 'reading',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 1,
          points: 3,
          answerKey: { correct: true },
          explanation: 'Scientific fact.',
        })
        .expect(201);
      q2Id = q2.body.id;

      // Q3: essay (Tự luận)
      const q3 = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'essay',
          stem: 'COM-Q-EXAM-3: Write a paragraph about your summer holiday.',
          skill: 'writing',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 3,
          points: 5,
        })
        .expect(201);
      q3EssayId = q3.body.id;

      // Tạo bài thi gồm cả 3 câu hỏi
      const asg = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-EXAM: Bài thi giữa kỳ tiếng Anh',
          kind: 'test',
          timeLimitMin: 45,
          attemptsAllowed: 5,
          questionIds: [q1Id, q2Id, q3EssayId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);
      examAssignmentId = asg.body.id;
    });

    it('TC-081: Mất mạng không mất bài -> Lưu nháp câu trả lời nhiều lần thành công (upsert)', async () => {
      // 1. Học sinh bắt đầu làm bài
      const attRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${examAssignmentId}/attempts`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);
      const attemptId = attRes.body.id;

      // 2. Lưu nháp lần 1 (trả lời Q1)
      const draft1 = await request(app.getHttpServer())
        .put(`/api/v1/assessment/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [{ questionId: q1Id, response: { selected: 'B' } }],
        })
        .expect(200);
      expect(draft1.body.savedCount).toBe(1);

      // 3. Giả lập làm tiếp khi online lại: Lưu nháp cả Q1 (sửa lại) và Q2
      const draft2 = await request(app.getHttpServer())
        .put(`/api/v1/assessment/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [
            { questionId: q1Id, response: { selected: 'B' } },
            { questionId: q2Id, response: { selected: true } },
            { questionId: q3EssayId, response: { text: 'My holiday was fantastic.' } },
          ],
        })
        .expect(200);
      expect(draft2.body.savedCount).toBe(3);

      const dbAnswers = await prisma.answers.findMany({ where: { attempt_id: attemptId } });
      expect(dbAnswers.length).toBe(3);

      // Nộp bài attempt 1
      await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);
    });

    it('TC-082: Hết giờ tự nộp -> Tự nộp với các câu đã làm (submitMode = timeout)', async () => {
      const attRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${examAssignmentId}/attempts`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);
      const attemptId = attRes.body.id;

      // Lưu 1 câu
      await request(app.getHttpServer())
        .put(`/api/v1/assessment/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [{ questionId: q1Id, response: { selected: 'B' } }],
        })
        .expect(200);

      // Tự nộp khi timeout
      const subRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ submitMode: 'timeout' })
        .expect(201);

      expect(subRes.body.submitted_at).toBeDefined();
      expect(subRes.body.submit_mode).toBe('timeout');
    });

    it('TC-083: Nộp hai lần cùng lúc -> Chặn nộp đè lần 2 (400 Bad Request)', async () => {
      // 1. Tạo attempt mới cho bài khác
      const qRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'true_false',
          stem: 'COM-Q-083: True or False test',
          skill: 'reading',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 1,
          answerKey: { correct: true },
        })
        .expect(201);

      const asg = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-083: Chống nộp 2 lần',
          kind: 'homework',
          questionIds: [qRes.body.id],
          targets: [{ targetType: 'student', studentId: student2Id }],
        })
        .expect(201);

      const attRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${asg.body.id}/attempts`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(201);
      const attemptId = attRes.body.id;

      // Lần nộp 1 -> Thành công 201
      await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(201);

      // Lần nộp 2 -> Bị từ chối 400 Bad Request
      const secondRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('đã được nộp trước đó');
    });

    it('TC-084: Chấm trắc nghiệm ngay (< 2 giây), đúng đáp án', async () => {
      // Tạo bài kiểm tra 100% trắc nghiệm (Q1 = 2đ, Q2 = 3đ -> Tổng 5đ)
      const asg = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-084: Trắc nghiệm tự động',
          kind: 'homework',
          questionIds: [q1Id, q2Id],
          targets: [{ targetType: 'student', studentId: student2Id }],
        })
        .expect(201);

      const attRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${asg.body.id}/attempts`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(201);
      const attemptId = attRes.body.id;

      // Trả lời đúng cả 2 câu
      await request(app.getHttpServer())
        .put(`/api/v1/assessment/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          answers: [
            { questionId: q1Id, response: { selected: 'B' } }, // Đúng -> 2đ
            { questionId: q2Id, response: { selected: true } }, // Đúng -> 3đ
          ],
        })
        .expect(200);

      const startTime = Date.now();
      const subRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(201);
      const durationMs = Date.now() - startTime;

      expect(durationMs).toBeLessThan(2000); // Dưới 2 giây (TC-084)
      expect(Number(subRes.body.auto_score)).toBe(5);
      expect(Number(subRes.body.final_score)).toBe(5);
    });
  });

  // =========================================================================
  // 4. BẢO MẬT ĐÁP ÁN & CÔNG BỐ (FR-608, TC-085, TC-086)
  // =========================================================================

  describe('Bảo mật đáp án & Công bố (FR-608, TC-085, TC-086)', () => {
    let secretAssignmentId: string;
    let secretAttemptId: string;
    let qSecretId: string;

    beforeAll(async () => {
      const q = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'essay',
          stem: 'COM-Q-SECRET: Write your life goals.',
          skill: 'writing',
          framework: 'CEFR',
          levelCode: 'B1',
          difficulty: 3,
          points: 10,
          explanation: 'Secret teacher explanation guide.',
        })
        .expect(201);
      qSecretId = q.body.id;

      const asg = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-SECRET: Đề thi bảo mật chưa công bố',
          kind: 'test',
          showAnswerMode: 'after_publish',
          questionIds: [qSecretId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);
      secretAssignmentId = asg.body.id;

      const att = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${secretAssignmentId}/attempts`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);
      secretAttemptId = att.body.id;

      await request(app.getHttpServer())
        .put(`/api/v1/assessment/attempts/${secretAttemptId}/answers`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [{ questionId: qSecretId, response: { text: 'I want to be a software engineer.' } }],
        })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${secretAttemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);
    });

    it('TC-085: Chưa công bố thì API không trả đáp án và điểm tự luận cho học sinh', async () => {
      // 1. Học sinh xem đề bài -> Không có explanation
      const asgView = await request(app.getHttpServer())
        .get(`/api/v1/assessment/assignments/${secretAssignmentId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(200);

      expect(asgView.body.isPublished).toBe(false);
      expect(asgView.body.questions[0].question.explanation).toBeUndefined();
      expect(asgView.body.questions[0].question.answerKey).toBeUndefined();

      // 2. Học sinh xem kết quả bài làm -> finalScore bị giấu, explanation bị giấu
      const attView = await request(app.getHttpServer())
        .get(`/api/v1/assessment/attempts/${secretAttemptId}/results`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(200);

      expect(attView.body.isPublished).toBe(false);
      expect(attView.body.finalScore).toBeUndefined();
      expect(attView.body.answers[0].explanation).toBeUndefined();
    });

    it('TC-086: Phụ huynh xem đáp án sau công bố -> Thấy điểm, đáp án, nhận xét', async () => {
      // 1. Giáo viên chấm điểm câu tự luận
      await request(app.getHttpServer())
        .patch(`/api/v1/assessment/attempts/${secretAttemptId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          grades: [{ questionId: qSecretId, finalPoints: 9 }],
          overallFeedback: 'Bài viết tốt, cấu trúc ngữ pháp chuẩn xác.',
        })
        .expect(200);

      // 2. Giáo viên công bố kết quả
      await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${secretAssignmentId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      // 3. Phụ huynh mở xem bài thi của con -> Thấy điểm 9, nhận xét và lời giải
      const parentView = await request(app.getHttpServer())
        .get(`/api/v1/assessment/attempts/${secretAttemptId}/results`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(parentView.body.isPublished).toBe(true);
      expect(Number(parentView.body.finalScore)).toBe(9);
      expect(parentView.body.teacherFeedback).toBe('Bài viết tốt, cấu trúc ngữ pháp chuẩn xác.');
      expect(parentView.body.answers[0].explanation).toBe('Secret teacher explanation guide.');
    });
  });

  // =========================================================================
  // 5. YÊU CẦU CHẤM LẠI / PHÚC KHẢO (FR-609, TC-087..TC-090)
  // =========================================================================

  describe('Yêu cầu chấm lại / Phúc khảo (FR-609, TC-087..TC-090)', () => {
    let regradeAssignmentId: string;
    let regradeAttemptId: string;
    let oldAssignmentId: string;
    let oldAttemptId: string;
    let qId: string;

    beforeAll(async () => {
      const q = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'single_choice',
          stem: 'COM-Q-REGRADE: Question for regrade testing',
          skill: 'reading',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 2,
          answerKey: { correct: 'A' },
        })
        .expect(201);
      qId = q.body.id;

      // Assignment 1: Công bố vừa xong (trong hạn 7 ngày)
      const asg1 = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-REGRADE-1: Vừa công bố',
          kind: 'test',
          questionIds: [qId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);
      regradeAssignmentId = asg1.body.id;

      const att1 = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${regradeAssignmentId}/attempts`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);
      regradeAttemptId = att1.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${regradeAttemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${regradeAssignmentId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      // Assignment 2: Giả lập đã công bố cách đây 8 ngày (quá hạn 7 ngày)
      const asg2 = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-REGRADE-OLD: Công bố 8 ngày trước',
          kind: 'test',
          questionIds: [qId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);
      oldAssignmentId = asg2.body.id;

      const att2 = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${oldAssignmentId}/attempts`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);
      oldAttemptId = att2.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${oldAttemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);

      // Update published_at = 8 ngày trước
      await prisma.assignments.update({
        where: { id: oldAssignmentId },
        data: {
          published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it('TC-087: Yêu cầu chấm lại trong hạn -> Thành công, chuyển trạng thái pending', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${regradeAttemptId}/regrade-requests`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          reason: 'Em thấy câu 1 em làm đúng nhưng hệ thống ghi nhận sai.',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('pending');
    });

    it('TC-088: Yêu cầu chấm lại quá 7 ngày -> Trả về 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${oldAttemptId}/regrade-requests`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          reason: 'Xin phúc khảo bài thi cũ.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Đã quá thời hạn 7 ngày');
    });

    it('TC-089: Mỗi bài chỉ chấm lại một lần -> Gửi lần 2 bị chặn 400 Bad Request', async () => {
      // regradeAttemptId đã nộp ở TC-087, giờ thử nộp tiếp lần 2
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assessment/attempts/${regradeAttemptId}/regrade-requests`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          reason: 'Em cố tình gửi phúc khảo lần thứ hai.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('chỉ được gửi yêu cầu chấm lại một lần duy nhất');
    });

    it('TC-090: Quá 3 ngày làm việc báo Giáo vụ -> Kích hoạt escalated_at', async () => {
      // Giả lập yêu cầu tạo ra cách đây 4 ngày
      const regrade = await prisma.regrade_requests.findUnique({
        where: { attempt_id: regradeAttemptId },
      });

      await prisma.regrade_requests.update({
        where: { id: regrade!.id },
        data: {
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          escalated_at: null,
        },
      });

      // Kích hoạt job quét quá hạn
      const jobRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/jobs/regrade-escalation')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      expect(jobRes.body.escalatedCount).toBeGreaterThanOrEqual(1);

      const updated = await prisma.regrade_requests.findUnique({
        where: { id: regrade!.id },
      });
      expect(updated?.escalated_at).not.toBeNull();
    });
  });

  // =========================================================================
  // 6. AI TẠO ĐỀ & KIỂM SOÁT DUYỆT (FR-604, TC-091)
  // =========================================================================

  describe('AI tạo đề & Kiểm soát duyệt (FR-604, TC-091)', () => {
    let aiQuestionDraftId: string;

    it('TC-091: AI tạo đề phải duyệt trước khi giao -> Chưa duyệt thì không giao được, duyệt xong giao thành công', async () => {
      // 1. AI sinh câu hỏi (ở dạng draft, is_ai = true, approved_by = null)
      const aiRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions/generate-ai')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'single_choice',
          stem: 'COM-Q-AI-091: AI generated grammar question',
          skill: 'grammar',
          framework: 'CEFR',
          levelCode: 'A2',
          difficulty: 2,
          answerKey: { correct: 'C' },
          explanation: 'Rule for past continuous tense.',
        })
        .expect(201);

      aiQuestionDraftId = aiRes.body.id;
      expect(aiRes.body.is_ai).toBe(true);
      expect(aiRes.body.status).toBe('draft');
      expect(aiRes.body.approved_by).toBeNull();

      // 2. Giáo viên cố giao bài thi dùng câu hỏi AI chưa duyệt -> Bị chặn 400 Bad Request
      const failAsg = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-AI-FAIL: Giao bài khi chưa duyệt câu AI',
          kind: 'homework',
          questionIds: [aiQuestionDraftId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        });

      expect(failAsg.status).toBe(400);
      expect(failAsg.body.message).toContain('Câu hỏi do AI tạo phải được giáo viên phê duyệt trước khi giao bài');

      // 3. Giáo viên thực hiện phê duyệt câu hỏi AI
      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/assessment/questions/${aiQuestionDraftId}/approve`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      expect(approveRes.body.status).toBe('approved');
      expect(approveRes.body.approved_by).toBe(teacherUserId);

      // 4. Giao bài lại -> Thành công 201
      const okAsg = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-AI-OK: Giao bài sau khi duyệt câu AI',
          kind: 'homework',
          questionIds: [aiQuestionDraftId],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);

      expect(okAsg.body.id).toBeDefined();
    });
  });

  // =========================================================================
  // 7. KIỂM THỬ TẢI LƯU NHÁP CONCURRENT (FR-605, TC-098)
  // =========================================================================

  describe('Kiểm thử tải lưu nháp Concurrent (FR-605, TC-098)', () => {
    it('TC-098: Lưu nháp liên tục đồng thời không lỗi và thời gian xử lý nhanh', async () => {
      // Chuẩn bị 1 bài thi và 1 attempt
      const qRes = await request(app.getHttpServer())
        .post('/api/v1/assessment/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          type: 'single_choice',
          stem: 'COM-Q-098: Concurrent test question',
          skill: 'reading',
          framework: 'CEFR',
          levelCode: 'B1',
          difficulty: 2,
          answerKey: { correct: 'A' },
        })
        .expect(201);

      const asg = await request(app.getHttpServer())
        .post('/api/v1/assessment/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'COM-ASG-098: Concurrent load test',
          kind: 'homework',
          questionIds: [qRes.body.id],
          targets: [{ targetType: 'student', studentId: student1Id }],
        })
        .expect(201);

      const att = await request(app.getHttpServer())
        .post(`/api/v1/assessment/assignments/${asg.body.id}/attempts`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(201);

      // Chạy 30 yêu cầu lưu nháp đồng thời
      const promises = Array.from({ length: 30 }).map((_, i) =>
        request(app.getHttpServer())
          .put(`/api/v1/assessment/attempts/${att.body.id}/answers`)
          .set('Authorization', `Bearer ${student1Token}`)
          .send({
            answers: [{ questionId: qRes.body.id, response: { selected: `Option_${i}` } }],
          }),
      );

      const start = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - start;

      const allSuccess = results.every((r) => r.status === 200);
      expect(allSuccess).toBe(true);
      expect(totalTime).toBeLessThan(5000); // 30 concurrent upserts dưới 5s
    });
  });
});
