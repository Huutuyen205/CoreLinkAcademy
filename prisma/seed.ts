// Seed dữ liệu demo GIẢ (docs/10 §5, docs/14 §4). Chạy lại nhiều lần được (upsert).
// Không dùng dữ liệu cá nhân thật; SĐT dạng +8490000xxxx.
import { randomBytes } from "node:crypto";
import { PrismaClient, type Role } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";
import { checkPasswordStrength } from "../src/server/auth/rules";
import { addDays, generateSessions } from "../src/lib/schedule";
import { vnDateKey } from "../src/lib/time";

const db = new PrismaClient();

const subjects = [
  { slug: "toan", name: "Toán", description: "Số học, đại số, hình học và giải tích theo chương trình phổ thông, chú trọng tư duy lập luận." },
  { slug: "ngu-van", name: "Ngữ văn", description: "Đọc hiểu, cảm thụ văn bản và kỹ năng viết nghị luận, tự sự, miêu tả." },
  { slug: "tieng-anh", name: "Tiếng Anh", description: "Ngữ pháp, từ vựng và bốn kỹ năng nghe – nói – đọc – viết theo từng cấp độ." },
  { slug: "vat-ly", name: "Vật lý", description: "Cơ học, điện học, quang học và nhiệt học gắn với thí nghiệm và bài tập vận dụng." },
  { slug: "hoa-hoc", name: "Hóa học", description: "Hóa vô cơ, hữu cơ và phương pháp giải bài tập định lượng." },
  { slug: "tin-hoc", name: "Tin học", description: "Tư duy thuật toán và lập trình Python từ cơ bản đến nâng cao." },
];

type CourseSeed = {
  subject: string;
  slug: string;
  title: string;
  summary: string;
  gradeFrom: number;
  gradeTo: number;
  level: string;
  totalSessions: number;
  sessionMinutes: number;
  tuitionVnd: number | null;
  featured?: boolean;
  published?: boolean;
  outcomes: string[];
  syllabus: { title: string; detail: string }[];
};

