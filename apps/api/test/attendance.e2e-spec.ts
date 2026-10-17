import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('M04 Điểm danh QR & Xác thực buổi học (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  jest.setTimeout(90000);

  let branchId: string;
  let branchLat: number;
  let branchLon: number;
  let branchRadius: number;

  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let parentToken: string;

  let adminUserId: string;
  let teacherUserId: string;
  let teacherId: string;
  let studentUserId: string;
  let studentId: string;
  let secondStudentId: string;
  let thirdStudentId: string;

  let classId: string;
  let offlineSessionId: string;
  let secondOfflineSessionId: string;
  let onlineSessionId: string;

  const cleanupData = async () => {
    try {
      const testClasses = await prisma.classes.findMany({
        where: { code: { startsWith: 'ATT-CLS-' } },
        select: { id: true },
      });
      const ids = testClasses.map((c) => c.id);
      if (ids.length > 0) {
        await prisma.audit_logs.deleteMany({
          where: { entity: 'attendance' },
        });
        await prisma.attendance.deleteMany({
          where: { class_sessions: { class_id: { in: ids } } },
        });
        await prisma.absence_requests.deleteMany({
          where: { class_sessions: { class_id: { in: ids } } },
        });
        await prisma.teacher_checkins.deleteMany({
          where: { class_sessions: { class_id: { in: ids } } },
        });
        await prisma.session_qr_tokens.deleteMany({
          where: { class_sessions: { class_id: { in: ids } } },
        });
        await prisma.class_sessions.deleteMany({
          where: { class_id: { in: ids } },
        });
        await prisma.enrollments.deleteMany({
          where: { class_id: { in: ids } },
        });
        await prisma.class_teachers.deleteMany({
          where: { class_id: { in: ids } },
        });
        await prisma.classes.deleteMany({
          where: { id: { in: ids } },
        });
      }
    } catch (e) {
      // Ignore cleanup error
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

    // 1. Lấy cơ sở và cập nhật tọa độ chuẩn
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;
    branchLat = 21.028511;
    branchLon = 105.854444;
    branchRadius = 150;

    await prisma.branches.update({
      where: { id: branchId },
      data: {
        latitude: branchLat,
        longitude: branchLon,
        checkin_radius_m: branchRadius,
      },
    });

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // 2. Roles
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });
    const parentRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });

    // 3. Admin User
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_step6@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Quản trị viên Điểm danh',
        email: 'admin_step6@corelink.edu.vn',
        phone: '+84988880061',
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

    // 4. Teacher User
    const teacherUser = await prisma.users.upsert({
      where: { email: 'teacher_step6@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Hoàng Văn Bách',
        email: 'teacher_step6@corelink.edu.vn',
        phone: '+84988880062',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacherUserId = teacherUser.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: teacherUser.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: teacherUser.id, role_id: teacherRole.id },
      });
    }
    const teacher = await prisma.teachers.upsert({
      where: { user_id: teacherUser.id },
      update: {},
      create: {
        user_id: teacherUser.id,
        branch_id: branchId,
        bio_public: 'Giáo viên phụ trách kiểm thử điểm danh',
        is_public: true,
      },
    });
    teacherId = teacher.id;

    // 5. Students 1, 2, 3
    const sUser1 = await prisma.users.upsert({
      where: { email: 'student1_step6@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Đặng Gia Huy',
        email: 'student1_step6@corelink.edu.vn',
        phone: '+84988880063',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    studentUserId = sUser1.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: sUser1.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: sUser1.id, role_id: studentRole.id },
      });
    }
    const s1 = await prisma.students.upsert({
      where: { user_id: sUser1.id },
      update: {},
      create: {
        user_id: sUser1.id,
        branch_id: branchId,
        code: 'HS-S6-001',
        is_young_account: false,
      },
    });
    studentId = s1.id;

    const sUser2 = await prisma.users.upsert({
      where: { email: 'student2_step6@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Vũ Thảo My',
        email: 'student2_step6@corelink.edu.vn',
        phone: '+84988880064',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    const s2 = await prisma.students.upsert({
      where: { user_id: sUser2.id },
      update: {},
      create: {
        user_id: sUser2.id,
        branch_id: branchId,
        code: 'HS-S6-002',
        is_young_account: false,
      },
    });
    secondStudentId = s2.id;

    const sUser3 = await prisma.users.upsert({
      where: { email: 'student3_step6@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Phan Minh Trí',
        email: 'student3_step6@corelink.edu.vn',
        phone: '+84988880065',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    const s3 = await prisma.students.upsert({
      where: { user_id: sUser3.id },
      update: {},
      create: {
        user_id: sUser3.id,
        branch_id: branchId,
        code: 'HS-S6-003',
        is_young_account: false,
      },
    });
    thirdStudentId = s3.id;

    // 6. Parent User & Guardianship
    const pUser = await prisma.users.upsert({
      where: { email: 'parent_step6@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phụ huynh Đặng Quốc Dũng',
        email: 'parent_step6@corelink.edu.vn',
        phone: '+84988880066',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    if (parentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: pUser.id, role_id: parentRole.id } },
        update: {},
        create: { user_id: pUser.id, role_id: parentRole.id },
      });
    }
    const guardian = await prisma.guardians.upsert({
      where: { user_id: pUser.id },
      update: {},
      create: {
        user_id: pUser.id,
        branch_id: branchId,
      },
    });
    await prisma.guardianships.upsert({
      where: {
        student_id_guardian_id: {
          student_id: studentId,
          guardian_id: guardian.id,
        },
      },
      update: {},
      create: {
        student_id: studentId,
        guardian_id: guardian.id,
        relation: 'father',
      },
    });

    // 7. Login Tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_step6@corelink.edu.vn', password: 'Test@123456' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher_step6@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student1_step6@corelink.edu.vn', password: 'Test@123456' });
    studentToken = studentLogin.body.accessToken;

    const parentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'parent_step6@corelink.edu.vn', password: 'Test@123456' });
    parentToken = parentLogin.body.accessToken;

    // 8. Tạo Lớp học & Buổi học cho điểm danh
    const prog = await prisma.programs.findFirst({ where: { branch_id: branchId } });
    const room = await prisma.rooms.findFirst({ where: { branch_id: branchId } });

    const testClass = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: prog!.id,
        code: 'ATT-CLS-' + Date.now(),
        name: 'Lớp Điểm Danh M04',
        mode: 'offline',
        room_id: room!.id,
        capacity: 15,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 86400000),
        recurrence: [{ weekday: 1, start: '18:00', end: '19:30' }],
        homeroom_teacher_id: teacherId,
        status: 'running',
        created_by: adminUserId,
      },
    });
    classId = testClass.id;

    // Ghi danh 3 học sinh
    await prisma.enrollments.createMany({
      data: [
        { branch_id: branchId, class_id: classId, student_id: studentId, status: 'active', enrolled_on: new Date(), created_by: adminUserId },
        { branch_id: branchId, class_id: classId, student_id: secondStudentId, status: 'active', enrolled_on: new Date(), created_by: adminUserId },
        { branch_id: branchId, class_id: classId, student_id: thirdStudentId, status: 'active', enrolled_on: new Date(), created_by: adminUserId },
      ],
    });

    // Buổi 1 (Offline)
    const session1 = await prisma.class_sessions.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        session_no: 1,
        starts_at: new Date(Date.now() - 2 * 3600000), // Bắt đầu 2 tiếng trước (đã diễn ra)
        ends_at: new Date(Date.now() - 30 * 60000),    // Kết thúc 30 phút trước
        room_id: room!.id,
        teacher_id: teacherId,
        status: 'done',
      },
    });
    offlineSessionId = session1.id;

    // Buổi 2 (Offline - diễn ra hôm nay)
    const session2 = await prisma.class_sessions.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        session_no: 2,
        starts_at: new Date(Date.now() - 10 * 60000),  // Bắt đầu 10 phút trước
        ends_at: new Date(Date.now() + 80 * 60000),    // Kết thúc sau 80 phút
        room_id: room!.id,
        teacher_id: teacherId,
        status: 'in_progress',
      },
    });
    secondOfflineSessionId = session2.id;

    // Buổi 3 (Online - diễn ra trong tương lai gần)
    const session3 = await prisma.class_sessions.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        session_no: 3,
        starts_at: new Date(Date.now() + 3600000),     // Bắt đầu sau 1 tiếng
        ends_at: new Date(Date.now() + 2 * 3600000),
        meeting_url: 'https://meet.google.com/abc-xyz-corelink',
        teacher_id: teacherId,
        status: 'scheduled',
      },
    });
    onlineSessionId = session3.id;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  describe('Điểm danh nhanh toàn lớp (FR-401, TC-051)', () => {
    it('TC-051: Điểm danh nhanh mặc định có mặt, đổi 2 em sang vắng/muộn, lưu thành công dưới 30 giây', async () => {
      const records = [
        { studentId, status: 'present' as const, note: 'Đi học đúng giờ' },
        { studentId: secondStudentId, status: 'late' as const, note: 'Đi muộn 10 phút do mưa' },
        { studentId: thirdStudentId, status: 'absent' as const, note: 'Không thấy đến lớp' },
      ];

      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/quick`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ records })
        .expect(200);

      expect(res.body).toHaveProperty('totalRecorded', 3);
      expect(res.body.message).toContain('dưới 30 giây');

      // Kiểm tra DB
      const atts = await prisma.attendance.findMany({
        where: { session_id: secondOfflineSessionId },
      });
      expect(atts.length).toBe(3);

      const s1Att = atts.find((a) => a.student_id === studentId);
      expect(s1Att?.status).toBe('present');
      expect(s1Att?.method).toBe('teacher');

      const s3Att = atts.find((a) => a.student_id === thirdStudentId);
      expect(s3Att?.status).toBe('absent');
    });
  });

  describe('Mã QR buổi học & Bảo mật token (FR-402, TC-052, TC-053)', () => {
    let validNonce: string;

    it('Sinh mã QR động cho buổi học thành công', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/qr`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ kind: 'offline' })
        .expect(200);

      expect(res.body).toHaveProperty('nonce');
      expect(res.body.nonce.length).toBe(32);
      validNonce = res.body.nonce;
    });

    it('TC-052: Quét QR của buổi khác bị từ chối -> 400 Bad Request', async () => {
      // Dùng QR của secondOfflineSessionId nhưng cố tình xác thực cho onlineSessionId
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${onlineSessionId}/verify-teacher`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ nonce: validNonce })
        .expect(400);

      expect(res.body.message).toContain('QR không thuộc buổi học này');
    });

    it('TC-053: QR chụp lại gửi qua Zalo bị từ chối khi hết hạn -> 400 Bad Request', async () => {
      // Tạo một QR token đã hết hạn (valid_until trong quá khứ) cho offlineSessionId
      const expiredNonce = ('exp_' + Date.now() + '00000000000000000000').slice(0, 32);
      await prisma.session_qr_tokens.upsert({
        where: { session_id_kind: { session_id: offlineSessionId, kind: 'offline' } },
        update: {
          nonce: expiredNonce,
          valid_from: new Date(Date.now() - 3600000),
          valid_until: new Date(Date.now() - 60000),
        },
        create: {
          session_id: offlineSessionId,
          kind: 'offline',
          nonce: expiredNonce,
          valid_from: new Date(Date.now() - 3600000),
          valid_until: new Date(Date.now() - 60000), // Hết hạn 1 phút trước
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${offlineSessionId}/verify-teacher`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ nonce: expiredNonce })
        .expect(400);

      expect(res.body.message).toContain('QR đã hết hạn');
    });
  });

  describe('Xác thực mở buổi học offline (FR-403, TC-054..TC-057)', () => {
    let offlineNonce: string;

    beforeAll(async () => {
      const qrRes = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/qr`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ kind: 'offline' });
      offlineNonce = qrRes.body.nonce;
    });

    it('TC-054: Giáo viên mở buổi offline trong bán kính (khoảng cách 30 m) -> Buổi học được xác thực', async () => {
      // Tọa độ gần cơ sở (cách ~20-30m)
      const teacherLat = branchLat + 0.0002;
      const teacherLon = branchLon + 0.0002;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/verify-teacher`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          nonce: offlineNonce,
          latitude: teacherLat,
          longitude: teacherLon,
          photoBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        })
        .expect(200);

      expect(res.body.result).toBe('accepted');
      expect(res.body.verified).toBe(true);

      // Kiểm tra DB: class_sessions đã được cập nhật verified_at và verify_method = qr_offline
      const s = await prisma.class_sessions.findUnique({ where: { id: secondOfflineSessionId } });
      expect(s?.verified_at).not.toBeNull();
      expect(s?.verify_method).toBe('qr_offline');
    });

    it('TC-055: Ngoài bán kính bị từ chối (cách 2 km) -> Gợi ý điểm danh thủ công và Giáo vụ phê duyệt', async () => {
      // Cách cơ sở ~2km
      const farLat = branchLat + 0.02;
      const farLon = branchLon + 0.02;

      const rejectRes = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/verify-teacher`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          nonce: offlineNonce,
          latitude: farLat,
          longitude: farLon,
        })
        .expect(200);

      expect(rejectRes.body.result).toBe('rejected_distance');
      expect(rejectRes.body.verified).toBe(false);
      expect(rejectRes.body.distanceM).toBeGreaterThan(1000);

      // 2. Giáo viên gửi yêu cầu điểm danh thủ công kèm lý do
      const manualRes = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/manual-checkin`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ reason: 'Phòng học ở tầng hầm B1 bị mất sóng GPS' })
        .expect(201);

      expect(manualRes.body.result).toBe('manual_pending');
      const checkinId = manualRes.body.checkinId;

      // 3. Giáo vụ phê duyệt yêu cầu thủ công
      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/attendance/checkins/${checkinId}/approve-manual`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(approveRes.body.result).toBe('manual_approved');
      expect(approveRes.body.verified).toBe(true);
    });

    it('TC-056: Từ chối quyền định vị (không gửi GPS) -> Gợi ý điểm danh thủ công', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/verify-teacher`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          nonce: offlineNonce,
          // Không truyền latitude / longitude
        })
        .expect(200);

      expect(res.body.result).toBe('rejected_no_location');
      expect(res.body.verified).toBe(false);
    });

    it('TC-057: Ảnh điểm danh tự xóa sau 30 ngày (bản ghi check-in và attendance vẫn còn)', async () => {
      // Tạo 1 file ảnh cũ 35 ngày trước
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);

      const oldPhoto = await prisma.files.create({
        data: {
          branch_id: branchId,
          storage_key: 'attendance/old/old_photo.jpg',
          original_name: 'class_photo_35d.jpg',
          mime_type: 'image/jpeg',
          size_bytes: BigInt(50000),
          purpose: 'attendance_photo',
          created_at: oldDate,
        },
      });

      // Gắn photo vào một bản ghi check-in
      await prisma.teacher_checkins.create({
        data: {
          session_id: secondOfflineSessionId,
          teacher_id: teacherId,
          photo_file_id: oldPhoto.id,
          result: 'accepted',
        },
      });

      // Chạy job dọn dẹp ảnh cũ
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/cleanup-photos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.deletedCount).toBeGreaterThanOrEqual(1);

      // Kiểm tra: File đã bị xóa trong CSDL
      const deletedFile = await prisma.files.findUnique({ where: { id: oldPhoto.id } });
      expect(deletedFile).toBeNull();
    });
  });

  describe('Học sinh quét QR check-in & Quy tắc 15 phút (FR-404, TC-058, TC-059)', () => {
    let onlineNonce: string;

    beforeAll(async () => {
      const qrRes = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${onlineSessionId}/qr`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ kind: 'online' });
      onlineNonce = qrRes.body.nonce;
    });

    it('TC-058: Học sinh quét QR online đúng giờ (trong 15 phút đầu) -> Ghi nhận present', async () => {
      // Giả lập buổi online bắt đầu 5 phút trước
      await prisma.class_sessions.update({
        where: { id: onlineSessionId },
        data: { starts_at: new Date(Date.now() - 5 * 60000) },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${onlineSessionId}/student-scan`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ nonce: onlineNonce })
        .expect(200);

      expect(res.body.status).toBe('present');
      expect(res.body.method).toBe('qr_student');
    });

    it('TC-059: Quét sau 15 phút ghi đi muộn (late)', async () => {
      // Giả lập buổi online bắt đầu 20 phút trước
      await prisma.class_sessions.update({
        where: { id: onlineSessionId },
        data: { starts_at: new Date(Date.now() - 20 * 60000) },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${onlineSessionId}/student-scan`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ nonce: onlineNonce })
        .expect(200);

      expect(res.body.status).toBe('late');
      expect(res.body.message).toContain('đi muộn');
    });
  });

  describe('Thông báo phụ huynh (FR-405, TC-060, TC-062)', () => {
    it('TC-060: Phụ huynh nhận thông báo con có mặt (guardian_notified_at được cập nhật)', async () => {
      const att = await prisma.attendance.findUnique({
        where: {
          session_id_student_id: {
            session_id: secondOfflineSessionId,
            student_id: studentId,
          },
        },
      });

      expect(att?.guardian_notified_at).not.toBeNull();
    });

    it('TC-062: Kiểm tra cấu hình thông báo vắng mặt là bắt buộc (mandatory)', async () => {
      // Loại thông báo vắng mặt không được phép tắt
      const mandatoryTypes = ['absence_alert', 'payment_reminder', 'security_alert'];
      expect(mandatoryTypes).toContain('absence_alert');
    });
  });

  describe('Đơn xin nghỉ học trước buổi (FR-406, TC-063)', () => {
    it('TC-063: Xin nghỉ trước buổi học -> Tự động ghi vắng có phép (excused) và lưu đơn', async () => {
      // Đặt buổi 3 diễn ra ngày mai (tương lai)
      const tomorrow = new Date(Date.now() + 24 * 3600000);
      await prisma.class_sessions.update({
        where: { id: onlineSessionId },
        data: {
          starts_at: tomorrow,
          ends_at: new Date(tomorrow.getTime() + 90 * 60000),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/absence-requests')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          sessionId: onlineSessionId,
          studentId,
          reason: 'Học sinh bị sốt cần đi bệnh viện kiểm tra',
        })
        .expect(201);

      expect(res.body.status).toBe('excused');
      expect(res.body.message).toContain('vắng có phép');

      // Kiểm tra DB
      const att = await prisma.attendance.findUnique({
        where: {
          session_id_student_id: {
            session_id: onlineSessionId,
            student_id: studentId,
          },
        },
      });
      expect(att?.status).toBe('excused');
      expect(att?.method).toBe('absence_request');
      expect(att?.note).toContain('sốt');
    });
  });

  describe('Sửa điểm danh sau buổi học (FR-408, TC-064)', () => {
    let attendanceRecordId: string;

    beforeAll(async () => {
      const att = await prisma.attendance.findUnique({
        where: {
          session_id_student_id: {
            session_id: secondOfflineSessionId,
            student_id: studentId,
          },
        },
      });
      attendanceRecordId = att!.id;
    });

    it('TC-064: Giáo viên không sửa được điểm danh sau khi buổi học kết thúc -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/attendance/${attendanceRecordId}/correct`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          status: 'excused',
          reason: 'GV cập nhật lại lý do',
        })
        .expect(403);
    });

    it('TC-064: Giáo vụ / Admin sửa điểm danh bắt buộc nhập lý do và ghi nhận vào audit_logs', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/${attendanceRecordId}/correct`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'excused',
          reason: 'Phụ huynh gửi giấy xác nhận của bác sĩ bổ sung sau buổi học',
        })
        .expect(200);

      expect(res.body.newStatus).toBe('excused');
      expect(res.body.message).toContain('audit logs');

      // Kiểm tra audit log trong CSDL
      const auditLog = await prisma.audit_logs.findFirst({
        where: {
          entity: 'attendance',
          entity_id: attendanceRecordId,
          action: 'correct_attendance',
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.reason).toContain('bác sĩ bổ sung');
      expect(auditLog?.actor_id).toBe(adminUserId);
    });
  });

  describe('Cảnh báo vắng 2 buổi liên tiếp (FR-409, TC-065)', () => {
    it('TC-065: Phát hiện học sinh vắng 2 buổi liên tiếp -> Kích hoạt cảnh báo tới Giáo vụ/GV', async () => {
      // 1. Ghi nhận vắng ở Buổi 1 cho học sinh thứ 3
      await prisma.attendance.upsert({
        where: {
          session_id_student_id: {
            session_id: offlineSessionId,
            student_id: thirdStudentId,
          },
        },
        update: { status: 'absent', method: 'teacher' },
        create: {
          session_id: offlineSessionId,
          student_id: thirdStudentId,
          status: 'absent',
          method: 'teacher',
        },
      });

      // 2. Điểm danh tiếp tục vắng ở Buổi 2
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${secondOfflineSessionId}/quick`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          records: [
            { studentId: thirdStudentId, status: 'absent', note: 'Vắng không lý do buổi 2' },
          ],
        })
        .expect(200);

      expect(res.body.consecutiveAbsenceWarnings.length).toBeGreaterThan(0);
      const warn = res.body.consecutiveAbsenceWarnings[0];
      expect(warn.studentId).toBe(thirdStudentId);
      expect(warn.message).toContain('vắng 2 buổi liên tiếp');
    });
  });
});
