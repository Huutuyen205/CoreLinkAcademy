import type { Metadata } from "next";
import Link from "next/link";
import { CreateUserForm } from "@/components/forms/create-user-form";
import { buttonClass } from "@/components/ui/button";
import { DataTable, Pagination, parsePage } from "@/components/ui/data-table";
import { TextField } from "@/components/ui/field";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { listParentsPage, PEOPLE_PAGE_SIZE } from "@/server/people/service";
import { USER_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = { title: "Phụ huynh" };

// Admin §4 — FR-036: danh sách, tìm kiếm phụ huynh; xem con đã liên kết.
export default async function ParentsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const page = parsePage(sp.page);
  const { total, rows } = await listParentsPage(actor, { q, page });

  return (
    <>
      <PageHeader title="Phụ huynh" description="Hồ sơ phụ huynh và các con được liên kết." />
      <details className="mb-6 rounded-block border border-line bg-surface p-4">
        <summary className="cursor-pointer py-1 font-medium text-primary">Thêm phụ huynh</summary>
        <div className="mt-4">
          <CreateUserForm roles={[{ value: "PARENT", label: "Phụ huynh" }]} />
        </div>
      </details>
      <form method="get" className="mb-6 flex items-end gap-2">
        <TextField name="q" label="Tìm tên, email, SĐT" defaultValue={q} maxLength={80} className="flex-1" />
        <button type="submit" className={buttonClass("secondary")}>
          Tìm
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState message={q ? "Không tìm thấy phụ huynh." : "Chưa có phụ huynh."} />
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
              { header: "Con", cell: (p) => (p.childLinks.length ? p.childLinks.map((l) => l.student.fullName).join(", ") : <span className="text-muted">Chưa liên kết</span>) },
              { header: "Tài khoản", cell: (p) => <Badge tone={USER_STATUS[p.status].tone}>{USER_STATUS[p.status].label}</Badge> },
            ]}
          />
        </Card>
      )}
      <Pagination page={page} pageSize={PEOPLE_PAGE_SIZE} total={total} basePath="/quan-ly/phu-huynh" params={{ q }} />
    </>
  );
}
