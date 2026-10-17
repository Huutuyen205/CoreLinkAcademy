import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

describe('M05, M07, M08 Phụ huynh, đánh giá, tiến độ, giáo trình & tóm tắt ngày (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let adminToken: string;
  let teacher1Token: string;
  let teacher1UserId: string;
  let teacher2Token: string;
  let teacher2UserId: string;
  let student1Token: string;
  let student1UserId: string;
  let student1Id: string;
  let student2Token: string;
  let student2UserId: string;
  let student2Id: string;
  let student3Token: string;
  let student3UserId: string;
  let student3Id: string;
  let parentToken: string;
  let parentUserId: string;
  let guardianId: string;

  let class1Id: string;
  let class2Id: string;
  let curriculumId: string;

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM daily_summaries');
      await prisma.$executeRawUnsafe('DELETE FROM evaluations');
      await prisma.$executeRawUnsafe('DELETE FROM attendance');
      await prisma.$executeRawUnsafe('DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE code LIKE "HS-S09-%")');
      await prisma.$executeRawUnsafe('DELETE FROM class_sessions WHERE class_id IN (SELECT id FROM classes WHERE code LIKE "CLS-M01-%" OR code LIKE "CLS-F02-%")');
      await prisma.$executeRawUnsafe('DELETE FROM classes WHERE code LIKE "CLS-M01-%" OR code LIKE "CLS-F02-%"');
      await prisma.$executeRawUnsafe('DELETE FROM materials');
      await prisma.$executeRawUnsafe('DELETE FROM lesson_plans');
      await prisma.$executeRawUnsafe('DELETE FROM curriculum_versions');
      await prisma.$executeRawUnsafe('DELETE FROM curricula');
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

    // 1. Branch
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // Roles
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });
    const guardianRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });

    // 2. Admin User
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_step9@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Quản trị viên Đào tạo',
        email: 'admin_step9@corelink.edu.vn',
        phone: '+84988880090',
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

    // 3. Teacher 1 User
    const t1User = await prisma.users.upsert({
      where: { email: 'teacher1_step9@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Cô Mai Lan',
        email: 'teacher1_step9@corelink.edu.vn',
        phone: '+84988880091',
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
    await prisma.teachers.upsert({
      where: { user_id: t1User.id },
      update: {},
      create: { user_id: t1User.id, branch_id: branchId },
    });

    // 4. Teacher 2 User
    const t2User = await prisma.users.upsert({
      where: { email: 'teacher2_step9@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Đức Huy',
        email: 'teacher2_step9@corelink.edu.vn',
        phone: '+84988880092',
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
    await prisma.teachers.upsert({
      where: { user_id: t2User.id },
      update: {},
      create: { user_id: t2User.id, branch_id: branchId },
    });

    // 5. Student 1 User (Con A)
    const s1User = await prisma.users.upsert({
      where: { email: 'student1_step9@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Lê Minh Khôi (Con A)',
        email: 'student1_step9@corelink.edu.vn',
        phone: '+84988880093',
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
        code: 'HS-S09-01',
        grade_level: 4,
      },
    });
    student1Id = st1.id;

    // 6. Student 2 User (Con B)
    const s2User = await prisma.users.upsert({
      where: { email: 'student2_step9@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Lê Bảo Ngọc (Con B)',
        email: 'student2_step9@corelink.edu.vn',
        phone: '+84988880094',
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
        code: 'HS-S09-02',
        grade_level: 2,
      },
    });
    student2Id = st2.id;

    // 7. Student 3 User (Lớp khác)
    const s3User = await prisma.users.upsert({
      where: { email: 'student3_step9@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Trần Tuấn Kiệt (Lớp Khác)',
        email: 'student3_step9@corelink.edu.vn',
        phone: '+84988880095',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    student3UserId = s3User.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: s3User.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: s3User.id, role_id: studentRole.id },
      });
    }
    const st3 = await prisma.students.upsert({
      where: { user_id: s3User.id },
      update: {},
      create: {
        user_id: s3User.id,
        branch_id: branchId,
        code: 'HS-S09-03',
        grade_level: 5,
      },
    });
    student3Id = st3.id;

    // 8. Parent User (Guardian of Student 1 and Student 2)
    const pUser = await prisma.users.upsert({
      where: { email: 'parent_step9@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phụ huynh Lê Hùng',
        email: 'parent_step9@corelink.edu.vn',
        phone: '+84988880096',
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

    // Link Guardian to Student 1 and Student 2 (TC-106)
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

    await prisma.guardianships.upsert({
      where: {
        student_id_guardian_id: {
          student_id: student2Id,
          guardian_id: guardianId,
        },
      },
      update: {},
      create: {
        student_id: student2Id,
        guardian_id: guardianId,
        relation: 'father',
      },
    });

    // 9. Classes & Enrollments
    const program = await prisma.programs.findFirst();
    const c1 = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        name: 'Lớp Cambridge Movers 01',
        code: `CLS-M01-${Date.now().toString().slice(-4)}`,
        status: 'running',
        start_date: new Date('2026-09-01'),
        end_date: new Date('2026-12-30'),
        capacity: 20,
        recurrence: { days: [2, 4, 6], start_time: '18:00', end_time: '19:30' },
        created_by: adminUser.id,
      },
    });
    class1Id = c1.id;

    const c2 = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: program!.id,
        name: 'Lớp Cambridge Flyers 02',
        code: `CLS-F02-${Date.now().toString().slice(-4)}`,
        status: 'running',
        start_date: new Date('2026-09-01'),
        end_date: new Date('2026-12-30'),
        capacity: 20,
        recurrence: { days: [3, 5, 7], start_time: '18:00', end_time: '19:30' },
        created_by: adminUser.id,
      },
    });
    class2Id = c2.id;

    // Enroll student1 and student2 in Class 1
    await prisma.enrollments.create({
      data: {
        branch_id: branchId,
        class_id: class1Id,
        student_id: student1Id,
        enrolled_on: new Date(),
        created_by: adminUser.id,
        status: 'active',
      },
    });

    await prisma.enrollments.create({
      data: {
        branch_id: branchId,
        class_id: class1Id,
        student_id: student2Id,
        enrolled_on: new Date(),
        created_by: adminUser.id,
        status: 'active',
      },
    });

    // Enroll student3 in Class 2
    await prisma.enrollments.create({
      data: {
        branch_id: branchId,
        class_id: class2Id,
        student_id: student3Id,
        enrolled_on: new Date(),
        created_by: adminUser.id,
        status: 'active',
      },
    });

    // Create 24 sessions for Class 1 (for progress calculation TC-100: 6/24 = 25%)
    const teacher1 = await prisma.teachers.findFirst({ where: { user_id: teacher1UserId } });
    for (let i = 1; i <= 24; i++) {
      const isCompleted = i <= 6;
      const sessionDate = isCompleted
        ? new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + (i - 6) * 24 * 60 * 60 * 1000);
      await prisma.class_sessions.create({
        data: {
          branch_id: branchId,
          class_id: class1Id,
          session_no: i,
          starts_at: sessionDate,
          ends_at: new Date(sessionDate.getTime() + 90 * 60 * 1000),
          teacher_id: teacher1!.id,
          status: isCompleted ? 'done' : 'scheduled',
          lesson_node_id: null,
        },
      });
    }

    // 10. Login Tokens
    const aLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_step9@corelink.edu.vn', password: 'Test@123456' });
    adminToken = aLogin.body.accessToken;

    const t1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher1_step9@corelink.edu.vn', password: 'Test@123456' });
    teacher1Token = t1Login.body.accessToken;

    const t2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher2_step9@corelink.edu.vn', password: 'Test@123456' });
    teacher2Token = t2Login.body.accessToken;

    const s1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student1_step9@corelink.edu.vn', password: 'Test@123456' });
    student1Token = s1Login.body.accessToken;

    const s2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student2_step9@corelink.edu.vn', password: 'Test@123456' });
    student2Token = s2Login.body.accessToken;

    const s3Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student3_step9@corelink.edu.vn', password: 'Test@123456' });
    student3Token = s3Login.body.accessToken;

    const pLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'parent_step9@corelink.edu.vn', password: 'Test@123456' });
    parentToken = pLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  // =========================================================================
  // TC-066: Tải giáo trình khung và quản lý phiên bản (v1, v2; GV chỉ thấy v2)
  // =========================================================================
  it('TC-066: Admin tải giáo trình khung v1 và v2, GV chỉ thấy bản v2 hiệu lực', async () => {
    // Valid PDF buffer starting with %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    const validPdfBuffer = Buffer.from('%PDF-1.4 Mock curriculum PDF content for Cambridge English Primary');
    const base64Pdf = validPdfBuffer.toString('base64');

    // 1. Admin uploads v1
    const resV1 = await request(app.getHttpServer())
      .post('/api/v1/curriculum/framework')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Giáo trình Cambridge YLE 2026',
        change_note: 'Phiên bản ban đầu v1',
        file_base64: base64Pdf,
        file_name: 'curriculum_v1.pdf',
        file_mimetype: 'application/pdf',
        file_size: validPdfBuffer.length,
      })
      .expect(201);

    expect(resV1.body.curriculum).toBeDefined();
    expect(resV1.body.version.version_no).toBe(1);
    curriculumId = resV1.body.curriculum.id;

    // 2. Admin uploads v2 for the same curriculum
    const resV2 = await request(app.getHttpServer())
      .post('/api/v1/curriculum/framework')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        curriculum_id: curriculumId,
        change_note: 'Cập nhật bổ sung bài học phiên bản v2',
        file_base64: base64Pdf,
        file_name: 'curriculum_v2.pdf',
        file_mimetype: 'application/pdf',
        file_size: validPdfBuffer.length,
      })
      .expect(201);

    expect(resV2.body.version.version_no).toBe(2);

    // 3. Teacher queries curriculum framework -> only sees current active version (v2)
    const resTeacher = await request(app.getHttpServer())
      .get('/api/v1/curriculum/framework')
      .set('Authorization', `Bearer ${teacher1Token}`)
      .expect(200);

    const teacherCurriculum = resTeacher.body.find((c: any) => c.id === curriculumId);
    expect(teacherCurriculum).toBeDefined();
    expect(teacherCurriculum.versions.length).toBe(1);
    expect(teacherCurriculum.versions[0].version_no).toBe(2);

    // 4. Admin queries curriculum framework -> sees all versions (v1 and v2)
    const resAdmin = await request(app.getHttpServer())
      .get('/api/v1/curriculum/framework')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const adminCurriculum = resAdmin.body.find((c: any) => c.id === curriculumId);
    expect(adminCurriculum).toBeDefined();
    expect(adminCurriculum.versions.length).toBeGreaterThanOrEqual(2);
    const versionNos = adminCurriculum.versions.map((v: any) => v.version_no);
    expect(versionNos).toContain(1);
    expect(versionNos).toContain(2);
  });

  // =========================================================================
  // TC-067: File quá 100 MB bị từ chối
  // =========================================================================
  it('TC-067: File giáo trình quá 100 MB bị từ chối với mã lỗi 400 Bad Request', async () => {
    const validPdfBuffer = Buffer.from('%PDF-1.4 Small buffer with declared large size');
    const base64Pdf = validPdfBuffer.toString('base64');

    const res = await request(app.getHttpServer())
      .post('/api/v1/curriculum/framework')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Giáo trình siêu lớn 120MB',
        file_base64: base64Pdf,
        file_name: 'huge_curriculum.pdf',
        file_mimetype: 'application/pdf',
        file_size: 120 * 1024 * 1024, // 120 MB > 100 MB limit
      })
      .expect(400);

    expect(res.body.message).toContain('100 MB');
  });

  // =========================================================================
  // TC-068: File sai loại bị từ chối (kiểm tra nội dung file thật - magic bytes)
  // =========================================================================
  it('TC-068: File .exe đổi đuôi .pdf bị phát hiện và từ chối qua kiểm tra magic bytes', async () => {
    // Windows PE executable header: starts with 'MZ' (0x4D, 0x5A)
    const fakePdfBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00This is an executable payload disguised as PDF');
    const base64Fake = fakePdfBuffer.toString('base64');

    const res = await request(app.getHttpServer())
      .post('/api/v1/curriculum/framework')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Giáo trình giả mạo',
        file_base64: base64Fake,
        file_name: 'disguised_virus.pdf',
        file_mimetype: 'application/pdf',
        file_size: fakePdfBuffer.length,
      })
      .expect(400);

    expect(res.body.message).toContain('định dạng');
  });

  // =========================================================================
  // TC-069: Giáo án nháp chưa dùng chung
  // =========================================================================
  it('TC-069: Giáo án nháp của GV1 không hiển thị cho GV2 cho đến khi Admin phê duyệt', async () => {
    // 1. Teacher 1 uploads draft lesson plan
    const resDraft = await request(app.getHttpServer())
      .post('/api/v1/curriculum/lesson-plans')
      .set('Authorization', `Bearer ${teacher1Token}`)
      .send({
        title: 'Giáo án cá nhân: Phương pháp phát âm Unit 1 (Bản nháp)',
        content: 'Nội dung chi tiết các hoạt động trên lớp...',
      })
      .expect(201);

    const lessonPlanId = resDraft.body.id;
    expect(resDraft.body.status).toBe('draft');

    // 2. Teacher 2 queries lesson plans -> draft plan of Teacher 1 must NOT be visible
    const resT2Before = await request(app.getHttpServer())
      .get('/api/v1/curriculum/lesson-plans')
      .set('Authorization', `Bearer ${teacher2Token}`)
      .expect(200);

    const foundByT2Before = resT2Before.body.find((lp: any) => lp.id === lessonPlanId);
    expect(foundByT2Before).toBeUndefined();

    // 3. Admin approves the lesson plan
    await request(app.getHttpServer())
      .post(`/api/v1/curriculum/lesson-plans/${lessonPlanId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    // 4. Teacher 2 queries again -> now visible because it has been approved!
    const resT2After = await request(app.getHttpServer())
      .get('/api/v1/curriculum/lesson-plans')
      .set('Authorization', `Bearer ${teacher2Token}`)
      .expect(200);

    const foundByT2After = resT2After.body.find((lp: any) => lp.id === lessonPlanId);
    expect(foundByT2After).toBeDefined();
    expect(foundByT2After.status).toBe('approved');
  });

  // =========================================================================
  // TC-070: Học sinh chỉ thấy tài liệu lớp mình
  // =========================================================================
  it('TC-070: Học sinh lớp A chỉ thấy tài liệu lớp A; gọi API tài liệu lớp B bị 403 Forbidden', async () => {
    // 1. Create published material for Class 1
    const resMatClass1 = await request(app.getHttpServer())
      .post('/api/v1/curriculum/materials')
      .set('Authorization', `Bearer ${teacher1Token}`)
      .send({
        class_id: class1Id,
        type: 'worksheet',
        title: 'Phiếu bài tập từ vựng Class 1',
        body: 'Bài tập nối từ vựng theo chủ đề gia đình',
      })
      .expect(201);

    const matId = resMatClass1.body.id;

    // 2. Student 1 (enrolled in Class 1) requests Class 1 materials -> HTTP 200 OK
    const resS1 = await request(app.getHttpServer())
      .get(`/api/v1/curriculum/materials/class/${class1Id}`)
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(200);

    expect(resS1.body.some((m: any) => m.id === matId)).toBe(true);

    // 3. Student 3 (enrolled in Class 2, NOT in Class 1) requests Class 1 materials -> HTTP 403 Forbidden
    const resS3 = await request(app.getHttpServer())
      .get(`/api/v1/curriculum/materials/class/${class1Id}`)
      .set('Authorization', `Bearer ${student3Token}`)
      .expect(403);

    expect(resS3.body.message).toContain('không có quyền truy cập');
  });

  // =========================================================================
  // TC-071: Tài liệu bản quyền bên thứ ba không gửi cho AI
  // =========================================================================
  it('TC-071: Tài liệu bản quyền bên thứ ba bị chặn gửi cho AI với mã 400', async () => {
    // 1. Create a file with copyright_source = 'third_party'
    const thirdPartyFile = await prisma.files.create({
      data: {
        branch_id: branchId,
        storage_key: 'materials/oxford_grammar.pdf',
        original_name: 'Oxford_Grammar_Book.pdf',
        mime_type: 'application/pdf',
        size_bytes: BigInt(2048),
        purpose: 'material',
        copyright_source: 'third_party',
      },
    });

    // 2. Create material linked to this third_party file
    const matThirdParty = await prisma.materials.create({
      data: {
        branch_id: branchId,
        class_id: class1Id,
        type: 'document',
        title: 'Tài liệu ngữ pháp xuất bản bởi Oxford',
        file_id: thirdPartyFile.id,
        created_by: teacher1UserId,
      },
    });

    // 3. Teacher triggers AI generate -> blocked with 400
    const resBlocked = await request(app.getHttpServer())
      .post(`/api/v1/curriculum/materials/${matThirdParty.id}/ai-generate`)
      .set('Authorization', `Bearer ${teacher1Token}`)
      .expect(400);

    expect(resBlocked.body.message).toContain('bên thứ ba không được phép gửi cho AI');

    // 4. Create center-owned file
    const centerFile = await prisma.files.create({
      data: {
        branch_id: branchId,
        storage_key: 'materials/internal_handout.pdf',
        original_name: 'CoreLink_Handout.pdf',
        mime_type: 'application/pdf',
        size_bytes: BigInt(2048),
        purpose: 'material',
        copyright_source: 'center',
      },
    });

    const matCenter = await prisma.materials.create({
      data: {
        branch_id: branchId,
        class_id: class1Id,
        type: 'worksheet',
        title: 'Phiếu học tập do trung tâm biên soạn',
        file_id: centerFile.id,
        created_by: teacher1UserId,
      },
    });

    // 5. Trigger AI generate on center material -> succeeds
    const resAllowed = await request(app.getHttpServer())
      .post(`/api/v1/curriculum/materials/${matCenter.id}/ai-generate`)
      .set('Authorization', `Bearer ${teacher1Token}`)
      .expect(201);

    expect(resAllowed.body.success).toBe(true);
    expect(resAllowed.body.generated_content).toBeDefined();
  });

  // =========================================================================
  // TC-099: Đánh giá nhanh cả lớp (15 học sinh dưới 3 phút)
  // =========================================================================
  it('TC-099: Giáo viên đánh giá nhanh 15 học sinh theo mẫu nhận xét, phụ huynh thấy kết quả', async () => {
    const startTime = Date.now();

    // Prepare 15 students evaluation payload
    const batchList = [
      {
        student_id: student1Id,
        attitude: 5,
        focus: 5,
        progress: 5,
        comment: 'Tiếp thu bài rất nhanh, hăng hái phát biểu xây dựng bài',
        template_code: 'EXCELLENT',
      },
      {
        student_id: student2Id,
        attitude: 4,
        focus: 4,
        progress: 5,
        comment: 'Chăm chỉ làm bài tập về nhà, phát âm có nhiều tiến bộ',
        template_code: 'GOOD_PROGRESS',
      },
    ];

    // Add dummy student records if needed to simulate full 15 students
    for (let i = 3; i <= 15; i++) {
      batchList.push({
        student_id: student1Id, // reuse valid student ID for batch benchmark
        attitude: 4,
        focus: 4,
        progress: 4,
        comment: `Đạt yêu cầu bài học buổi số ${i}`,
        template_code: 'SATISFACTORY',
      });
    }

    const resBatch = await request(app.getHttpServer())
      .post('/api/v1/evaluations/batch')
      .set('Authorization', `Bearer ${teacher1Token}`)
      .send({
        class_id: class1Id,
        period: 'session',
        evaluations: batchList,
      })
      .expect(201);

    const elapsedMs = Date.now() - startTime;
    expect(resBatch.body.count).toBe(15);
    expect(elapsedMs).toBeLessThan(180000); // Well under 3 minutes (180s)

    // Parent views evaluation for student 1
    const resParent = await request(app.getHttpServer())
      .get(`/api/v1/evaluations/student/${student1Id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(resParent.body.length).toBeGreaterThan(0);
    expect(
      resParent.body.some((e: any) =>
        e.comment?.includes('Tiếp thu bài rất nhanh'),
      ),
    ).toBe(true);
  });

  // =========================================================================
  // TC-100: Tiến độ cập nhật hằng ngày (25% lộ trình, xu hướng điểm, chuyên cần)
  // =========================================================================
  it('TC-100: Tiến độ cập nhật đầy đủ % lộ trình (6/24 = 25%), xu hướng điểm và chuyên cần', async () => {
    // Record an attendance record
    const firstSession = await prisma.class_sessions.findFirst({
      where: { class_id: class1Id },
      orderBy: { session_no: 'asc' },
    });

    await prisma.attendance.create({
      data: {
        session_id: firstSession!.id,
        student_id: student1Id,
        status: 'present',
        method: 'teacher',
      },
    });

    // Parent queries student progress
    const res = await request(app.getHttpServer())
      .get(`/api/v1/progress/student/${student1Id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(res.body.progress_percent).toBe(25); // 6 completed / 24 total = 25%
    expect(res.body.completed_lessons).toBe(6);
    expect(res.body.total_lessons).toBe(24);
    expect(res.body.attendance_rate).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.score_trend_8weeks)).toBe(true);
  });

  // =========================================================================
  // TC-103: Tổng quan của con khớp dữ liệu giáo viên nhập (điểm 8.5, tải < 2s)
  // =========================================================================
  it('TC-103: Phụ huynh mở tổng quan hiện đúng điểm 8.5 và nhận xét giáo viên, phản hồi dưới 2 giây', async () => {
    // 1. Create assignment & attempt with score 8.5 for Student 1
    const asg = await prisma.assignments.create({
      data: {
        branch_id: branchId,
        title: 'COM-ASG-STEP9 Kiểm tra giữa kỳ Unit 4',
        kind: 'test',
        due_at: new Date(Date.now() + 86400000),
        created_by: teacher1UserId,
      },
    });

    await prisma.attempts.create({
      data: {
        assignment_id: asg.id,
        student_id: student1Id,
        attempt_no: 1,
        started_at: new Date(),
        submitted_at: new Date(),
        auto_score: 8.5,
        final_score: 8.5, // GV nhập điểm 8.5
        max_score: 10,
        graded_by: teacher1UserId,
        graded_at: new Date(),
      },
    });

    // 2. Parent opens overview
    const startTime = Date.now();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/parent/overview/${student1Id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    const clientLoadTime = Date.now() - startTime;
    expect(clientLoadTime).toBeLessThan(2000); // Tải dưới 2 giây
    expect(res.body.recent_score).toBe(8.5); // Khớp chuẩn xác điểm 8.5
    expect(res.body.student.full_name).toContain('Lê Minh Khôi');
    expect(res.body.latest_evaluation).toBeDefined();
  });

  // =========================================================================
  // TC-104: Tóm tắt ngày lúc 20:00 (có học và nộp bài -> nhận tóm tắt đúng dữ kiện)
  // =========================================================================
  it('TC-104: Tác vụ 20:00 dựng daily_summaries đúng sự kiện trong ngày (điểm danh, điểm 8.5)', async () => {
    // Student 1 has attendance today and submitted attempt 8.5 today
    const resJob = await request(app.getHttpServer())
      .post('/api/v1/daily-summaries/run-job')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ target_date: new Date().toISOString() })
      .expect(201);

    expect(resJob.body.success).toBe(true);
    expect(resJob.body.generated_count).toBeGreaterThan(0);

    // Parent fetches daily summaries for Student 1
    const resSummaries = await request(app.getHttpServer())
      .get(`/api/v1/daily-summaries/student/${student1Id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(resSummaries.body.length).toBeGreaterThan(0);
    const summary = resSummaries.body[0];
    expect(summary.text_vi).toContain('Lê Minh Khôi');
    expect(summary.text_vi).toContain('8.5'); // Strict adherence to facts: mentions the 8.5 score
  });

  // =========================================================================
  // TC-105: Ngày không hoạt động thì không gửi
  // =========================================================================
  it('TC-105: Học sinh không có hoạt động trong ngày thì tác vụ 20:00 bỏ qua, không gửi tóm tắt', async () => {
    // Run job for a past quiet date (e.g. 2026-01-01) where no student had activities
    const quietDate = '2026-01-01';

    const resJob = await request(app.getHttpServer())
      .post('/api/v1/daily-summaries/run-job')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ target_date: quietDate })
      .expect(201);

    expect(resJob.body.generated_count).toBe(0);
    expect(resJob.body.skipped_count).toBeGreaterThan(0);

    // Verify database has no summary for student 1 on that date
    const checkDb = await prisma.daily_summaries.findFirst({
      where: {
        student_id: student1Id,
        summary_date: new Date(quietDate),
      },
    });
    expect(checkDb).toBeNull();
  });

  // =========================================================================
  // TC-106: Chuyển giữa các con
  // =========================================================================
  it('TC-106: Phụ huynh có 2 con chuyển nhanh giữa con A và con B, dữ liệu đổi tương ứng', async () => {
    // 1. Parent retrieves their children list
    const resChildren = await request(app.getHttpServer())
      .get('/api/v1/parent/children')
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(resChildren.body.length).toBe(2);
    const names = resChildren.body.map((c: any) => c.full_name);
    expect(names).toContain('Lê Minh Khôi (Con A)');
    expect(names).toContain('Lê Bảo Ngọc (Con B)');

    // 2. Select Con A -> returns Con A data
    const resChildA = await request(app.getHttpServer())
      .get(`/api/v1/parent/overview/${student1Id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(resChildA.body.student.id).toBe(student1Id);
    expect(resChildA.body.student.full_name).toContain('Con A');

    // 3. Switch to Con B -> returns Con B data
    const resChildB = await request(app.getHttpServer())
      .get(`/api/v1/parent/overview/${student2Id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    expect(resChildB.body.student.id).toBe(student2Id);
    expect(resChildB.body.student.full_name).toContain('Con B');
  });
});
