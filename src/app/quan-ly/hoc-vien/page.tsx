import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { CreateUserForm } from "@/components/forms/create-user-form";
import { buttonClass } from "@/components/ui/button";
import { Pagination, parsePage } from "@/components/ui/data-table";
import { TextField } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { linkGuardianAction, unlinkGuardianAction } from "@/server/users/actions";
import { listLearners, listParents, USER_PAGE_SIZE } from "@/server/users/service";
import { MAX_GUARDIANS } from "@/server/users/rules";
import { USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Học viên" };

// FR-014 (+ Staff tạo tài khoản học sinh/phụ huynh, ASSUMPTION-A04).
export default async function LearnersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const page = parsePage(sp.page);
  const [{ total, rows }, parents] = await Promise.all([listLearners(actor, q, page), listParents(actor)]);
  const parentOptions = parents.map((p) => ({ value: p.id, label: `${p.fullName}${p.phone ? ` · ${formatPhone(p.phone)}` : ""}` }));

  return (
    <>
      <PageHeader title="Học viên" description="Học sinh, phụ huynh và liên kết giữa họ (tối đa 4 phụ huynh/học sinh)." />
      <details className="mb-6 rounded-block border border-line bg-surface p-4">
        <summary className="cursor-pointer font-medium text-primary">Tạo tài khoản học sinh hoặc phụ huynh</summary>
        <div className="mt-4">
          <CreateUserForm
            roles={[
              { value: "STUDENT", label: "Học sinh" },
              { value: "PARENT", label: "Phụ huynh" },
            ]}
          />
        </div>
      </details>

      <form method="get" className="mb-6 flex items-end gap-2">
        <TextField name="q" label="Tìm học sinh theo tên hoặc mã" defaultValue={q} maxLength={80} className="flex-1" />
        <button type="submit" className={buttonClass("secondary")}>
          Tìm
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState message={q ? "Không tìm thấy học sinh." : "Chưa có học sinh nào. Học sinh được tạo khi chuyển lead hoặc tạo trực tiếp ở trên."} />
      ) : (
        <ul className="space-y-4">
          {rows.map((s) => (
            <li key={s.id} className="rounded-block border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {actor.role === "ADMIN" ? <Link href={`/quan-ly/nguoi-dung/${s.id}`}>{s.fullName}</Link> : s.fullName}{" "}
                    <span className="text-sm font-normal text-muted">
                      {s.studentCode}
                      {s.gradeLevel ? ` · lớp ${s.gradeLevel}` : ""}
                    </span>
                  </p>
                  <p className="text-sm text-muted">
                    Đang học: {s.enrollments.length === 0 ? "chưa có lớp" : s.enrollments.map((e) => e.class.code).join(", ")}
                    {!s.email && !s.phone && " · chưa có email/SĐT để đăng nhập"}
                  </p>
                </div>
                {s.status !== "ACTIVE" && <Badge tone={USER_STATUS[s.status].tone}>{USER_STATUS[s.status].label}</Badge>}
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Phụ huynh ({s.parentLinks.length}/{MAX_GUARDIANS})</p>
                  {s.parentLinks.length === 0 ? (
                    <p className="text-sm text-muted">Chưa liên kết.</p>
                  ) : (
                    <ul className="mt-1 space-y-2 text-sm">
                      {s.parentLinks.map(({ parent }) => (
                        <li key={parent.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            {parent.fullName}
                            {parent.phone ? ` · ${formatPhone(parent.phone)}` : ""}
                          </span>
                          <ConfigForm action={unlinkGuardianAction} hidden={{ parentId: parent.id, studentId: s.id }} submitLabel="Bỏ" submitVariant="secondary" confirm="Bỏ liên kết phụ huynh này?" fields={[]} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {s.parentLinks.length < MAX_GUARDIANS && parentOptions.length > 0 && (
                  <ConfigForm
                    action={linkGuardianAction}
                    hidden={{ studentId: s.id }}
                    submitLabel="Liên kết"
                    submitVariant="secondary"
                    fields={[{ type: "select", name: "parentId", label: "Thêm phụ huynh", placeholder: "Chọn phụ huynh", options: parentOptions.filter((p) => !s.parentLinks.some((l) => l.parent.id === p.value)) }]}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageSize={USER_PAGE_SIZE} total={total} basePath="/quan-ly/hoc-vien" params={{ q }} />
    </>
  );
}