const courses: CourseSeed[] = [
  {
    subject: "toan", slug: "toan-9-on-thi-vao-10", title: "Toán 9 — Ôn thi vào lớp 10", featured: true,
    summary: "Hệ thống kiến thức đại số và hình học lớp 9, luyện đề theo cấu trúc thi tuyển sinh.",
    gradeFrom: 9, gradeTo: 9, level: "Ôn thi", totalSessions: 24, sessionMinutes: 90, tuitionVnd: 3_600_000,
    outcomes: ["Nắm chắc phương trình bậc hai và hệ thức Vi-ét", "Giải được bài hình học đường tròn cơ bản đến khá", "Làm đề thi thử trong 120 phút"],
    syllabus: [
      { title: "Căn bậc hai và biến đổi biểu thức", detail: "Rút gọn biểu thức chứa căn, bài toán phụ." },
      { title: "Hàm số và đồ thị", detail: "Hàm bậc nhất, hàm y = ax², tương giao." },
      { title: "Phương trình và hệ phương trình", detail: "Hệ thức Vi-ét, giải bài toán bằng cách lập phương trình." },
      { title: "Hình học đường tròn", detail: "Góc với đường tròn, tứ giác nội tiếp." },
      { title: "Luyện đề", detail: "Đề thi các năm, chữa lỗi thường gặp." },
    ],
  },
  {
    subject: "toan", slug: "toan-6-nen-tang", title: "Toán 6 — Nền tảng số học",
    summary: "Làm quen chương trình THCS: số tự nhiên, phân số, số nguyên và hình học trực quan.",
    gradeFrom: 6, gradeTo: 6, level: "Cơ bản", totalSessions: 32, sessionMinutes: 90, tuitionVnd: 3_200_000,
    outcomes: ["Tính toán thành thạo với số nguyên và phân số", "Hiểu ước, bội, số nguyên tố", "Trình bày lời giải rõ ràng"],
    syllabus: [
      { title: "Số tự nhiên", detail: "Lũy thừa, thứ tự thực hiện phép tính." },
      { title: "Tính chia hết", detail: "Ước chung, bội chung." },
      { title: "Số nguyên và phân số", detail: "Các phép toán và bài toán thực tế." },
      { title: "Hình học trực quan", detail: "Hình phẳng, đối xứng." },
    ],
  },
  {
    subject: "ngu-van", slug: "ngu-van-9-nghi-luan", title: "Ngữ văn 9 — Viết nghị luận",
    summary: "Rèn kỹ năng lập dàn ý và viết bài nghị luận xã hội, nghị luận văn học.",
    gradeFrom: 9, gradeTo: 9, level: "Nâng cao", totalSessions: 20, sessionMinutes: 90, tuitionVnd: 3_000_000, featured: true,
    outcomes: ["Lập dàn ý trong 10 phút", "Viết đoạn văn nghị luận 200 chữ đúng cấu trúc", "Phân tích tác phẩm trọng tâm lớp 9"],
    syllabus: [
      { title: "Đọc hiểu văn bản", detail: "Phương thức biểu đạt, biện pháp tu từ." },
      { title: "Nghị luận xã hội", detail: "Đoạn văn 200 chữ về tư tưởng, hiện tượng." },
      { title: "Nghị luận văn học", detail: "Phân tích nhân vật, đoạn thơ." },
    ],
  },
  {
    subject: "tieng-anh", slug: "tieng-anh-thcs-giao-tiep", title: "Tiếng Anh THCS — Ngữ pháp và giao tiếp",
    summary: "Củng cố ngữ pháp trọng tâm và luyện phản xạ nói theo chủ đề quen thuộc.",
    gradeFrom: 6, gradeTo: 9, level: "Trung cấp", totalSessions: 36, sessionMinutes: 90, tuitionVnd: 4_200_000, featured: true,
    outcomes: ["Dùng đúng các thì cơ bản", "Giới thiệu bản thân và trình bày ý kiến ngắn", "Đọc hiểu đoạn văn 200–300 từ"],
    syllabus: [
      { title: "Các thì và cấu trúc câu", detail: "Hiện tại, quá khứ, tương lai; câu bị động." },
      { title: "Từ vựng theo chủ đề", detail: "Trường học, gia đình, môi trường." },
      { title: "Nói và nghe", detail: "Hội thoại theo cặp, thuyết trình ngắn." },
    ],
  },
  {
    subject: "vat-ly", slug: "vat-ly-10-co-hoc", title: "Vật lý 10 — Cơ học",
    summary: "Động học, động lực học và các định luật bảo toàn, kèm bài tập vận dụng.",
    gradeFrom: 10, gradeTo: 10, level: "Cơ bản", totalSessions: 24, sessionMinutes: 90, tuitionVnd: 3_600_000,
    outcomes: ["Giải bài toán chuyển động thẳng", "Vận dụng ba định luật Newton", "Hiểu định luật bảo toàn động lượng, cơ năng"],
    syllabus: [
      { title: "Động học chất điểm", detail: "Chuyển động thẳng đều, biến đổi đều." },
      { title: "Động lực học", detail: "Ba định luật Newton, các lực cơ học." },
      { title: "Định luật bảo toàn", detail: "Động lượng, công, năng lượng." },
    ],
  },
  {
    subject: "hoa-hoc", slug: "hoa-hoc-11-huu-co", title: "Hóa học 11 — Hóa hữu cơ",
    summary: "Hiđrocacbon và dẫn xuất, phương pháp giải bài tập hữu cơ.",
    gradeFrom: 11, gradeTo: 11, level: "Nâng cao", totalSessions: 24, sessionMinutes: 90, tuitionVnd: 3_600_000,
    outcomes: ["Gọi tên và viết đồng phân", "Nắm tính chất hóa học các nhóm chất", "Giải bài toán đốt cháy"],
    syllabus: [
      { title: "Đại cương hữu cơ", detail: "Công thức, đồng phân, danh pháp." },
      { title: "Hiđrocacbon", detail: "Ankan, anken, ankin, aren." },
      { title: "Dẫn xuất", detail: "Ancol, phenol, anđehit, axit cacboxylic." },
    ],
  },
  {
    subject: "tin-hoc", slug: "lap-trinh-python-co-ban", title: "Lập trình Python cơ bản",
    summary: "Tư duy thuật toán qua Python: biến, rẽ nhánh, vòng lặp, hàm và danh sách.",
    gradeFrom: 8, gradeTo: 12, level: "Cơ bản", totalSessions: 20, sessionMinutes: 120, tuitionVnd: null,
    outcomes: ["Viết chương trình nhập – xử lý – xuất", "Dùng vòng lặp và danh sách", "Chia bài toán thành hàm"],
    syllabus: [
      { title: "Làm quen Python", detail: "Biến, kiểu dữ liệu, nhập xuất." },
      { title: "Cấu trúc điều khiển", detail: "if, for, while." },
      { title: "Hàm và danh sách", detail: "Viết hàm, xử lý danh sách." },
      { title: "Dự án nhỏ", detail: "Trò chơi đoán số, quản lý điểm." },
    ],
  },
  {
    subject: "tin-hoc", slug: "tin-hoc-thuat-toan-nang-cao", title: "Thuật toán nâng cao (chưa mở)", published: false,
    summary: "Khóa nháp để kiểm tra khóa chưa xuất bản không hiển thị công khai.",
    gradeFrom: 10, gradeTo: 12, level: "Nâng cao", totalSessions: 24, sessionMinutes: 120, tuitionVnd: null,
    outcomes: ["Quy hoạch động cơ bản"],
    syllabus: [{ title: "Đang soạn", detail: "Nội dung chưa hoàn thiện." }],
  },
];

