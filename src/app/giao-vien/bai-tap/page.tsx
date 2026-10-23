import type { AssignmentStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { SelectField, TextField } from "@/components/ui/field";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { ActionLink, RowActions } from "@/components/ui/row-actions";
import { listClasses } from "@/server/academic/service";
import { listTeacherAssignments } from "@/server/assessment/service";
import { requireRole } from "@/server/auth/guard";
import { ASSIGNMENT_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Bài tập" };

const STATUSES = Object.keys(ASSIGNMENT_STATUS) as AssignmentStatus[];

// Giáo viên §7: xem danh sách, tìm kiếm bài tập của mọi lớp mình phụ trách.
export default async function TeacherAssignmentsPage({ searchParams }: { searchParams: Promise<{ q?: string; lop?: string; trangthai?: string }> }) {
  const actor = await requireRole("TEACHER");
  const sp = await searchParams;
  const classes = await listClasses(actor);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) || undefined : undefined;
  const classId = classes.some((c) => c.id === sp.lop) ? sp.lop : undefined;
  const status = STATUSES.includes(sp.trangthai as AssignmentStatus) ? (sp.trangthai as AssignmentStatus) : undefined;
  const rows = await listTeacherAssignments(actor, { q, classId, status });

  return (
    <>
      <PageHeader
        title="Bài tập"
        description="Mọi bài tập của các lớp bạn phụ trách. Bấm tên bài để sửa, giao, chấm hoặc công bố kết quả."
        action={
          <ButtonLink href={classId ? `/giao-vien/bai-tap/moi?lop=${classId}` : "/giao-vien/bai-tap/moi"} size="sm">
            Tạo bài tập
          </ButtonLink>
        }
      />
      <FilterForm className="mb-6 grid gap-4 rounded-block border border-line bg-surface p-4 md:grid-cols-[1.5fr_1fr_1fr] md:items-end">
        <TextField name="q" label="Tìm theo tên bài" defaultValue={q} maxLength={80} />
        <SelectField name="lop" label="Lớp" placeholder="Tất cả" defaultValue={classId ?? ""} options={classes.map((c) => ({ value: c.id, label: c.code }))} />
        <SelectField name="trangthai" label="Trạng thái" placeholder="Tất cả" defaultValue={status ?? ""} options={STATUSES.map((s) => ({ value: s, label: ASSIGNMENT_STATUS[s].label }))} />
      </FilterForm>
      {rows.length === 0 ? (
        <EmptyState message={q || classId || status ? "Không có bài tập phù hợp." : "Chưa có bài tập nào."} />
      ) : (
        <DataTable
          caption="Danh sách bài tập"
          rows={rows}
          rowKey={(a) => a.id}
          columns={[
            {
              header: "Bài",
              primary: true,
              cell: (a) => (
                <span>
                  <Link href={`/giao-vien/bai-tap/${a.id}`} className="font-medium">
                    {a.title}
                  </Link>
                  {a.isTest && (
                    <span className="ml-2 align-middle">
                      <Badge tone="warning">Kiểm tra</Badge>
                    </span>
                  )}
                </span>
              ),
            },
            { header: "Lớp", cell: (a) => <Link href={`/giao-vien/lop/${a.class.id}`}>{a.class.code}</Link> },
            { header: "Hạn nộp", cell: (a) => formatDateTime(a.dueAt) },
            { header: "Câu hỏi", cell: (a) => a._count.questions },
            { header: "Đã nộp", cell: (a) => a._count.submissions },
            {
              header: "Trạng thái",
              cell: (a) => (
                <span className="flex flex-wrap gap-1">
                  <Badge tone={ASSIGNMENT_STATUS[a.status].tone}>{ASSIGNMENT_STATUS[a.status].label}</Badge>
                  {a.resultsPublishedAt && <Badge tone="success">Đã công bố</Badge>}
                </span>
              ),
            },
            {
              header: "Thao tác",
              className: "md:w-[1%] md:whitespace-nowrap",
              cell: (a) => (
                <RowActions>
                  <ActionLink href={`/giao-vien/bai-tap/${a.id}`} icon="edit">
                    Sửa / giao
                  </ActionLink>
                  {a.status !== "DRAFT" && (
                    <ActionLink href={`/giao-vien/bai-tap/${a.id}/bai-nop`} icon="view">
                      Bài nộp
                    </ActionLink>
                  )}
                </RowActions>
              ),
            },
          ]}
        />
      )}
    </>
  );
}
