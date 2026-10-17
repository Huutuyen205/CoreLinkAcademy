import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M05 GĐ2: Giáo trình thông minh & Học liệu AI (e2e)', () => {
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

  let curriculumId: string;
  let versionId: string;
  let fileCenterId: string;
  let fileThirdPartyId: string;
  let lessonPlanApprovedId: string;
  let lessonPlanThirdPartyId: string;

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM materials WHERE title LIKE "%[AI Draft]%"');
      await prisma.$executeRawUnsafe('DELETE FROM lesson_plans WHERE title LIKE "LP-S13-%"');
      await prisma.$executeRawUnsafe('DELETE FROM curriculum_nodes WHERE version_id = ?', versionId);
      await prisma.$executeRawUnsafe('DELETE FROM curriculum_versions WHERE id = ?', versionId);
      await prisma.$executeRawUnsafe('DELETE FROM curricula WHERE id = ?', curriculumId);
      await prisma.$executeRawUnsafe('DELETE FROM enrollments WHERE class_id = ?', classId);
      await prisma.$executeRawUnsafe('DELETE FROM classes WHERE id = ?', classId);
      await prisma.$executeRawUnsafe('DELETE FROM files WHERE id IN (?, ?)', fileCenterId, fileThirdPartyId);
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
      where: { email: 'teacher_step13@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Lê Văn Thành',
        email: 'teacher_step13@corelink.edu.vn',
        phone: '+84988880131',
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
        bio_public: 'Giáo viên Step 13',
      },
    });
    teacherId = teacherProfile.id;

    // 4. Student user
    const sUser = await prisma.users.upsert({
      where: { email: 'student_step13@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Ngô Thu Trang',
        email: 'student_step13@corelink.edu.vn',
        phone: '+84988880132',
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
        code: 'STD-S13-01',
      },
    });
    studentId = studentProfile.id;

    // 5. Class & Enrollment
    const program = await prisma.programs.findFirst();
    const testClass = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        code: `CLS-S13-${Date.now().toString().slice(-6)}`,
        name: 'Lớp Cambridge KET Step 13',
        start_date: new Date('2026-09-01'),
        end_date: new Date('2026-12-31'),
        recurrence: { days: [1, 3, 5], time: '18:00' },
        created_by: teacherUserId,
        status: 'running',
      },
    });
    classId = testClass.id;

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

    // 6. Curricula & Version for TC-072
    const cur = await prisma.curricula.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        title: 'Giáo trình Cambridge KET Chuẩn 40 Trang',
        created_by: teacherUserId,
      },
    });
    curriculumId = cur.id;

    const cv = await prisma.curriculum_versions.create({
      data: {
        curriculum_id: cur.id,
        version_no: 1,
        status: 'review',
        created_by: teacherUserId,
      },
    });
    versionId = cv.id;

    // 7. Files: One Center Copyright, One Third-Party Copyright (for TC-073)
    const fCenter = await prisma.files.create({
      data: {
        branch_id: branchId,
        uploaded_by: teacherUserId,
        original_name: 'lesson_plan_center.pdf',
        storage_key: `storage/center-${Date.now()}.pdf`,
        size_bytes: BigInt(10240),
        mime_type: 'application/pdf',
        purpose: 'curriculum',
        copyright_source: 'center',
      },
    });
    fileCenterId = fCenter.id;

    const fThirdParty = await prisma.files.create({
      data: {
        branch_id: branchId,
        uploaded_by: teacherUserId,
        original_name: 'cambridge_copyright_book.pdf',
        storage_key: `storage/thirdparty-${Date.now()}.pdf`,
        size_bytes: BigInt(20480),
        mime_type: 'application/pdf',
        purpose: 'curriculum',
        copyright_source: 'third_party', // TC-073 bản quyền bên thứ 3
      },
    });
    fileThirdPartyId = fThirdParty.id;

    // 8. Lesson Plans for TC-073
    const lpApproved = await prisma.lesson_plans.create({
      data: {
        branch_id: branchId,
        teacher_id: teacherId,
        file_id: fCenter.id,
        title: 'LP-S13-01: Giáo án Unit 1 Family and Routine',
        status: 'approved',
      },
    });
    lessonPlanApprovedId = lpApproved.id;

    const lpThirdParty = await prisma.lesson_plans.create({
      data: {
        branch_id: branchId,
        teacher_id: teacherId,
        file_id: fThirdParty.id,
        title: 'LP-S13-02: Giáo án từ sách bản quyền Oxford',
        status: 'approved',
      },
    });
    lessonPlanThirdPartyId = lpThirdParty.id;

    // 9. Login Tokens
    const tLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_step13@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = tLogin.body.accessToken;

    const sLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student_step13@corelink.edu.vn', password: 'Test@123456' });
    studentToken = sLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  // =========================================================================
  // TC-072 (FR-502 / AI-01): AI tách cấu trúc giáo trình 40 trang kèm trang nguồn
  // =========================================================================
  describe('TC-072 (FR-502 / AI-01): AI tách cấu trúc giáo trình kèm trang nguồn', () => {
    let parsedUnitNodeId: string;

    it('AI phân tích giáo trình 40 trang thành cây chương/bài/mục tiêu, mỗi node có trang nguồn', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/smart-curriculum/parse-structure')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          version_id: versionId,
          file_name: 'cambridge_ket_40pages.pdf',
          total_pages: 40,
        });

      expect(res.status).toBe(201);
      expect(res.body.total_nodes).toBeGreaterThan(0);
      expect(res.body.tree.length).toBeGreaterThan(0);

      // Kiểm tra Unit 1 có trang nguồn
      const unit1 = res.body.tree[0];
      expect(unit1.source_page).toBe(1);
      expect(unit1.title).toContain('Unit 1');
      expect(unit1.children.length).toBeGreaterThan(0);

      // Kiểm tra Lesson con có trang nguồn và kỹ năng
      const lesson1 = unit1.children[0];
      expect(lesson1.source_page).toBe(4);
      expect(lesson1.skill).toBe('vocabulary');
      expect(lesson1.cefr_level).toBe('A2');

      // Kiểm tra Objective con
      const obj1 = lesson1.children[0];
      expect(obj1.source_page).toBe(6);
      expect(obj1.node_type).toBe('objective');

      parsedUnitNodeId = unit1.id;
    });

    it('Giáo viên chỉnh sửa được mục trên cây cấu trúc giáo trình', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/smart-curriculum/nodes/${parsedUnitNodeId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Unit 1: Family, Friends & Global Connections (Đã hiệu chỉnh)',
          source_page: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.node.title).toContain('Đã hiệu chỉnh');
      expect(res.body.node.source_page).toBe(2);

      // Kiểm tra trong DB
      const dbNode = await prisma.curriculum_nodes.findUnique({
        where: { id: parsedUnitNodeId },
      });
      expect(dbNode?.title).toContain('Đã hiệu chỉnh');
      expect(dbNode?.source_page).toBe(2);
    });

    it('Truy xuất sơ đồ lộ trình học tập đầy đủ của giáo trình', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/smart-curriculum/roadmap/${versionId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.version_id).toBe(versionId);
      expect(res.body.nodes.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // TC-073 (FR-505 / AI-03): AI tạo học liệu nháp & bảo vệ bản quyền bên thứ 3
  // =========================================================================
  describe('TC-073 (FR-505 / AI-03): AI tạo học liệu nháp từ giáo án đã duyệt', () => {
    let generatedWorksheetId: string;

    it('Từ chối tạo học liệu AI khi giáo án gắn tài liệu bản quyền bên thứ ba (third_party)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/smart-curriculum/generate-materials')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          lesson_plan_id: lessonPlanThirdPartyId,
          class_id: classId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('bản quyền bên thứ ba');
    });

    it('AI tạo bộ học liệu nháp (worksheet, vocabulary, slides) mang nhãn AI', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/smart-curriculum/generate-materials')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          lesson_plan_id: lessonPlanApprovedId,
          class_id: classId,
        });

      expect(res.status).toBe(201);
      expect(res.body.generated_count).toBe(3);

      const worksheet = res.body.materials.find((m: any) => m.type === 'worksheet');
      expect(worksheet).toBeDefined();
      expect(worksheet.is_ai).toBe(true);
      expect(worksheet.status).toBe('draft');
      expect(worksheet.title).toContain('[AI Draft]');

      generatedWorksheetId = worksheet.id;
    });

    it('Học sinh không thấy học liệu nháp mang nhãn AI khi chưa xuất bản', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/smart-curriculum/materials/class/${classId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      // Học sinh không nhìn thấy bất kỳ tài liệu nào có id là generatedWorksheetId
      const found = res.body.some((m: any) => m.id === generatedWorksheetId);
      expect(found).toBe(false);
    });

    it('Giáo viên xuất bản học liệu -> Học sinh thấy và tải được tài liệu', async () => {
      // 1. Giáo viên xuất bản
      const resPublish = await request(app.getHttpServer())
        .post(`/api/v1/smart-curriculum/materials/${generatedWorksheetId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(resPublish.status).toBe(201);
      expect(resPublish.body.material.status).toBe('published');
      expect(resPublish.body.material.published_by).toBe(teacherUserId);

      // 2. Học sinh gọi lại API -> Thấy tài liệu đã xuất bản
      const resStudent = await request(app.getHttpServer())
        .get(`/api/v1/smart-curriculum/materials/class/${classId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resStudent.status).toBe(200);
      const publishedMat = resStudent.body.find((m: any) => m.id === generatedWorksheetId);
      expect(publishedMat).toBeDefined();
      expect(publishedMat.status).toBe('published');
      expect(publishedMat.allow_download).toBe(true);
    });
  });
});