const rooms = [
  { name: "P.101", capacity: 16 },
  { name: "P.102", capacity: 16 },
  { name: "P.201", capacity: 24 },
];

type UserSeed = { email: string; phone: string; fullName: string; role: Role; studentCode?: string; gradeLevel?: number };

const users: UserSeed[] = [
  { email: "admin@demo.corelink.vn", phone: "+84900000001", fullName: "Quản trị Demo", role: "ADMIN" },
  { email: "gv.toan@demo.corelink.vn", phone: "+84900000011", fullName: "Giáo viên Toán Demo", role: "TEACHER" },
  { email: "gv.van@demo.corelink.vn", phone: "+84900000012", fullName: "Giáo viên Văn Demo", role: "TEACHER" },
  { email: "gv.anh@demo.corelink.vn", phone: "+84900000013", fullName: "Giáo viên Anh Demo", role: "TEACHER" },
  { email: "hs1@demo.corelink.vn", phone: "+84900000101", fullName: "Học sinh Một", role: "STUDENT", studentCode: "HS260001", gradeLevel: 9 },
  { email: "hs2@demo.corelink.vn", phone: "+84900000102", fullName: "Học sinh Hai", role: "STUDENT", studentCode: "HS260002", gradeLevel: 9 },
  { email: "hs3@demo.corelink.vn", phone: "+84900000103", fullName: "Học sinh Ba", role: "STUDENT", studentCode: "HS260003", gradeLevel: 6 },
  { email: "hs4@demo.corelink.vn", phone: "+84900000104", fullName: "Học sinh Bốn", role: "STUDENT", studentCode: "HS260004", gradeLevel: 7 },
  { email: "hs5@demo.corelink.vn", phone: "+84900000105", fullName: "Học sinh Năm", role: "STUDENT", studentCode: "HS260005", gradeLevel: 10 },
  { email: "hs6@demo.corelink.vn", phone: "+84900000106", fullName: "Học sinh Sáu", role: "STUDENT", studentCode: "HS260006", gradeLevel: 11 },
  { email: "ph1@demo.corelink.vn", phone: "+84900000201", fullName: "Phụ huynh Một", role: "PARENT" },
  { email: "ph2@demo.corelink.vn", phone: "+84900000202", fullName: "Phụ huynh Hai", role: "PARENT" },
  { email: "ph3@demo.corelink.vn", phone: "+84900000203", fullName: "Phụ huynh Ba", role: "PARENT" },
  { email: "ph4@demo.corelink.vn", phone: "+84900000204", fullName: "Phụ huynh Bốn", role: "PARENT" },
];

// [phụ huynh, học sinh]; PH1 có hai con để kiểm tra chọn con.
const guardianships: [string, string][] = [
  ["ph1@demo.corelink.vn", "hs1@demo.corelink.vn"],
  ["ph1@demo.corelink.vn", "hs3@demo.corelink.vn"],
  ["ph2@demo.corelink.vn", "hs2@demo.corelink.vn"],
  ["ph3@demo.corelink.vn", "hs4@demo.corelink.vn"],
  ["ph3@demo.corelink.vn", "hs5@demo.corelink.vn"],
  ["ph4@demo.corelink.vn", "hs6@demo.corelink.vn"],
];

