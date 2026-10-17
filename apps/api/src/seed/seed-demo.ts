import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { generateDeterministicEmbedding } from '@corelink/ai';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('--- KHỞI TẠO BỘ DỮ LIỆU DEMO 23/10/2026 (CORELINK ACADEMY) ---');
  console.log('================================================================');

  const defaultPassword = 'Test@123456';
  const passwordHash = await argon2.hash(defaultPassword, { type: argon2.argon2id });
  const adminPasswordHash = await argon2.hash('Admin@123456', { type: argon2.argon2id });

  // 1. Cơ sở chuẩn Cầu Giấy
  const branch = await prisma.branches.upsert({
    where: { code: 'HN-CG01' },
    update: {
      name: 'CoreLink Cầu Giấy',
      address: 'Số 8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
      latitude: 21.0313,
      longitude: 105.7828,
      checkin_radius_m: 150,
      is_active: true,
    },
    create: {
      code: 'HN-CG01',
      name: 'CoreLink Cầu Giấy',
      address: 'Số 8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
      latitude: 21.0313,
      longitude: 105.7828,
      checkin_radius_m: 150,
      is_active: true,
    },
  });
  console.log(`[1] Cơ sở: ${branch.name} (${branch.code})`);

  // 2. Roles
  const roles = await prisma.roles.findMany();
  const roleMap = new Map(roles.map((r) => [r.code, r.id]));

  // 3. Tài khoản Admin & Consultant
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@corelink.edu.vn' },
    update: { password_hash: adminPasswordHash, status: 'active' },
    create: {
      branch_id: branch.id,
      full_name: 'Quản trị viên Hệ thống',
      email: 'admin@corelink.edu.vn',
      phone: '+84999999999',
      password_hash: adminPasswordHash,
      status: 'active',
    },
  });
  if (roleMap.has('admin')) {
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: adminUser.id, role_id: roleMap.get('admin')! } },
      update: {},
      create: { user_id: adminUser.id, role_id: roleMap.get('admin')! },
    });
  }

  const consultantUser = await prisma.users.upsert({
    where: { email: 'consultant@corelink.edu.vn' },
    update: { password_hash: passwordHash, status: 'active' },
    create: {
      branch_id: branch.id,
      full_name: 'Nguyễn Thị Hương (Tư vấn viên)',
      email: 'consultant@corelink.edu.vn',
      phone: '+84988111222',
      password_hash: passwordHash,
      status: 'active',
    },
  });
  if (roleMap.has('consultant')) {
    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: consultantUser.id, role_id: roleMap.get('consultant')! } },
      update: {},
      create: { user_id: consultantUser.id, role_id: roleMap.get('consultant')! },
    });
  }
  console.log('[2] Đã tạo Admin (admin@corelink.edu.vn) & Consultant (consultant@corelink.edu.vn)');

  // 4. Phòng học
  const roomNames = ['Phòng 101 (Lab)', 'Phòng 102 (Smart)', 'Phòng 201', 'Phòng 202'];
  const rooms: any[] = [];
  for (const rName of roomNames) {
    const room = await prisma.rooms.upsert({
      where: { branch_id_name: { branch_id: branch.id, name: rName } },
      update: { capacity: 16, is_active: true },
      create: { branch_id: branch.id, name: rName, capacity: 16, is_active: true },
    });
    rooms.push(room);
  }
  console.log(`[3] Đã tạo ${rooms.length} phòng học`);

  // 5. Cấp học & Gói học phí
  const levelPrimary = await prisma.levels.findUnique({ where: { code: 'PRIMARY' } });
  const levelLowerSec = await prisma.levels.findUnique({ where: { code: 'LOWER_SEC' } });
  const levelUpperSec = await prisma.levels.findUnique({ where: { code: 'UPPER_SEC' } });

  let feePlanStarter = await prisma.fee_plans.findFirst({
    where: { branch_id: branch.id, name: 'Gói Tiếng Anh Tiểu Học chuẩn' },
  });
  if (!feePlanStarter) {
    feePlanStarter = await prisma.fee_plans.create({
      data: {
        branch_id: branch.id,
        name: 'Gói Tiếng Anh Tiểu Học chuẩn',
        billing_unit: 'course',
        amount_vnd: BigInt(4500000),
        sessions_included: 36,
        is_active: true,
      },
    });
  }

  let feePlanIelts = await prisma.fee_plans.findFirst({
    where: { branch_id: branch.id, name: 'Gói Luyện thi IELTS Chuyên sâu' },
  });
  if (!feePlanIelts) {
    feePlanIelts = await prisma.fee_plans.create({
      data: {
        branch_id: branch.id,
        name: 'Gói Luyện thi IELTS Chuyên sâu',
        billing_unit: 'course',
        amount_vnd: BigInt(8500000),
        sessions_included: 60,
        is_active: true,
      },
    });
  }

  // 6. 6 Khóa học (Programs)
  const programDefs = [
    { code: 'ENG-STARTERS', name: 'Tiếng Anh Thiếu Nhi Starters (Pre-A1)', levelId: levelPrimary?.id, feeId: feePlanStarter.id, fw: 'YLE', target: 'Pre-A1' },
    { code: 'ENG-MOVERS', name: 'Tiếng Anh Thiếu Nhi Movers (A1)', levelId: levelPrimary?.id, feeId: feePlanStarter.id, fw: 'YLE', target: 'A1' },
    { code: 'ENG-FLYERS', name: 'Tiếng Anh Thiếu Nhi Flyers (A2)', levelId: levelPrimary?.id, feeId: feePlanStarter.id, fw: 'YLE', target: 'A2' },
    { code: 'IELTS-55', name: 'Luyện thi IELTS Nền tảng Target 5.5', levelId: levelLowerSec?.id, feeId: feePlanIelts.id, fw: 'IELTS', target: '5.5' },
    { code: 'IELTS-65', name: 'Luyện thi IELTS Bứt phá Target 6.5', levelId: levelUpperSec?.id, feeId: feePlanIelts.id, fw: 'IELTS', target: '6.5' },
    { code: 'IELTS-75', name: 'Luyện thi IELTS Chuyên sâu Target 7.5+', levelId: levelUpperSec?.id, feeId: feePlanIelts.id, fw: 'IELTS', target: '7.5' },
  ];

  const createdPrograms: any[] = [];
  for (const p of programDefs) {
    if (!p.levelId) continue;
    const prog = await prisma.programs.upsert({
      where: { branch_id_code: { branch_id: branch.id, code: p.code } },
      update: {
        name: p.name,
        framework: p.fw as any,
        target_level: p.target,
        default_fee_plan_id: p.feeId,
        is_public: true,
      },
      create: {
        branch_id: branch.id,
        level_id: p.levelId,
        code: p.code,
        name: p.name,
        framework: p.fw as any,
        target_level: p.target,
        description: `Chương trình đào tạo chuẩn quốc tế ${p.name} tại CoreLink Academy.`,
        outcomes: `Cam kết đạt mục tiêu chuẩn đầu ra ${p.target} cho học sinh.`,
        total_sessions: 36,
        default_fee_plan_id: p.feeId,
        is_public: true,
      },
    });
    createdPrograms.push(prog);
  }
  console.log(`[4] Đã tạo ${createdPrograms.length} khóa học (Programs)`);

  // 7. 20 Giáo viên (Teachers)
  const teacherRole = roleMap.get('teacher');
  const teachers: any[] = [];
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, '0');
    const tUser = await prisma.users.upsert({
      where: { email: `teacher${pad}@corelink.edu.vn` },
      update: { password_hash: passwordHash, status: 'active' },
      create: {
        branch_id: branch.id,
        full_name: `Thầy/Cô Giáo Viên ${pad}`,
        email: `teacher${pad}@corelink.edu.vn`,
        phone: `+849710000${pad}`,
        password_hash: passwordHash,
        status: 'active',
      },
    });
    if (teacherRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: tUser.id, role_id: teacherRole } },
        update: {},
        create: { user_id: tUser.id, role_id: teacherRole },
      });
    }
    const teacher = await prisma.teachers.upsert({
      where: { user_id: tUser.id },
      update: { is_public: true },
      create: {
        user_id: tUser.id,
        branch_id: branch.id,
        bio_public: `Giáo viên giảng dạy với chứng chỉ giảng dạy quốc tế CELTA/TESOL kinh nghiệm ${i + 2} năm.`,
        is_public: true,
      },
    });
    teachers.push(teacher);
  }
  console.log(`[5] Đã tạo ${teachers.length} giáo viên (Teachers)`);

  // 8. 10 Lớp học (Classes)
  const classes: any[] = [];
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 30);

  for (let c = 1; c <= 10; c++) {
    const pad = String(c).padStart(2, '0');
    const prog = createdPrograms[(c - 1) % createdPrograms.length];
    const room = rooms[(c - 1) % rooms.length];
    const homeroom = teachers[(c - 1) % teachers.length];

    const cls = await prisma.classes.upsert({
      where: { branch_id_code: { branch_id: branch.id, code: `CLS-2026-${pad}` } },
      update: {
        name: `Lớp ${prog.name} K${pad}`,
        status: 'running',
        room_id: room.id,
        homeroom_teacher_id: homeroom.id,
      },
      create: {
        branch_id: branch.id,
        program_id: prog.id,
        code: `CLS-2026-${pad}`,
        name: `Lớp ${prog.name} K${pad}`,
        mode: 'offline',
        room_id: room.id,
        capacity: 12,
        start_date: startDate,
        end_date: endDate,
        recurrence: [
          { weekday: 2, start: '18:00', end: '19:30' },
          { weekday: 4, start: '18:00', end: '19:30' },
        ],
        homeroom_teacher_id: homeroom.id,
        status: 'running',
        created_by: adminUser.id,
      },
    });
    classes.push(cls);

    // Gán GV chính
    await prisma.$executeRaw`INSERT IGNORE INTO class_teachers (class_id, teacher_id, role, from_date) VALUES (${cls.id}, ${homeroom.id}, 'main', ${startDate})`;

    // Tạo các buổi học trong 2 tuần tới nếu chưa có
    const existingSessions = await prisma.class_sessions.count({ where: { class_id: cls.id } });
    if (existingSessions === 0) {
      for (let s = 1; s <= 4; s++) {
        const sessionDate = new Date(today.getTime() + s * 3 * 24 * 60 * 60 * 1000);
        const startsAt = new Date(sessionDate.setHours(18, 0, 0, 0));
        const endsAt = new Date(sessionDate.setHours(19, 30, 0, 0));

        await prisma.class_sessions.create({
          data: {
            branch_id: branch.id,
            class_id: cls.id,
            session_no: s,
            starts_at: startsAt,
            ends_at: endsAt,
            room_id: room.id,
            teacher_id: homeroom.id,
            status: 'scheduled',
          },
        });
      }
    }
  }
  console.log(`[6] Đã tạo ${classes.length} lớp học (Classes) & lịch học 2 tuần tới`);

  // 9. 80 Học sinh & 100 Phụ huynh
  const studentRole = roleMap.get('student');
  const guardianRole = roleMap.get('guardian');

  const students: any[] = [];
  for (let s = 1; s <= 80; s++) {
    const pad = String(s).padStart(3, '0');
    const sUser = await prisma.users.upsert({
      where: { email: `student${pad}@corelink.edu.vn` },
      update: { password_hash: passwordHash, status: 'active' },
      create: {
        branch_id: branch.id,
        full_name: `Học sinh CoreLink ${pad}`,
        email: `student${pad}@corelink.edu.vn`,
        phone: `+84982000${pad}`,
        password_hash: passwordHash,
        status: 'active',
      },
    });
    if (studentRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: sUser.id, role_id: studentRole } },
        update: {},
        create: { user_id: sUser.id, role_id: studentRole },
      });
    }
    const student = await prisma.students.upsert({
      where: { user_id: sUser.id },
      update: { is_young_account: s <= 40 },
      create: {
        user_id: sUser.id,
        branch_id: branch.id,
        code: `HS-2026-${pad}`,
        is_young_account: s <= 40,
      },
    });
    students.push(student);

    // Ghi danh vào lớp tương ứng (mỗi lớp 8 em) nếu chưa ghi danh
    const targetClass = classes[(s - 1) % classes.length];
    const existingEnr = await prisma.enrollments.findFirst({
      where: { class_id: targetClass.id, student_id: student.id },
    });
    if (!existingEnr) {
      await prisma.enrollments.create({
        data: {
          branch_id: branch.id,
          class_id: targetClass.id,
          student_id: student.id,
          status: 'active',
          enrolled_on: startDate,
          created_by: adminUser.id,
        },
      });
    }
  }
  console.log(`[7] Đã tạo ${students.length} học sinh (Students) & ghi danh vào các lớp`);

  // 100 Phụ huynh & liên kết
  const guardians: any[] = [];
  for (let g = 1; g <= 100; g++) {
    const pad = String(g).padStart(3, '0');
    const gUser = await prisma.users.upsert({
      where: { email: `guardian${pad}@corelink.edu.vn` },
      update: { password_hash: passwordHash, status: 'active' },
      create: {
        branch_id: branch.id,
        full_name: `Phụ huynh ${pad}`,
        email: `guardian${pad}@corelink.edu.vn`,
        phone: `+84983000${pad}`,
        password_hash: passwordHash,
        status: 'active',
      },
    });
    if (guardianRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: gUser.id, role_id: guardianRole } },
        update: {},
        create: { user_id: gUser.id, role_id: guardianRole },
      });
    }
    const guardian = await prisma.guardians.upsert({
      where: { user_id: gUser.id },
      update: { referral_code: `REF-CG-${pad}` },
      create: {
        user_id: gUser.id,
        branch_id: branch.id,
        referral_code: `REF-CG-${pad}`,
      },
    });
    guardians.push(guardian);

    // Liên kết với học sinh
    if (g <= 80) {
      await prisma.guardianships.upsert({
        where: { student_id_guardian_id: { student_id: students[g - 1].id, guardian_id: guardian.id } },
        update: {},
        create: {
          student_id: students[g - 1].id,
          guardian_id: guardian.id,
          relation: g % 2 === 0 ? 'father' : 'mother',
          can_view_results: true,
          can_message: true,
          receives_fee_notice: true,
        },
      });
    }
  }
  console.log(`[8] Đã tạo ${guardians.length} phụ huynh (Guardians) & liên kết học sinh`);

  // 10. Kho kiến thức Knowledge Base đã duyệt (Approved) cho Chatbot AI-12
  const kbDocs = [
    {
      title: 'Biểu phí niêm yết và chính sách hoàn phí chuẩn CoreLink 2026',
      category: 'fee',
      content:
        'Chính sách học phí CoreLink Academy: Khóa Tiếng Anh Giao Tiếp Thiếu Nhi có học phí 4.500.000 VNĐ cho thời lượng 36 buổi học. Khóa luyện thi IELTS Chuyên Sâu có học phí niêm yết 8.500.000 VNĐ cho 60 buổi học. Chính sách hoàn phí: hoàn 100% học phí nếu phụ huynh nộp đơn trước ngày khai giảng khóa học.',
    },
    {
      title: 'Quy trình kiểm tra xếp lớp và học thử miễn phí tại CoreLink',
      category: 'course',
      content:
        'Mọi học sinh mới đến với CoreLink Academy đều được tham gia 01 buổi học thử miễn phí tại cơ sở Cầu Giấy hoặc học thử trực tuyến qua Google Meet. Đồng thời học sinh được làm bài thi xếp lớp 4 kỹ năng Nghe - Nói - Đọc - Viết hoàn toàn miễn phí với kết quả nhận được trong 24 giờ làm việc.',
    },
    {
      title: 'Đội ngũ giáo viên và chất lượng đào tạo chuẩn quốc tế',
      category: 'teacher',
      content:
        '100% giáo viên tại CoreLink Academy đạt chuẩn giảng dạy quốc tế với chứng chỉ CELTA, TESOL hoặc Thạc sĩ Ngôn ngữ Anh. Giáo viên bản ngữ có kinh nghiệm giảng dạy trên 5 năm và luôn đồng hành sát sao cùng phụ huynh trong việc theo dõi tiến độ của từng học sinh.',
    },
    {
      title: 'Cam kết chuẩn đầu ra IELTS và chứng chỉ Cambridge',
      category: 'policy',
      content:
        'CoreLink cam kết bằng văn bản về chuẩn đầu ra cho từng khóa học: Tăng tối thiểu 1.0 band score IELTS sau lộ trình 6 tháng. Học sinh tiểu học cam kết đạt chứng chỉ Cambridge Flyers khi hoàn thành lộ trình. Nếu không đạt mục tiêu đã ký kết, học sinh được học lại hoàn toàn miễn phí.',
    },
  ];

  for (const doc of kbDocs) {
    let createdDoc = await prisma.kb_documents.findFirst({
      where: { branch_id: branch.id, title: doc.title },
    });
    if (!createdDoc) {
      createdDoc = await prisma.kb_documents.create({
        data: {
          branch_id: branch.id,
          title: doc.title,
          category: doc.category as any,
          content: doc.content,
          status: 'approved',
          approved_by: adminUser.id,
          approved_at: new Date(),
        },
      });
    }

    const existingChunk = await prisma.kb_chunks.findFirst({
      where: { document_id: createdDoc.id },
    });
    if (!existingChunk) {
      const embedding = generateDeterministicEmbedding(doc.content);
      await prisma.kb_chunks.create({
        data: {
          document_id: createdDoc.id,
          chunk_index: 0,
          content: doc.content,
          embedding: embedding as any,
          embedding_model: 'deterministic-768-v1',
        },
      });
    }
  }
  console.log(`[9] Đã nạp ${kbDocs.length} tài liệu Knowledge Base đã duyệt & sinh vector embeddings cho Chatbot`);

  console.log('================================================================');
  console.log('--- KHỞI TẠO BỘ DỮ LIỆU DEMO HOÀN TẤT THÀNH CÔNG! ---');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
