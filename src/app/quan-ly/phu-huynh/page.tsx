import type { UserStatus } from "@prisma/client";
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
import { listParentsPage, PEOPLE_PAGE_SIZE } from "@/server/people/service";
import { USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Phụ huynh" };

// Admin §4 — FR-036: danh sách, tìm kiếm phụ huynh; xem con đã liên kết.
export default async function ParentsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; trangthai?: string; loc?: string }> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const status = sp.trangthai && sp.trangthai in USER_STATUS ? (sp.trangthai as UserStatus) : undefined;
  const noChild = sp.loc === "chua-con";
  const page = parsePage(sp.page);
  const { total, rows } = await listParentsPage(actor, { q, status, noChild, page });
  const filtered = Boolean(q || status || noChild);

  return (
    <>
      <PageHeader title="Phụ huynh" description="Hồ sơ phụ huynh và các con được liên kết." />
      <details className="mb-6 rounded-block border border-line bg-surface p-4">
        <summary className="cursor-pointer py-1 font-medium text-primary">Thêm phụ huynh</summary>
        <div className="mt-4">
          <CreateUserForm roles={[{ value: "PARENT", label: "Phụ huynh" }]} />
        </div>
      </details>
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end">
        <TextField name="q" label="Tìm tên, email, SĐT" defaultValue={q} maxLength={80} />
        <SelectField name="trangthai" label="Tài khoản" placeholder="Tất cả" defaultValue={status ?? ""} options={Object.entries(USER_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
        <SelectField name="loc" label="Cần xử lý" placeholder="Tất cả" defaultValue={noChild ? "chua-con" : ""} options={[{ value: "chua-con", label: "Chưa liên kết con" }]} />
        <div className="flex min-h-11 items-center">
          {filtered && (
            <ButtonLink href="/quan-ly/phu-huynh" variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </FilterForm>
      {rows.length === 0 ? (
        <EmptyState message={filtered ? "Không có phụ huynh phù hợp." : "Chưa có phụ huynh."} />
      ) : (
        <Card>
          <DataTable
            caption="Danh sách phụ huynh"
            rows={rows}
            rowKey={(p) => p.id}
            columns={[
              {
                header: "Họ tên",
                primary: true,
                cell: (p) => (
                  <Link href={`/quan-ly/phu-huynh/${p.id}`} className="font-medium">
                    {p.fullName}
                  </Link>
                ),
              },
              { header: "Liên hệ", cell: (p) => [p.phone ? formatPhone(p.phone) : null, p.email].filter(Boolean).join(" · ") || "—" },
              {
                header: "Con",
                cell: (p) =>
                  p.childLinks.length ? (
                    <span className="flex flex-wrap gap-1">
                      {p.childLinks.map((l) => (
                        <Link key={l.student.id} href={`/quan-ly/hoc-vien/${l.student.id}`} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary no-underline">
                          {l.student.fullName}
                        </Link>
                      ))}
                    </span>
                  ) : (
                    <span className="text-sm text-warning">Chưa liên kết</span>
                  ),
              },
              { header: "Tài khoản", cell: (p) => <Badge tone={USER_STATUS[p.status].tone}>{USER_STATUS[p.status].label}</Badge> },
              { header: "Thao tác", className: "md:w-[1%] md:whitespace-nowrap", cell: (p) => <UserRowActions user={{ ...p, role: "PARENT" }} actor={actor} /> },
            ]}
          />
        </Card>
      )}
      <Pagination page={page} pageSize={PEOPLE_PAGE_SIZE} total={total} basePath="/quan-ly/phu-huynh" params={{ q, trangthai: status, loc: noChild ? "chua-con" : undefined }} />
    </>
  );
}