function demoPassword(): { value: string; generated: boolean } {
  const fromEnv = process.env.SEED_DEMO_PASSWORD?.trim();
  if (fromEnv) {
    const weak = checkPasswordStrength(fromEnv);
    if (weak) throw new Error(`SEED_DEMO_PASSWORD không hợp lệ: ${weak}`);
    return { value: fromEnv, generated: false };
  }
  return { value: `Demo${randomBytes(6).toString("hex")}`, generated: true };
}

async function main() {
  for (const [i, s] of subjects.entries()) {
    await db.subject.upsert({ where: { slug: s.slug }, update: { ...s, sortOrder: i }, create: { ...s, sortOrder: i } });
  }
  const subjectIds = new Map((await db.subject.findMany()).map((s) => [s.slug, s.id]));

  for (const c of courses) {
    const { subject, featured, published, ...rest } = c;
    const data = {
      ...rest,
      description: `${c.summary} Lớp tối đa 16 học sinh, giáo viên theo sát và có bài tập sau mỗi buổi.`,
      subjectId: subjectIds.get(subject)!,
      isFeatured: featured ?? false,
      isPublished: published ?? true,
    };
    await db.course.upsert({ where: { slug: c.slug }, update: data, create: data });
  }

  for (const r of rooms) {
    await db.room.upsert({ where: { name: r.name }, update: r, create: r });
  }

  const password = demoPassword();
  const passwordHash = await hashPassword(password.value);
  for (const u of users) {
    const data = { ...u, passwordHash, mustChangePassword: false, failedLoginCount: 0, lockedUntil: null, status: "ACTIVE" as const };
    await db.user.upsert({ where: { email: u.email }, update: data, create: data });
  }
  const userIds = new Map((await db.user.findMany({ select: { id: true, email: true } })).map((u) => [u.email, u.id]));

  for (const [parentEmail, studentEmail] of guardianships) {
    const parentId = userIds.get(parentEmail)!;
    const studentId = userIds.get(studentEmail)!;
    await db.guardianship.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      update: {},
      create: { parentId, studentId },
    });
  }

  const demo = await seedAcademics(userIds);

  console.log(`Seed xong: ${subjects.length} môn, ${courses.length} khóa, ${rooms.length} phòng, ${users.length} tài khoản demo, ${demo}.`);
  if (password.generated) {
    // In một lần để người chạy seed đăng nhập thử; không dùng ở production.
    console.log(`Mật khẩu chung của tài khoản demo: ${password.value}`);
  } else {
    console.log("Mật khẩu tài khoản demo = SEED_DEMO_PASSWORD.");
  }
}

/**
 * Lớp, buổi, ghi danh, điểm danh, bài tập và lead demo — chỉ tạo khi lớp chưa tồn tại (chạy lại không nhân bản).
 * Lịch tính tương đối theo ngày chạy seed để luôn có buổi đã qua và buổi sắp tới.
 */
