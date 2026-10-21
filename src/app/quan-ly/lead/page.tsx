import type { LeadStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { DataTable, Pagination, parsePage } from "@/components/ui/data-table";
import { SelectField, TextField } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { listSubjects } from "@/server/catalog/public";
import { isLeadOverdue } from "@/server/leads/rules";
import { LEAD_PAGE_SIZE, listLeads } from "@/server/leads/service";
import { LEAD_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Lead" };

type SP = { status?: string; mon?: string; q?: string; quahan?: string; page?: string };

// FR-006: danh sách lead, lọc trạng thái/môn, tìm tên/SĐT, đánh dấu quá hạn.
export default async function LeadListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const status = sp.status && sp.status in LEAD_STATUS ? (sp.status as LeadStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const overdue = sp.quahan === "1";
  const page = parsePage(sp.page);
  const subjects = await listSubjects();
  const subjectId = subjects.some((s) => s.id === sp.mon) ? sp.mon : undefined;

  const { total, rows } = await listLeads(actor, { status, subjectId, q, overdue, page });
  const now = new Date();
  const filtered = Boolean(status || subjectId || q || overdue);

  return (
    <>
      <PageHeader title="Lead" description="Khách đăng ký học thử và khách nhập tay." />
      <form method="get" className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <TextField name="q" label="Tìm theo tên hoặc SĐT" defaultValue={q} maxLength={100} />
        <SelectField
          name="status"
          label="Trạng thái"
          placeholder="Tất cả"
          defaultValue={status ?? ""}
          options={Object.entries(LEAD_STATUS).map(([value, l]) => ({ value, label: l.label }))}
        />
        <SelectField name="mon" label="Môn" placeholder="Tất cả" defaultValue={subjectId ?? ""} options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
        <div className="flex gap-2">
          <button type="submit" className={buttonClass()}>
            Lọc
          </button>
          {filtered && (
            <ButtonLink href="/quan-ly/lead" variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </form>
      <p className="mb-4 text-sm">
        {overdue ? (
          <Link href="/quan-ly/lead">Xem tất cả lead</Link>
        ) : (
          <Link href="/quan-ly/lead?quahan=1">Chỉ xem lead mới quá 24 giờ chưa xử lý</Link>
        )}
      </p>

      {rows.length === 0 ? (
        <EmptyState message={filtered ? "Không có lead phù hợp với bộ lọc." : "Chưa có lead nào. Lead mới sẽ xuất hiện khi phụ huynh gửi form học thử."} />
      ) : (
        <DataTable
          caption="Danh sách lead"
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            {
              header: "Phụ huynh / học sinh",
              primary: true,
              cell: (r) => (
                <>
                  <Link href={`/quan-ly/lead/${r.id}`} className="font-medium">
                    {r.parentName}
                  </Link>
                  <span className="block text-sm text-muted">
                    HS: {r.studentName}
                    {r.gradeLevel ? `, lớp ${r.gradeLevel}` : ""}
                  </span>
                </>
              ),
            },
            { header: "SĐT", cell: (r) => formatPhone(r.phone) },
            { header: "Quan tâm", cell: (r) => r.course?.title ?? r.subject?.name ?? "—" },
            {
              header: "Trạng thái",
              cell: (r) => (
                <span className="flex flex-wrap gap-1">
                  <Badge tone={LEAD_STATUS[r.status].tone}>{LEAD_STATUS[r.status].label}</Badge>
                  {isLeadOverdue(r, now) && <Badge tone="warning">Quá hạn</Badge>}
                </span>
              ),
            },
            { header: "Ngày tạo", cell: (r) => formatDateTime(r.createdAt) },
          ]}
        />
      )}
      <Pagination page={page} pageSize={LEAD_PAGE_SIZE} total={total} basePath="/quan-ly/lead" params={{ status, mon: subjectId, q, quahan: overdue ? "1" : undefined }} />
    </>
  );
}
