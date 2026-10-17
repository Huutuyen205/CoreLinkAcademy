import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M05 GĐ3: AI Bổ sung giáo trình & Video bài giảng (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let academicToken: string;
  let academicUserId: string;
  let teacherToken: string;
  let teacherUserId: string;
  let teacherId: string;

  let curriculumId: string;
  let versionId: string;
  let lessonPlanId: string;

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM videos WHERE created_by = ?', teacherUserId);
      await prisma.$executeRawUnsafe('DELETE FROM curriculum_suggestions WHERE version_id = ?', versionId);
      await prisma.$executeRawUnsafe('DELETE FROM curriculum_nodes WHERE version_id = ? OR version_id IN (SELECT id FROM curriculum_versions WHERE curriculum_id = ?)', versionId, curriculumId);
      await prisma.$executeRawUnsafe('DELETE FROM curriculum_versions WHERE curriculum_id = ?', curriculumId);
      await prisma.$executeRawUnsafe('DELETE FROM curricula WHERE id = ?', curriculumId);
      await prisma.$executeRawUnsafe('DELETE FROM lesson_plans WHERE id = ?', lessonPlanId);
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
    const academicRole = await prisma.roles.findUnique({ where: { code: 'academic' } });
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });

    // 3. Academic Lead User (Trưởng bộ môn)
    const aUser = await prisma.users.upsert({
      where: { email: 'academic_step14@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Trưởng bộ môn Đỗ Thanh Hải',
        email: 'academic_step14@corelink.edu.vn',
        phone: '+84988880141',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    academicUserId = aUser.id;
    if (academicRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: aUser.id, role_id: academicRole.id } },
        update: {},
        create: { user_id: aUser.id, role_id: academicRole.id },
      });
    }

    // 4. Teacher User
    const tUser = await prisma.users.upsert({
      where: { email: 'teacher_step14@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Cô Vũ Bích Ngọc',
        email: 'teacher_step14@corelink.edu.vn',
        phone: '+84988880142',
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
        bio_public: 'Giáo viên Step 14',
      },
    });
    teacherId = teacherProfile.id;

    // 5. Curricula & Version 1 for TC-074
    const program = await prisma.programs.findFirst();
    const cur = await prisma.curricula.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        title: 'Giáo trình Tiếng Anh Thiếu Nhi KET A2',
        created_by: academicUserId,
      },
    });
    curriculumId = cur.id;

    const cv = await prisma.curriculum_versions.create({
      data: {
        curriculum_id: cur.id,
        version_no: 1,
        status: 'approved',
        created_by: academicUserId,
      },
    });
    versionId = cv.id;

    // 6. Lesson plan for Video TC-075
    const lp = await prisma.lesson_plans.create({
      data: {
        branch_id: branchId,
        teacher_id: teacherId,
        title: 'LP-S14: Kế hoạch bài giảng Unit 1 Family and Habits',
        status: 'approved',
      },
    });
    lessonPlanId = lp.id;

    // 7. Login Tokens
    const aLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'academic_step14@corelink.edu.vn', password: 'Test@123456' });
    academicToken = aLogin.body.accessToken;

    const tLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_step14@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = tLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  // =========================================================================
  // TC-074 (FR-503 / AI-02): Đề xuất bổ sung giáo trình chờ duyệt
  // =========================================================================
  describe('TC-074 (FR-503 / AI-02): AI đề xuất bổ sung giáo trình & Trưởng bộ môn duyệt', () => {
    let suggestion1Id: string;
    let suggestion2Id: string;

    it('AI đối soát giáo trình với chuẩn CEFR A2 và sinh đề xuất bổ sung', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/video-curriculum/standards/compare')
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          version_id: versionId,
          framework: 'CEFR',
          level_code: 'A2',
        });

      expect(res.status).toBe(201);
      expect(res.body.missing_standards_count).toBe(2);
      expect(res.body.suggestions).toHaveLength(2);

      suggestion1Id = res.body.suggestions[0].id;
      suggestion2Id = res.body.suggestions[1].id;
      expect(res.body.suggestions[0].status).toBe('pending');
    });

    it('Trưởng bộ môn từ chối 1 đề xuất và chấp thuận 1 đề xuất', async () => {
      // 1. Từ chối đề xuất 1
      const resReject = await request(app.getHttpServer())
        .post(`/api/v1/video-curriculum/suggestions/${suggestion1Id}/decide`)
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          decision: 'rejected',
          reason: 'Nội dung này chưa phù hợp với độ tuổi lớp học',
        });

      expect(resReject.status).toBe(201);
      expect(resReject.body.decision).toBe('rejected');
      expect(resReject.body.suggestion.status).toBe('rejected');
      expect(resReject.body.created_node).toBeNull();

      // 2. Chấp thuận đề xuất 2
      const resAccept = await request(app.getHttpServer())
        .post(`/api/v1/video-curriculum/suggestions/${suggestion2Id}/decide`)
        .set('Authorization', `Bearer ${academicToken}`)
        .send({
          decision: 'accepted',
        });

      expect(resAccept.status).toBe(201);
      expect(resAccept.body.decision).toBe('accepted');
      expect(resAccept.body.suggestion.status).toBe('accepted');
      expect(resAccept.body.created_node).toBeDefined();
      expect(resAccept.body.created_node.is_ai).toBe(true); // TC-074: Nội dung giữ nhãn AI
      expect(resAccept.body.created_node.title).toContain('[AI Added]');

      // Kiểm tra trong DB: Chỉ đề xuất được duyệt vào phiên bản mới (v2)
      const v2 = await prisma.curriculum_versions.findUnique({
        where: {
          curriculum_id_version_no: {
            curriculum_id: curriculumId,
            version_no: 2,
          },
        },
      });
      expect(v2).toBeDefined();
      expect(v2?.change_note).toContain('Đã tích hợp đề xuất AI');
    });
  });

  // =========================================================================
  // TC-075 (FR-506 / AI-04): Video bài giảng AI chỉ dựng sau khi duyệt kịch bản
  // =========================================================================
  describe('TC-075 (FR-506 / AI-04): Video bài giảng chỉ dựng sau khi duyệt kịch bản', () => {
    let videoId: string;

    it('AI sinh kịch bản video bài giảng mức 1 (slides_tts <= 10 phút / 480s)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/video-curriculum/videos/generate-script')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          lesson_plan_id: lessonPlanId,
          topic: 'Unit 1 Family Routines',
        });

      expect(res.status).toBe(201);
      expect(res.body.video_id).toBeDefined();
      expect(res.body.duration_s).toBeLessThanOrEqual(600); // <= 10 phút
      expect(res.body.status).toBe('script_review');

      const script = res.body.script;
      expect(script.scenes.length).toBeGreaterThan(0);
      expect(script.scenes[0].voice_script).toBeDefined();
      expect(script.scenes[0].slide_text).toBeDefined();

      videoId = res.body.video_id;
    });

    it('Từ chối dựng video (render) khi kịch bản chưa được phê duyệt', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/video-curriculum/videos/${videoId}/render`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('chưa được phê duyệt');
    });

    it('Duyệt kịch bản và tiến hành dựng video thành công', async () => {
      // 1. Duyệt kịch bản
      const resApprove = await request(app.getHttpServer())
        .post(`/api/v1/video-curriculum/videos/${videoId}/approve-script`)
        .set('Authorization', `Bearer ${academicToken}`)
        .send();

      expect(resApprove.status).toBe(201);
      expect(resApprove.body.script_approved_by).toBe(academicUserId);

      // 2. Dựng video sau khi kịch bản đã được duyệt
      const resRender = await request(app.getHttpServer())
        .post(`/api/v1/video-curriculum/videos/${videoId}/render`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send();

      expect(resRender.status).toBe(201);
      expect(resRender.body.status).toBe('published');
      expect(resRender.body.has_subtitles).toBe(true);
      expect(resRender.body.duration_s).toBeLessThanOrEqual(600);

      // Kiểm tra DB: video published, có script_approved_by và approved_by
      const dbVideo = await prisma.videos.findUnique({
        where: { id: videoId },
      });
      expect(dbVideo?.status).toBe('published');
      expect(dbVideo?.script_approved_by).toBe(academicUserId);
      expect(dbVideo?.approved_by).toBe(teacherUserId);
    });
  });
});
