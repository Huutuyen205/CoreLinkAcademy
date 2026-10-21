import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { ProfileForm } from "@/components/people/profile-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { getParentProfile, linkableStudents } from "@/server/people/service";
import { linkGuardianAction, unlinkGuardianAction } from "@/server/users/actions";
import { USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Hồ sơ phụ huynh" };

// Admin §4 — FR-014, FR-036: chi tiết phụ huynh, liên kết / gỡ liên kết con.
export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const [p, students] = await Promise.all([orNotFound(getParentProfile(actor, id)), linkableStudents(actor, id)]);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/phu-huynh">← Phụ huynh</Link>
      </p>
      <PageHeader
        title={p.fullName}
        description={[p.phone ? formatPhone(p.phone) : null, p.email].filter(Boolean).join(" · ") || "Phụ huynh"}
        action={p.status === "DISABLED" ? <Badge tone={USER_STATUS.DISABLED.tone}>Tài khoản bị khóa</Badge> : undefined}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card title="Hồ sơ">
          <ProfileForm profile={{ ...p, role: "PARENT" }} />
        </Card>
        <Card title={`Con được liên kết (${p.childLinks.length})`}>
          {p.childLinks.length === 0 ? (
            <EmptyState message="Chưa liên kết học sinh nào." />
          ) : (
            <ul className="space-y-3">
              {p.childLinks.map(({ student: s }) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <Link href={`/quan-ly/hoc-vien/${s.id}`}>{s.fullName}</Link>
                    <span className="block text-sm text-muted">
                      {[s.studentCode, s.enrollments.map((e) => e.class.code).join(", ") || "chưa có lớp"].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <ConfigForm action={unlinkGuardianAction} hidden={{ parentId: p.id, studentId: s.id }} submitLabel="Gỡ" submitVariant="secondary" confirm="Gỡ liên kết với học sinh này?" fields={[]} />
                </li>
              ))}
            </ul>
          )}
          {students.length > 0 && (
            <ConfigForm
              className="mt-4"
              action={linkGuardianAction}
              hidden={{ parentId: p.id }}
              submitLabel="Liên kết"
              submitVariant="secondary"
              fields={[{ type: "select", name: "studentId", label: "Liên kết thêm con", placeholder: "Chọn học sinh", options: students.map((s) => ({ value: s.id, label: `${s.fullName}${s.studentCode ? ` (${s.studentCode})` : ""}` })) }]}
            />
          )}
        </Card>
      </div>
    </>
  );
}
