// Đo thời gian các truy vấn chính của khu quản lý (CHỈ ĐỌC, không ghi gì vào DB).
// Chạy: pnpm bench:admin            (dùng DATABASE_URL trong .env)
//       BENCH_CONN_LIMIT=5 pnpm bench:admin   (ghi đè connection_limit của chuỗi kết nối để so sánh)
// Gọi thẳng tầng service với một actor ADMIN có thật trong DB, bỏ qua phần render React.

const RUNS = Number(process.env.BENCH_RUNS ?? 7);

function withConnLimit(url: string, limit: string): string {
  const u = new URL(url);
  u.searchParams.set("connection_limit", limit);
  return u.toString();
}

async function main() {
  if (process.env.BENCH_CONN_LIMIT && process.env.DATABASE_URL) {
    process.env.DATABASE_URL = withConnLimit(process.env.DATABASE_URL, process.env.BENCH_CONN_LIMIT);
  }
  const conn = new URL(process.env.DATABASE_URL ?? "postgresql://x").searchParams.get("connection_limit") ?? "(mặc định)";

  const { db } = await import("@/server/db");
  // Hàm *Query là phần truy vấn không qua cache (unstable_cache chỉ chạy bên trong Next) → đo đúng chi phí DB.
  const { leadCountsQuery, listLeads, getLead } = await import("@/server/leads/service");
  const { classCountsQuery, listClassesPage, getClassForManager } = await import("@/server/academic/service");
  const { querySubjects } = await import("@/server/catalog/public");
  const { listAbsenceAlerts } = await import("@/server/attendance/service");
  const { listLearners, listParents, listUsers } = await import("@/server/users/service");
  const { listAuditLogs } = await import("@/server/audit/queries");

  const admin = await db.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true, role: true, fullName: true } });
  if (!admin) throw new Error("Không có tài khoản ADMIN để đo.");
  const actor = { ...admin, mustChangePassword: false, avatarFileId: null };
  const [firstClass, firstLead, counts] = await Promise.all([
    db.class.findFirst({ select: { id: true } }),
    db.lead.findFirst({ select: { id: true } }),
    Promise.all([db.lead.count(), db.user.count(), db.class.count(), db.classSession.count(), db.attendance.count()]),
  ]);

  const cases: [string, () => Promise<unknown>][] = [
    ["Tổng quan /quan-ly (4 số liệu + cảnh báo vắng)", () => Promise.all([leadCountsQuery(), classCountsQuery(), listAbsenceAlerts(actor)])],
    ["Danh sách lead /quan-ly/lead (môn + trang 1)", async () => { await querySubjects(); await listLeads(actor, { page: 1 }); }],
    ["Tìm lead theo tên", () => listLeads(actor, { page: 1, q: "nguyen" })],
    ["Chi tiết lead", () => (firstLead ? getLead(actor, firstLead.id) : Promise.resolve())],
    ["Danh sách lớp /quan-ly/lop", () => listClassesPage(actor, { page: 1 })],
    ["Chi tiết lớp /quan-ly/lop/[id]", () => (firstClass ? getClassForManager(actor, firstClass.id) : Promise.resolve())],
    ["Học viên /quan-ly/hoc-vien", () => Promise.all([listLearners(actor, undefined, 1), listParents(actor)])],
    ["Người dùng /quan-ly/nguoi-dung", () => listUsers(actor, { page: 1 })],
    ["Nhật ký /quan-ly/nhat-ky", () => listAuditLogs(actor, { page: 1 })],
  ];

  // Khởi động kết nối trước khi đo.
  await db.$queryRaw`SELECT 1`;
  const rtt: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const t = performance.now();
    await db.$queryRaw`SELECT 1`;
    rtt.push(performance.now() - t);
  }

  console.log(`connection_limit=${conn} · ${RUNS} lần/ca · dữ liệu: ${counts[0]} lead, ${counts[1]} user, ${counts[2]} lớp, ${counts[3]} buổi, ${counts[4]} điểm danh`);
  console.log(`Round-trip SELECT 1: median ${median(rtt).toFixed(0)} ms\n`);
  console.log("Ca đo".padEnd(52) + "median   p90");
  for (const [name, fn] of cases) {
    await fn(); // làm nóng
    const times: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const t = performance.now();
      await fn();
      times.push(performance.now() - t);
    }
    console.log(`${name.padEnd(52)}${median(times).toFixed(0).padStart(5)} ms ${p90(times).toFixed(0).padStart(5)} ms`);
  }
  await db.$disconnect();
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function p90(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(s.length * 0.9) - 1)]!;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
