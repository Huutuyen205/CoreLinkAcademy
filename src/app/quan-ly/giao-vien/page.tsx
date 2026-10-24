import type { MemberStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateUserForm } from "@/components/forms/create-user-form";
import { UserRowActions } from "@/components/people/user-row-actions";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, Pagination, parsePage } from "@/components/ui/data-table";
import { SelectField, TextField } from "@/components/ui/field";
import { FilterForm } from "@/components/ui/filter-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { listTeachers, PEOPLE_PAGE_SIZE } from "@/server/people/service";
import { memberStatusLabel, USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Giáo viên" };

const STATUSES: MemberStatus[] = ["ACTIVE", "ON_LEAVE", "INACTIVE"];

// Admin §3 — FR-036: danh sách, tìm kiếm/lọc giáo viên; Admin thêm giáo viên.
export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ q?: string; trangthai?: string; page?: string }> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const status = STATUSES.includes(sp.trangthai as MemberStatus) ? (sp.trangthai as MemberStatus) : undefined;
  const page = parsePage(sp.page);
  const { total, rows } = await listTeachers(actor, { q, status, page });

  return (
    <>
      <PageHeader title="Giáo viên" description="Hồ sơ, trạng thái hoạt động, lớp phụ trách và lịch giảng dạy." />
      {actor.role === "ADMIN" && (
        <details className="mb-6 rounded-block border border-line bg-surface p-4">
          <summary className="cursor-pointer py-1 font-medium text-primary">Thêm giáo viên</summary>
          <div className="mt-4">
            <CreateUserForm roles={[{ value: "TEACHER", label: "Giáo viên" }]} />
          </div>
        </details>
      )}
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.5fr_1fr_auto] md:items-end">
        <TextField name="q" label="Tìm tên, email, SĐT" defaultValue={q} maxLength={80} />
        <SelectField
          name="trangthai"
          label="Trạng thái"
          placeholder="Tất cả"
          defaultValue={status ?? ""}
          options={STATUSES.map((s) => ({ value: s, label: memberStatusLabel("TEACHER", s).label }))}
        />
        <div className="flex min-h-11 items-center">
          {(q || status) && (
            <ButtonLink href="/quan-ly/giao-vien" variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </FilterForm>
      {rows.length === 0 ? (
        <EmptyState message="Không có giáo viên phù hợp." />
      ) : (
        <Card>
          <DataTable
            caption="Danh sách giáo viên"
            rows={rows}
            rowKey={(t) => t.id}
            columns={[
              {
                header: "Họ tên",
                primary: true,
                cell: (t) => (
                  <Link href={`/quan-ly/giao-vien/${t.id}`} className="font-medium">
                    {t.fullName}
                  </Link>
                ),
              },
              { header: "Chuyên môn", cell: (t) => t.expertise ?? "—" },
              { header: "Liên hệ", cell: (t) => [t.phone ? formatPhone(t.phone) : null, t.email].filter(Boolean).join(" · ") || "—" },
              { header: "Lớp đang dạy", cell: (t) => t._count.teachingClasses },
              {
                header: "Trạng thái",
                cell: (t) => (
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={memberStatusLabel("TEACHER", t.memberStatus).tone}>{memberStatusLabel("TEACHER", t.memberStatus).label}</Badge>
                    {t.status === "DISABLED" && <Badge tone={USER_STATUS.DISABLED.tone}>{USER_STATUS.DISABLED.label}</Badge>}
                  </span>
                ),
              },
              { header: "Thao tác", className: "md:w-[1%] md:whitespace-nowrap", cell: (t) => <UserRowActions user={{ ...t, role: "TEACHER" }} actor={actor} /> },
            ]}
          />
        </Card>
      )}
      <Pagination page={page} pageSize={PEOPLE_PAGE_SIZE} total={total} basePath="/quan-ly/giao-vien" params={{ q, trangthai: status }} />
    </>
  );
}
