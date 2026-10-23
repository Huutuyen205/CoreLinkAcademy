// Tìm nhanh toàn hệ thống (FEAT-B6, DECISION-D32). Phạm vi theo vai trò như các trang tương ứng:
// quản lý → học sinh, phụ huynh, giáo viên, lớp, lead; giáo viên → lớp mình và học sinh lớp mình. Vai trò khác: không có.
import type { Prisma } from "@prisma/client";
import { can } from "@/server/auth/policy";
import { isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { normalizePhone, phoneFragment } from "@/lib/phone";

export type SearchItem = { href: string; label: string; sub: string };
export type SearchGroup = { title: string; items: SearchItem[] };

const LIMIT = 5;
const ci = (q: string) => ({ contains: q, mode: "insensitive" as const });

function personWhere(q: string): Prisma.UserWhereInput {
  const phone = normalizePhone(q);
  const fragment = phoneFragment(q);
  return { OR: [{ fullName: ci(q) }, { email: ci(q) }, { studentCode: ci(q) }, ...(phone ? [{ phone }] : fragment ? [{ phone: { contains: fragment } }] : [])] };
}

export function canGlobalSearch(role: Actor["role"]): boolean {
  return role === "ADMIN" || role === "STAFF" || role === "TEACHER";
}

export async function globalSearch(actor: Actor, rawQuery: string): Promise<SearchGroup[]> {
  const q = rawQuery.trim().slice(0, 80);
  if (q.length < 2 || !canGlobalSearch(actor.role)) return [];
  const person = { id: true, fullName: true, studentCode: true, phone: true, email: true } as const;

  if (actor.role === "TEACHER") {
    const mine: Prisma.ClassWhereInput = { OR: [{ teacherId: actor.id }, { sessions: { some: { teacherId: actor.id } } }] };
    const [classes, students] = await Promise.all([
      db.class.findMany({ where: { AND: [mine, { OR: [{ code: ci(q) }, { course: { title: ci(q) } }] }] }, take: LIMIT, select: { id: true, code: true, course: { select: { title: true } } } }),
      db.user.findMany({
        where: { role: "STUDENT", AND: [personWhere(q), { enrollments: { some: { class: { teacherId: actor.id } } } }] },
        take: LIMIT,
        orderBy: { fullName: "asc" },
        select: person,
      }),
    ]);
    return [
      { title: "Lớp của tôi", items: classes.map((c) => ({ href: `/giao-vien/lop/${c.id}`, label: c.code, sub: c.course.title })) },
      { title: "Học sinh", items: students.map((s) => ({ href: `/giao-vien/hoc-sinh/${s.id}`, label: s.fullName, sub: s.studentCode ?? "" })) },
    ].filter((g) => g.items.length > 0);
  }

  if (!isManager(actor)) return [];
  const phone = normalizePhone(q);
  const [students, parents, teachers, classes, leads] = await Promise.all([
    db.user.findMany({ where: { role: "STUDENT", ...personWhere(q) }, take: LIMIT, orderBy: { fullName: "asc" }, select: person }),
    db.user.findMany({ where: { role: "PARENT", ...personWhere(q) }, take: LIMIT, orderBy: { fullName: "asc" }, select: person }),
    db.user.findMany({ where: { role: "TEACHER", ...personWhere(q) }, take: LIMIT, orderBy: { fullName: "asc" }, select: person }),
    db.class.findMany({ where: { OR: [{ code: ci(q) }, { course: { title: ci(q) } }] }, take: LIMIT, orderBy: { startDate: "desc" }, select: { id: true, code: true, course: { select: { title: true } } } }),
    can(actor.role, "lead.manage")
      ? db.lead.findMany({
          where: phone ? { phone } : { OR: [{ parentName: ci(q) }, { studentName: ci(q) }] },
          take: LIMIT,
          orderBy: { createdAt: "desc" },
          select: { id: true, parentName: true, studentName: true, phone: true },
        })
      : Promise.resolve([]),
  ]);
  const contact = (p: { phone: string | null; email: string | null }) => p.phone ?? p.email ?? "";
  return [
    { title: "Học sinh", items: students.map((s) => ({ href: `/quan-ly/hoc-vien/${s.id}`, label: s.fullName, sub: [s.studentCode, contact(s)].filter(Boolean).join(" · ") })) },
    { title: "Phụ huynh", items: parents.map((p) => ({ href: `/quan-ly/phu-huynh/${p.id}`, label: p.fullName, sub: contact(p) })) },
    { title: "Giáo viên", items: teachers.map((t) => ({ href: `/quan-ly/giao-vien/${t.id}`, label: t.fullName, sub: contact(t) })) },
    { title: "Lớp học", items: classes.map((c) => ({ href: `/quan-ly/lop/${c.id}`, label: c.code, sub: c.course.title })) },
    { title: "Lead", items: leads.map((l) => ({ href: `/quan-ly/lead/${l.id}`, label: l.parentName, sub: `HS: ${l.studentName} · ${l.phone}` })) },
  ].filter((g) => g.items.length > 0);
}
