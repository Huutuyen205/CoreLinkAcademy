import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

describe('M09 Trao đổi & M10 Thông báo (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let notificationsService: NotificationsService;
  jest.setTimeout(90000);

  let branchId: string;
  let adminToken: string;
  let teacherToken: string;
  let otherTeacherToken: string;
  let parentToken: string;
  let studentToken: string;
  let otherStudentToken: string;

  let adminUserId: string;
  let teacherUserId: string;
  let otherTeacherUserId: string;
  let parentUserId: string;
  let studentUserId: string;
  let otherStudentUserId: string;

  let classId: string;
  let studentId: string;
  let guardianId: string;
  let teacherId: string;
  let otherTeacherId: string;

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

  const cleanupData = async () => {
    try {
      await prisma.$executeRawUnsafe('UPDATE conversations SET locked_at = NULL');
      await prisma.$executeRawUnsafe('DELETE FROM message_reports');
      await prisma.$executeRawUnsafe('DELETE FROM chat_access_requests');
      await prisma.$executeRawUnsafe('DELETE FROM push_subscriptions');
      await prisma.$executeRawUnsafe('DELETE FROM notification_preferences');
      await prisma.$executeRawUnsafe('DELETE FROM notifications');
      await prisma.$executeRawUnsafe('DELETE FROM announcement_reads');
      await prisma.$executeRawUnsafe('DELETE FROM announcements');
    } catch (e) {
      console.error('CLEANUP_ERR:', e);
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
    notificationsService = app.get<NotificationsService>(NotificationsService);

    await cleanupData();

    // 1. Branch
    const branch = await prisma.branches.findFirst();
    branchId = branch!.id;

    const hash = await argon2.hash('Test@123456', { type: argon2.argon2id });

    // 2. Roles
    const adminRole = await prisma.roles.findUnique({ where: { code: 'admin' } });
    const teacherRole = await prisma.roles.findUnique({ where: { code: 'teacher' } });
    const studentRole = await prisma.roles.findUnique({ where: { code: 'student' } });
    const parentRole = await prisma.roles.findUnique({ where: { code: 'guardian' } });

    // 3. Admin User
    const adminUser = await prisma.users.upsert({
      where: { email: 'admin_step7@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Quản trị viên Hệ thống',
        email: 'admin_step7@corelink.edu.vn',
        phone: '+84988880071',
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

    // 4. Teacher 1 (Giảng dạy con)
    const tUser1 = await prisma.users.upsert({
      where: { email: 'teacher1_step7@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Cô Thu Thảo',
        email: 'teacher1_step7@corelink.edu.vn',
        phone: '+84988880072',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    teacherUserId = tUser1.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: tUser1.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: tUser1.id, role_id: teacherRole.id },
      });
    }
    const t1 = await prisma.teachers.upsert({
      where: { user_id: tUser1.id },
      update: {},
      create: {
        user_id: tUser1.id,
        branch_id: branchId,
      },
    });
    teacherId = t1.id;

    // 5. Teacher 2 (Không dạy con)
    const tUser2 = await prisma.users.upsert({
      where: { email: 'teacher2_step7@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Thầy Hoàng Nam',
        email: 'teacher2_step7@corelink.edu.vn',
        phone: '+84988880073',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    otherTeacherUserId = tUser2.id;
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: tUser2.id, role_id: teacherRole.id } },
        update: {},
        create: { user_id: tUser2.id, role_id: teacherRole.id },
      });
    }
    const t2 = await prisma.teachers.upsert({
      where: { user_id: tUser2.id },
      update: {},
      create: {
        user_id: tUser2.id,
        branch_id: branchId,
      },
    });
    otherTeacherId = t2.id;

    // 6. Student 1
    const sUser1 = await prisma.users.upsert({
      where: { email: 'student1_step7@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Nguyễn Văn An',
        email: 'student1_step7@corelink.edu.vn',
        phone: '+84988880074',
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
        code: 'HS-S7-001',
        is_young_account: false,
      },
    });
    studentId = s1.id;

    // 7. Student 2
    const sUser2 = await prisma.users.upsert({
      where: { email: 'student2_step7@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Học sinh Trần Bình Minh',
        email: 'student2_step7@corelink.edu.vn',
        phone: '+84988880075',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    otherStudentUserId = sUser2.id;
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: sUser2.id, role_id: studentRole.id } },
        update: {},
        create: { user_id: sUser2.id, role_id: studentRole.id },
      });
    }
    await prisma.students.upsert({
      where: { user_id: sUser2.id },
      update: {},
      create: {
        user_id: sUser2.id,
        branch_id: branchId,
        code: 'HS-S7-002',
        is_young_account: false,
      },
    });

    // 8. Parent of Student 1
    const pUser = await prisma.users.upsert({
      where: { email: 'parent_step7@corelink.edu.vn' },
      update: { password_hash: hash, status: 'active' },
      create: {
        branch_id: branchId,
        full_name: 'Phụ huynh Nguyễn Văn Hùng',
        email: 'parent_step7@corelink.edu.vn',
        phone: '+84988880076',
        password_hash: hash,
        must_change_password: false,
        status: 'active',
      },
    });
    parentUserId = pUser.id;
    if (parentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: pUser.id, role_id: parentRole.id } },
        update: {},
        create: { user_id: pUser.id, role_id: parentRole.id },
      });
    }
    const g = await prisma.guardians.upsert({
      where: { user_id: pUser.id },
      update: {},
      create: {
        user_id: pUser.id,
        branch_id: branchId,
      },
    });
    guardianId = g.id;

    await prisma.guardianships.upsert({
      where: {
        student_id_guardian_id: {
          student_id: studentId,
          guardian_id: guardianId,
        },
      },
      update: {},
      create: {
        student_id: studentId,
        guardian_id: guardianId,
        relation: 'father',
      },
    });

    // 9. Class Setup: Teacher 1 teaches Class 1, Student 1 is enrolled in Class 1
    const prog = await prisma.programs.findFirst();
    const room = await prisma.rooms.findFirst();

    const testClass = await prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: prog!.id,
        name: 'Lớp Tiếng Anh 10 - Giao tiếp',
        code: `COM-CLS-${Date.now()}`,
        mode: 'offline',
        room_id: room ? room.id : null,
        status: 'running',
        capacity: 25,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 86400000),
        recurrence: [{ weekday: 1, start: '18:00', end: '19:30' }],
        homeroom_teacher_id: teacherId,
        created_by: adminUserId,
      },
    });
    classId = testClass.id;

    await prisma.$executeRaw`INSERT IGNORE INTO class_teachers (class_id, teacher_id, role, from_date) VALUES (${classId}, ${teacherId}, 'main', CURDATE())`;

    await prisma.enrollments.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        student_id: studentId,
        status: 'active',
        enrolled_on: new Date(),
        created_by: adminUserId,
      },
    });

    // 10. Login Tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'admin_step7@corelink.edu.vn', password: 'Test@123456' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher1_step7@corelink.edu.vn', password: 'Test@123456' });
    teacherToken = teacherLogin.body.accessToken;

    const otherTeacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'teacher2_step7@corelink.edu.vn', password: 'Test@123456' });
    otherTeacherToken = otherTeacherLogin.body.accessToken;

    const parentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'parent_step7@corelink.edu.vn', password: 'Test@123456' });
    parentToken = parentLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student1_step7@corelink.edu.vn', password: 'Test@123456' });
    studentToken = studentLogin.body.accessToken;

    const otherStudentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ credential: 'student2_step7@corelink.edu.vn', password: 'Test@123456' });
    otherStudentToken = otherStudentLogin.body.accessToken;
  });

  afterAll(async () => {
    await cleanupData();
    await app.close();
  });

  describe('Chat 1-1 & RBAC phân quyền nhắn tin (M09, FR-901, FR-902)', () => {
    let parentTeacherConvId: string;
    let sentMessageId: string;

    it('TC-109: Phụ huynh nhắn giáo viên của con thành công kèm ảnh 3 MB, GV nhận và có trạng thái đã xem', async () => {
      // 1. Tạo hoặc lấy hội thoại giữa phụ huynh và giáo viên dạy con
      const convRes = await request(app.getHttpServer())
        .post('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          recipientId: teacherUserId,
          kind: 'guardian_teacher',
          studentId,
        })
        .expect(201);

      expect(convRes.body.id).toBeDefined();
      parentTeacherConvId = convRes.body.id;

      // 2. Gửi tin nhắn kèm ảnh 3 MB (3 * 1024 * 1024 bytes)
      const sendRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${parentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          body: 'Chào Cô Thảo, tôi gửi cô bảng điểm và phiếu bài tập cháu đã hoàn thành ở nhà.',
          attachments: [
            {
              name: 'bai_tap_anh_3mb.jpg',
              url: 'https://minio.corelink.edu.vn/chat/bai_tap_anh_3mb.jpg',
              size: 3 * 1024 * 1024,
            },
          ],
        })
        .expect(201);

      expect(sendRes.body.id).toBeDefined();
      sentMessageId = sendRes.body.id;

      // 3. Giáo viên mở hội thoại và bấm đánh dấu đã đọc
      await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${parentTeacherConvId}/read`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      // 4. Phụ huynh lấy danh sách tin nhắn -> tin nhắn có trạng thái đã xem (isRead = true)
      const fetchRes = await request(app.getHttpServer())
        .get(`/api/v1/communication/conversations/${parentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const targetMsg = fetchRes.body.messages.find((m: any) => m.id === sentMessageId);
      expect(targetMsg).toBeDefined();
      expect(targetMsg.isRead).toBe(true);
    });

    it('TC-110: Phụ huynh không nhắn được giáo viên không dạy con -> Trả 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          recipientId: otherTeacherUserId,
          kind: 'guardian_teacher',
          studentId,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('giáo viên đang trực tiếp giảng dạy con mình');
    });

    it('TC-111: File đính kèm quá 20 MB bị từ chối -> Trả 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${parentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          body: 'Gửi video bài tập',
          attachments: [
            {
              name: 'video_qua_nang_25mb.mp4',
              url: 'https://minio.corelink.edu.vn/chat/video_25mb.mp4',
              size: 25 * 1024 * 1024, // 25 MB
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('vượt quá giới hạn tối đa 20 MB');
    });

    it('TC-112: Không có thao tác xóa tin nhắn -> DELETE trả về 405 Method Not Allowed', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/communication/messages/${sentMessageId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(405);
      expect(res.body.message).toContain('không cho phép xóa tin nhắn');
    });

    it('TC-113: Sửa tin trong 5 phút giữ bản gốc; chặn sửa sau 5 phút', async () => {
      // 1. Gửi tin nhắn mới tinh
      const sendRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${parentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          body: 'Nội dung tin nhắn ban đầu cần chỉnh sửa',
        })
        .expect(201);

      const msgToEditId = sendRes.body.id;

      // 2. Sửa tin vừa gửi (trong vòng 5 phút) -> Thành công
      const editRes = await request(app.getHttpServer())
        .patch(`/api/v1/communication/messages/${msgToEditId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          body: 'Nội dung đã được chỉnh sửa bổ sung thông tin chi tiết.',
        })
        .expect(200);

      expect(editRes.body.body).toBe('Nội dung đã được chỉnh sửa bổ sung thông tin chi tiết.');
      expect(editRes.body.message_edits.length).toBeGreaterThan(0);

      // 3. Cố tình sửa tin khi đã quá 5 phút (giả lập bằng cách lùi created_at 6 phút trước trong MySQL)
      await prisma.$executeRawUnsafe(
        `UPDATE messages SET created_at = DATE_SUB(NOW(), INTERVAL 6 MINUTE) WHERE id = '${msgToEditId}'`
      );

      const lateEditRes = await request(app.getHttpServer())
        .patch(`/api/v1/communication/messages/${msgToEditId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          body: 'Cố tình sửa sau 6 phút',
        });

      expect(lateEditRes.status).toBe(400);
      expect(lateEditRes.body.message).toContain('trong vòng 5 phút');
    });

    it('TC-114: Ngoài khung giờ 7:00–21:00 thông báo không khẩn được hẹn giờ gửi 7:00 sáng', async () => {
      // Tạo thông báo kiểm tra logic giờ yên lặng
      const notif = await notificationsService.createNotification({
        userId: parentUserId,
        category: 'messages_chat',
        title: 'Tin nhắn lúc đêm khuya',
        body: 'Thầy gửi lời nhắn',
        isMandatory: false,
        isUrgent: false,
      });

      const currentHour = new Date().getHours();
      if (currentHour >= 21 || currentHour < 7) {
        expect(notif.scheduled_for).toBeDefined();
        expect(notif.scheduled_for!.getHours()).toBe(7);
      } else {
        expect(notif.pushed_at).toBeDefined();
      }
    });

    it('TC-115: Học sinh không nhắn được học sinh -> Trả 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          recipientId: otherStudentUserId,
          kind: 'student_teacher',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Học sinh không được phép nhắn tin trực tiếp với học sinh khác');
    });
  });

  describe('Phụ huynh yêu cầu xem chat 72h & Kiểm soát kiểm toán (FR-903, TC-116, TC-117)', () => {
    let studentTeacherConvId: string;
    let accessRequestId: string;

    beforeAll(async () => {
      // Tạo hội thoại giữa Học sinh 1 và Giáo viên 1
      const convRes = await request(app.getHttpServer())
        .post('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          recipientId: teacherUserId,
          kind: 'student_teacher',
          studentId,
        })
        .expect(201);
      studentTeacherConvId = convRes.body.id;

      // Học sinh gửi tin nhắn hỏi bài
      const sendRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${studentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          body: 'Cô ơi cho em hỏi câu số 4 trong đề cương với ạ.',
        });
      if (sendRes.status !== 201) {
        console.error('SEND_MSG_FAIL_DEBUG:', sendRes.status, sendRes.body);
      }
      expect(sendRes.status).toBe(201);
    });

    it('TC-116: Phụ huynh xin xem chat của con, Admin duyệt cấp quyền chỉ đọc trong 72h; Phụ huynh xem được nhưng không gửi được tin, ghi audit_logs', async () => {
      // 1. Phụ huynh nộp đơn xin xem chat
      const reqRes = await request(app.getHttpServer())
        .post('/api/v1/communication/chat-access-requests')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId,
          conversationId: studentTeacherConvId,
          reason: 'Gia đình muốn nắm bắt tình hình học tập và hỏi đáp bài vở của cháu với cô giáo.',
        })
        .expect(201);

      expect(reqRes.body.id).toBeDefined();
      accessRequestId = reqRes.body.id;

      // 2. Admin duyệt yêu cầu
      const decideRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/admin/chat-access-requests/${accessRequestId}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          approved: true,
          note: 'Phê duyệt quyền xem chỉ đọc trong 72 giờ.',
        })
        .expect(201);

      expect(decideRes.body.status).toBe('approved');
      expect(decideRes.body.expires_at).toBeDefined();

      // 3. Phụ huynh mở hội thoại xem thành công (chế độ isReadOnly = true)
      const viewRes = await request(app.getHttpServer())
        .get(`/api/v1/communication/conversations/${studentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(viewRes.body.isReadOnly).toBe(true);
      expect(viewRes.body.messages.length).toBeGreaterThan(0);

      // Kiểm tra có bản ghi kiểm toán audit_logs
      const audit = await prisma.audit_logs.findFirst({
        where: {
          action: 'guardian_view_chat_72h',
          entity_id: studentTeacherConvId,
        },
      });
      expect(audit).toBeDefined();

      // 4. Phụ huynh thử gửi tin trong hội thoại này -> Bị chặn 403 Forbidden (chỉ đọc)
      const sendRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${studentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          body: 'Phụ huynh cố tình gửi tin nhắn chen ngang cuộc trò chuyện.',
        });

      expect(sendRes.status).toBe(403);
      expect(sendRes.body.message).toContain('chỉ có quyền xem cuộc hội thoại này');
    });

    it('TC-117: Quyền xem tự thu hồi sau 72 giờ -> Hết hạn trả 403 Forbidden', async () => {
      // Giả lập quyền đã duyệt cách đây 73 giờ (đã hết hạn)
      await prisma.chat_access_requests.update({
        where: { id: accessRequestId },
        data: {
          expires_at: new Date(Date.now() - 60 * 60 * 1000), // hết hạn cách đây 1 giờ
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/communication/conversations/${studentTeacherConvId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Bạn không có quyền truy cập');
    });
  });

  describe('Báo cáo tin nhắn & Tạm khóa hội thoại (FR-904, TC-118)', () => {
    let convId: string;
    let msgId: string;

    beforeAll(async () => {
      const convRes = await request(app.getHttpServer())
        .post('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          recipientId: adminUserId,
          kind: 'guardian_staff',
        })
        .expect(201);
      convId = convRes.body.id;

      const msgRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ body: 'Tin nhắn cần báo cáo kiểm tra' })
        .expect(201);
      msgId = msgRes.body.id;
    });

    it('TC-118: Báo cáo tin nhắn không phù hợp -> Lưu message_reports, Admin tạm khóa hội thoại', async () => {
      // 1. Phụ huynh gửi báo cáo
      const repRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/messages/${msgId}/report`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          reason: 'Nội dung có biểu hiện không phù hợp với chuẩn mực sư phạm',
        })
        .expect(201);

      expect(repRes.body.success).toBe(true);

      const dbReport = await prisma.message_reports.findFirst({
        where: { message_id: msgId },
      });
      expect(dbReport).toBeDefined();
      expect(dbReport!.status).toBe('open');

      // 2. Admin tạm khóa cuộc hội thoại
      const lockRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/admin/conversations/${convId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locked: true,
          reason: 'Tạm khóa để xác minh báo cáo vi phạm tiêu chuẩn',
        })
        .expect(201);

      expect(lockRes.body.isLocked).toBe(true);

      // 3. Phụ huynh thử gửi tin nhắn mới vào hội thoại đã bị khóa -> Bị từ chối
      const sendRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          body: 'Em thử gửi thêm tin nhắn',
        });

      expect(sendRes.status).toBe(400);
      expect(sendRes.body.message).toContain('tạm khóa');
    });

    afterAll(async () => {
      if (convId) {
        await prisma.conversations.update({
          where: { id: convId },
          data: { locked_at: null },
        });
      }
    });
  });

  describe('Bảng tin lớp học & Danh sách đọc (FR-905, TC-119)', () => {
    let announcementId: string;

    it('TC-119: Giáo viên đăng thông báo bảng tin, phụ huynh bấm đã đọc, giáo viên thấy người chưa đọc và gửi nhắc lại', async () => {
      // 1. Giáo viên đăng bài lên bảng tin
      const annRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/classes/${classId}/announcements`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Kế hoạch kiểm tra giữa học kỳ 1',
          body: 'Cả lớp chuẩn bị ôn tập kỹ các bài học Unit 1 đến Unit 3 để làm bài kiểm tra vào tuần tới.',
        })
        .expect(201);

      expect(annRes.body.id).toBeDefined();
      announcementId = annRes.body.id;

      // 2. Phụ huynh xem và bấm "Đã đọc"
      await request(app.getHttpServer())
        .post(`/api/v1/communication/announcements/${announcementId}/read`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(201);

      // 3. Giáo viên kiểm tra danh sách người đã đọc
      const readersRes = await request(app.getHttpServer())
        .get(`/api/v1/communication/announcements/${announcementId}/readers`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(readersRes.body.readCount).toBeGreaterThanOrEqual(1);
      expect(readersRes.body.unreadCount).toBeGreaterThanOrEqual(1);

      // 4. Giáo viên gửi nhắc nhở tới những người chưa đọc
      const remindRes = await request(app.getHttpServer())
        .post(`/api/v1/communication/announcements/${announcementId}/remind`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      expect(remindRes.body.success).toBe(true);
      expect(remindRes.body.remindedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Thông báo Web Push & Tùy chọn (M10, FR-1001..1004, TC-121..TC-124)', () => {
    it('TC-121: Đăng ký Web Push trên Android Chrome thành công', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/push-subscription')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/android_token_test_121',
          p256dh: 'BNcRdreALRFXTkOOUHK18PeW5pX_android',
          auth: 'tBHItJI5svbpez7KI4CCXg_android',
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.endpointHash).toBeDefined();
    });

    it('TC-122: Đăng ký Web Push trên iPhone iOS Safari đã thêm ra màn hình chính', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/push-subscription')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          endpoint: 'https://web.push.apple.com/qDYzNjk1Yz_ios_token_test_122',
          p256dh: 'BNcRdreALRFXTkOOUHK18PeW5pX_ios',
          auth: 'tBHItJI5svbpez7KI4CCXg_ios',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('TC-123: Nút gửi thông báo thử nghiệm hoạt động thành công trong 30 giây', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/test-push')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('thành công trong vòng 30 giây');
      expect(res.body.notificationId).toBeDefined();
    });

    it('TC-124: Tắt thông báo tùy chọn; Chặn tắt các loại thông báo bắt buộc (vắng mặt, đổi lịch)', async () => {
      // 1. Tắt thông báo tùy chọn (bài tập mới) -> Thành công
      const optRes = await request(app.getHttpServer())
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'assignments_new',
          pushOn: false,
        })
        .expect(200);

      expect(optRes.body.push_on).toBe(false);

      // 2. Thử tắt thông báo bắt buộc: vắng mặt -> Trả 400 Bad Request
      const absenceRes = await request(app.getHttpServer())
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'attendance_absence',
          pushOn: false,
        });

      expect(absenceRes.status).toBe(400);
      expect(absenceRes.body.message).toContain('Không thể tắt thông báo bắt buộc');

      // 3. Thử tắt thông báo bắt buộc: đổi lịch -> Trả 400 Bad Request
      const rescheduleRes = await request(app.getHttpServer())
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'schedule_reschedule',
          pushOn: false,
        });

      expect(rescheduleRes.status).toBe(400);
      expect(rescheduleRes.body.message).toContain('Không thể tắt thông báo bắt buộc');
    });
  });
});
