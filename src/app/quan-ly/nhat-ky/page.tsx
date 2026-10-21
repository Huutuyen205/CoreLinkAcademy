import type { Metadata } from "next";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { DataTable, Pagination, parsePage } from "@/components/ui/data-table";
import { SelectField } from "@/components/ui/field";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { AUDIT_ACTION_LABELS, AUDIT_PAGE_SIZE, listAuditLogs } from "@/server/audit/queries";
import { requireRole } from "@/server/auth/guard";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Nhật ký" };

// FR-035: chỉ Admin, chỉ đọc.
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; page?: string }> }) {
  const actor = await requireRole("ADMIN");
  const sp = await searchParams;
  const action = sp.action && sp.action in AUDIT_ACTION_LABELS ? sp.action : undefined;
  const page = parsePage(sp.page);
  const { total, rows } = await listAuditLogs(actor, { action, page });

  return (
    <>
      <PageHeader title="Nhật ký" description="Các thao tác nhạy cảm. Nhật ký không thể sửa hoặc xóa." />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <SelectField name="action" label="Loại thao tác" placeholder="Tất cả" defaultValue={action ?? ""} options={Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }))} />
        <button type="submit" className={buttonClass("secondary")}>
          Lọc
        </button>
        {action && (
          <ButtonLink href="/quan-ly/nhat-ky" variant="ghost">
            Bỏ lọc
          </ButtonLink>
        )}
      </form>
      {rows.length === 0 ? (
        <EmptyState message="Chưa có bản ghi nhật ký." />
      ) : (
        <DataTable
          caption="Nhật ký audit"
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            { header: "Thời điểm", primary: true, cell: (r) => formatDateTime(r.createdAt) },
            { header: "Người thực hiện", cell: (r) => r.actor?.fullName ?? "Hệ thống" },
            { header: "Thao tác", cell: (r) => AUDIT_ACTION_LABELS[r.action] ?? r.action },
            { header: "Đối tượng", cell: (r) => `${r.entity} · ${r.entityId}` },
            {
              header: "Chi tiết",
              className: "max-w-sm",
              cell: (r) =>
                r.detail ? (
                  <details>
                    <summary className="cursor-pointer py-2.5 text-sm text-primary">Xem</summary>
                    <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(r.detail, null, 2)}</pre>
                  </details>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      )}
      <Pagination page={page} pageSize={AUDIT_PAGE_SIZE} total={total} basePath="/quan-ly/nhat-ky" params={{ action }} />
    </>
  );
}
