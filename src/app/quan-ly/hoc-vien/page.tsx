import type { UserStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, UserPlus, Users } from "lucide-react";
import { CreateUserForm } from "@/components/forms/create-user-form";
import { ImportStudentsForm } from "@/components/forms/import-students-form";
import { InlinePickForm } from "@/components/forms/inline-pick-form";
import { UserRowActions } from "@/components/people/user-row-actions";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Pagination, parsePage } from "@/components/ui/data-table";
import { SelectField, TextField } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { ActionButton } from "@/components/ui/row-actions";
import { requireRole } from "@/server/auth/guard";
import { linkGuardianAction, unlinkGuardianAction } from "@/server/users/actions";
import { listLearners, listParents, USER_PAGE_SIZE } from "@/server/users/service";
import { MAX_GUARDIANS } from "@/server/users/rules";
import { USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Học viên" };

const EXTRA_FILTERS = { "chua-ph": "Chưa có phụ huynh", "chua-lop": "Chưa có lớp" } as const;

type SP = { q?: string; page?: string; trangthai?: string; loc?: string };

// FR-014 (+ Staff tạo tài khoản học sinh/phụ huynh, ASSUMPTION-A04). Mỗi học sinh một thẻ: lớp, phụ huynh, thao tác.
export default async function LearnersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const status = sp.trangthai && sp.trangthai in USER_STATUS ? (sp.trangthai as UserStatus) : undefined;
  const extra = sp.loc && sp.loc in EXTRA_FILTERS ? (sp.loc as keyof typeof EXTRA_FILTERS) : undefined;
  const page = parsePage(sp.page);
  const [{ total, rows }, parents] = await Promise.all([
    listLearners(actor, q, page, { status, noParent: extra === "chua-ph", noClass: extra === "chua-lop" }),
    listParents(actor),
  ]);
  const parentOptions = parents.map((p) => ({ value: p.id, label: `${p.fullName}${p.phone ? ` · ${formatPhone(p.phone)}` : ""}` }));
  const filtered = Boolean(q || status || extra);

  return (
    <>
      <PageHeader title="Học viên" description={`${total} học sinh · mỗi học sinh tối đa ${MAX_GUARDIANS} phụ huynh.`} />

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <details className="group rounded-block border border-line bg-surface p-4 open:md:col-span-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-primary [&::-webkit-details-marker]:hidden">
            <UserPlus className="size-5" aria-hidden="true" />
            Tạo tài khoản học sinh / phụ huynh
          </summary>
          <div className="mt-4">
            <CreateUserForm
              roles={[
                { value: "STUDENT", label: "Học sinh" },
                { value: "PARENT", label: "Phụ huynh" },
              ]}
            />
          </div>
        </details>
        <details className="group rounded-block border border-line bg-surface p-4 open:md:col-span-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-primary [&::-webkit-details-marker]:hidden">
            <Users className="size-5" aria-hidden="true" />
            Nhập danh sách học sinh hàng loạt
          </summary>
          <div className="mt-4">
            <ImportStudentsForm />
          </div>
        </details>
      </div>

      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end">
        <TextField name="q" label="Tìm theo tên hoặc mã học sinh" defaultValue={q} maxLength={80} />
        <SelectField name="trangthai" label="Tài khoản" placeholder="Tất cả" defaultValue={status ?? ""} options={Object.entries(USER_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
        <SelectField name="loc" label="Cần xử lý" placeholder="Tất cả" defaultValue={extra ?? ""} options={Object.entries(EXTRA_FILTERS).map(([value, label]) => ({ value, label }))} />
        <div className="flex min-h-11 items-center">
          {filtered && (
            <ButtonLink href="/quan-ly/hoc-vien" variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </FilterForm>

      {rows.length === 0 ? (
        <EmptyState message={filtered ? "Không có học sinh phù hợp." : "Chưa có học sinh nào. Học sinh được tạo khi chuyển lead hoặc tạo trực tiếp ở trên."} />
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => {
            const available = parentOptions.filter((p) => !s.parentLinks.some((l) => l.parent.id === p.value));
            return (
              <li key={s.id} className="rounded-block border border-line bg-surface shadow-[0_2px_8px_rgba(14,20,51,0.05)]">
                {/* Đầu thẻ: danh tính + thao tác */}
                <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
                  <Avatar name={s.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link href={`/quan-ly/hoc-vien/${s.id}`} className="font-semibold">
                        {s.fullName}
                      </Link>
                      {s.studentCode && <span className="text-sm text-muted">{s.studentCode}</span>}
                      {s.gradeLevel !== null && <Badge tone="neutral">{s.gradeLevel === 0 ? "Tiền tiểu học" : `Lớp ${s.gradeLevel}`}</Badge>}
                      {s.status !== "ACTIVE" && <Badge tone={USER_STATUS[s.status].tone}>{USER_STATUS[s.status].label}</Badge>}
                    </p>
                    {!s.email && !s.phone && <p className="text-xs text-warning">Chưa có email/SĐT để đăng nhập</p>}
                  </div>
                  <UserRowActions user={{ ...s, role: "STUDENT" }} actor={actor} />
                </div>

                {/* Thân thẻ: lớp đang học | phụ huynh */}
                <div className="grid gap-4 px-4 py-3 md:grid-cols-[1fr_1.4fr]">
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      <GraduationCap className="size-3.5" aria-hidden="true" />
                      Lớp đang học
                    </p>
                    {s.enrollments.length === 0 ? (
                      <p className="text-sm text-muted">Chưa có lớp.</p>
                    ) : (
                      <p className="flex flex-wrap gap-1.5">
                        {s.enrollments.map((e) => (
                          <Link key={e.class.id} href={`/quan-ly/lop/${e.class.id}`} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-sm font-medium text-primary no-underline hover:bg-brand-tint">
                            {e.class.code}
                          </Link>
                        ))}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      <Users className="size-3.5" aria-hidden="true" />
                      Phụ huynh ({s.parentLinks.length}/{MAX_GUARDIANS})
                    </p>
                    {s.parentLinks.length > 0 && (
                      <ul className="mb-2 flex flex-wrap gap-1.5">
                        {s.parentLinks.map(({ parent }) => (
                          <li key={parent.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-3 pr-0.5 text-sm">
                            <Link href={`/quan-ly/phu-huynh/${parent.id}`} className="text-ink no-underline hover:text-primary">
                              {parent.fullName}
                              {parent.phone && <span className="text-muted"> · {formatPhone(parent.phone)}</span>}
                            </Link>
                            <ActionButton
                              action={unlinkGuardianAction}
                              hidden={{ parentId: parent.id, studentId: s.id }}
                              icon="unlink"
                              tone="danger"
                              iconOnly
                              confirm={`Bỏ liên kết ${parent.fullName} với ${s.fullName}?`}
                            >
                              {`Bỏ liên kết ${parent.fullName}`}
                            </ActionButton>
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.parentLinks.length === 0 && <p className="mb-2 text-sm text-warning">Chưa liên kết phụ huynh.</p>}
                    {s.parentLinks.length < MAX_GUARDIANS && available.length > 0 && (
                      <InlinePickForm
                        action={linkGuardianAction}
                        hidden={{ studentId: s.id }}
                        name="parentId"
                        label={`Thêm phụ huynh cho ${s.fullName}`}
                        placeholder="Thêm phụ huynh: gõ tên hoặc SĐT…"
                        options={available}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageSize={USER_PAGE_SIZE} total={total} basePath="/quan-ly/hoc-vien" params={{ q, trangthai: status, loc: extra }} />
    </>
  );
}
