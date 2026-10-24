import type { LeadStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { DataTable, Pagination, parsePage } from "@/components/ui/data-table";
import { TextField } from "@/components/ui/field";
import { FilterSelect } from "@/components/ui/filter-select";
import { FilterForm } from "@/components/ui/filter-form";
import { ActionLink, RowActions } from "@/components/ui/row-actions";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { listSubjects } from "@/server/catalog/public";
import { isLeadOverdue } from "@/server/leads/rules";
import { LEAD_PAGE_SIZE, listLeadBoard, listLeads } from "@/server/leads/service";
import { LeadBoard } from "@/components/leads/lead-board";
import { cn } from "@/lib/format";
import { LEAD_STATUS } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Lead" };

type SP = { status?: string; mon?: string; q?: string; quahan?: string; page?: string; xem?: string };

// FR-006: danh sách lead, lọc trạng thái/môn, tìm tên/SĐT, đánh dấu quá hạn. `?xem=bang`: bảng Kanban (FEAT-B1, DECISION-D32).
export default async function LeadListPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const status = sp.status && sp.status in LEAD_STATUS ? (sp.status as LeadStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const overdue = sp.quahan === "1";
  const page = parsePage(sp.page);
  const subjects = await listSubjects();
  const subjectId = subjects.some((s) => s.id === sp.mon) ? sp.mon : undefined;

  const board = sp.xem === "bang";
  const now = new Date();
  const [{ total, rows }, columns] = await Promise.all([
    board ? Promise.resolve({ total: 0, rows: [] }) : listLeads(actor, { status, subjectId, q, overdue, page }),
    board ? listLeadBoard(actor, { subjectId, q }) : Promise.resolve([]),
  ]);
  const filtered = Boolean((!board && status) || subjectId || q || (!board && overdue));
  const viewHref = (b: boolean) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(subjectId ? { mon: subjectId } : {}), ...(b ? { xem: "bang" } : {}) }).toString();
    return p ? `/quan-ly/lead?${p}` : "/quan-ly/lead";
  };

  return (
    <>
      <PageHeader title="Lead" description="Khách đăng ký học thử và khách nhập tay." action={<ButtonLink href="/quan-ly/lead/moi">Nhập lead</ButtonLink>} />
      <nav aria-label="Cách xem" className="mb-4 inline-flex rounded-full border border-line bg-surface p-1 text-sm">
        {[
          { href: viewHref(false), label: "Danh sách", active: !board },
          { href: viewHref(true), label: "Bảng Kanban", active: board },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn("inline-flex min-h-9 items-center rounded-full px-4 font-semibold no-underline", t.active ? "bg-primary text-white" : "text-muted hover:text-primary")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <FilterForm className={cn("mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:items-end", board ? "md:grid-cols-[1.4fr_1fr_auto]" : "md:grid-cols-[1.4fr_1fr_1fr_auto]")}>
        {board && <input type="hidden" name="xem" value="bang" />}
        <TextField name="q" label="Tìm theo tên hoặc SĐT" defaultValue={q} maxLength={100} />
        {!board && (
          <FilterSelect
            name="status"
            label="Trạng thái"
            placeholder="Tất cả"
            defaultValue={status ?? ""}
            options={Object.entries(LEAD_STATUS).map(([value, l]) => ({ value, label: l.label }))}
          />
        )}
        <FilterSelect name="mon" label="Môn" placeholder="Tất cả" defaultValue={subjectId ?? ""} options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
        <div className="flex gap-2">
          {filtered && (
            <ButtonLink href={board ? "/quan-ly/lead?xem=bang" : "/quan-ly/lead"} variant="ghost">
              Bỏ lọc
            </ButtonLink>
          )}
        </div>
      </FilterForm>
      {board ? (
        <>
          <p className="mb-3 text-sm text-muted">Kéo thẻ sang cột khác để đổi trạng thái (trên điện thoại dùng ô “Chuyển sang…”). Thả vào “Đã nhập học” để chuyển thành học viên.</p>
          <LeadBoard
            labels={Object.fromEntries(Object.entries(LEAD_STATUS).map(([k, v]) => [k, v.label])) as Record<LeadStatus, string>}
            columns={columns.map((c) => ({
              status: c.status,
              label: LEAD_STATUS[c.status].label,
              total: c.total,
              leads: c.leads.map((l) => ({
                id: l.id,
                parentName: l.parentName,
                studentName: l.studentName,
                phone: l.phone,
                phoneLabel: formatPhone(l.phone),
                gradeLevel: l.gradeLevel,
                interest: l.course?.title ?? l.subject?.name ?? null,
                createdLabel: formatDateTime(l.createdAt),
                overdue: isLeadOverdue(l, now),
              })),
            }))}
          />
        </>
      ) : (
      <>
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
            {
              header: "Thao tác",
              className: "md:w-[1%] md:whitespace-nowrap",
              cell: (r) => (
                <RowActions>
                  <ActionLink href={`/quan-ly/lead/${r.id}`} icon="edit" tone={r.status === "NEW" ? "primary" : "default"}>
                    Xử lý
                  </ActionLink>
                  <ActionLink href={`tel:${r.phone}`} icon="message">
                    Gọi
                  </ActionLink>
                  {r.status !== "ENROLLED" && r.status !== "LOST" && (
                    <ActionLink href={`/quan-ly/lead/${r.id}#chuyen-hoc-vien`} icon="profile">
                      Chuyển HS
                    </ActionLink>
                  )}
                </RowActions>
              ),
            },
          ]}
        />
      )}
      </>
      )}
      <Pagination page={board ? 1 : page} pageSize={LEAD_PAGE_SIZE} total={total} basePath="/quan-ly/lead" params={{ status, mon: subjectId, q, quahan: overdue ? "1" : undefined }} />
    </>
  );
}