async function seedAcademics(userIds: Map<string | null, string>): Promise<string> {
  const id = (email: string) => userIds.get(email)!;
  const course = async (slug: string) => (await db.course.findUniqueOrThrow({ where: { slug } })).id;
  const room = async (name: string) => (await db.room.findUniqueOrThrow({ where: { name } })).id;
  const startDate = addDays(vnDateKey(new Date()), -14);

  const plans = [
    { code: "TOAN9-K1", course: "toan-9-on-thi-vao-10", teacher: "gv.toan@demo.corelink.vn", room: "P.101", weekdays: [1, 3, 5], startTime: "18:00", endTime: "19:30", total: 24, capacity: 16, students: ["hs1@demo.corelink.vn", "hs2@demo.corelink.vn"] },
    { code: "VAN9-K1", course: "ngu-van-9-nghi-luan", teacher: "gv.van@demo.corelink.vn", room: "P.102", weekdays: [2, 4], startTime: "18:00", endTime: "19:30", total: 20, capacity: 16, students: ["hs1@demo.corelink.vn", "hs2@demo.corelink.vn"] },
    { code: "ANH-THCS-K1", course: "tieng-anh-thcs-giao-tiep", teacher: "gv.anh@demo.corelink.vn", room: "P.201", weekdays: [6], startTime: "08:00", endTime: "09:30", total: 36, capacity: 20, students: ["hs3@demo.corelink.vn", "hs4@demo.corelink.vn"] },
  ];

  let created = 0;
  for (const p of plans) {
    if (await db.class.findUnique({ where: { code: p.code } })) continue;
    created++;
    const roomId = await room(p.room);
    const teacherId = id(p.teacher);
    const klass = await db.class.create({
      data: {
        code: p.code,
        courseId: await course(p.course),
        teacherId,
        roomId,
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        weekdays: p.weekdays.join(","),
        startTime: p.startTime,
        endTime: p.endTime,
        totalSessions: p.total,
        capacity: p.capacity,
        status: "IN_PROGRESS",
      },
    });
    const sessions = generateSessions({ startDate, weekdays: p.weekdays, startTime: p.startTime, endTime: p.endTime, total: p.total });
    await db.classSession.createMany({ data: sessions.map((s) => ({ ...s, classId: klass.id, teacherId, roomId })) });
    for (const email of p.students) await db.enrollment.create({ data: { classId: klass.id, studentId: id(email) } });

    // Điểm danh các buổi đã kết thúc; HS thứ hai vắng 2 buổi gần nhất của lớp Toán để có cảnh báo (BR-033).
    const past = await db.classSession.findMany({ where: { classId: klass.id, endsAt: { lt: new Date() } }, orderBy: { startsAt: "asc" } });
    for (const [i, s] of past.entries()) {
      for (const [j, email] of p.students.entries()) {
        const lastTwo = i >= past.length - 2;
        const status = p.code === "TOAN9-K1" && j === 1 && lastTwo ? "ABSENT" : i % 4 === 3 && j === 0 ? "LATE" : "PRESENT";
        await db.attendance.create({ data: { sessionId: s.id, studentId: id(email), status, markedById: teacherId, markedAt: s.endsAt } });
      }
      await db.classSession.update({ where: { id: s.id }, data: { status: "COMPLETED" } });
    }

    if (p.code === "TOAN9-K1") {
      const assignment = await db.assignment.create({
        data: {
          classId: klass.id,
          createdById: teacherId,
          title: "Ôn tập phương trình bậc hai",
          instructions: "Làm trong 30 phút. Câu tự luận trình bày đầy đủ các bước.",
          dueAt: new Date(Date.now() + 5 * 24 * 3_600_000),
          status: "PUBLISHED",
        },
      });
      await db.question.createMany({
        data: [
          { assignmentId: assignment.id, order: 1, type: "MCQ", prompt: "Phương trình x² − 5x + 6 = 0 có nghiệm là:", options: ["x = 1; x = 6", "x = 2; x = 3", "x = −2; x = −3", "Vô nghiệm"], correctOption: 1, points: 2 },
          { assignmentId: assignment.id, order: 2, type: "SHORT", prompt: "Tổng hai nghiệm của x² − 7x + 10 = 0 bằng bao nhiêu?", acceptedAnswers: ["7"], points: 2 },
          { assignmentId: assignment.id, order: 3, type: "ESSAY", prompt: "Giải và biện luận phương trình x² − 2mx + m² − 1 = 0 theo tham số m.", points: 6 },
        ],
      });
    }
  }

  if ((await db.lead.count()) === 0) {
    const toan = (await db.subject.findUniqueOrThrow({ where: { slug: "toan" } })).id;
    const anh = (await db.subject.findUniqueOrThrow({ where: { slug: "tieng-anh" } })).id;
    const leads = [
      { parentName: "Phụ huynh Tiềm năng A", phone: "+84900000301", studentName: "Học sinh A", gradeLevel: 9, subjectId: toan, hoursAgo: 30 },
      { parentName: "Phụ huynh Tiềm năng B", phone: "+84900000302", studentName: "Học sinh B", gradeLevel: 7, subjectId: anh, hoursAgo: 2 },
    ];
    for (const l of leads) {
      const { hoursAgo, ...data } = l;
      const createdAt = new Date(Date.now() - hoursAgo * 3_600_000);
      const lead = await db.lead.create({ data: { ...data, createdAt } });
      await db.leadActivity.create({ data: { leadId: lead.id, type: "CREATED", content: "Dữ liệu demo: đăng ký học thử qua website.", createdAt } });
    }
  }

  return created > 0 ? `${created} lớp demo kèm buổi học, điểm danh và bài tập` : "lớp demo đã có từ trước";
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
