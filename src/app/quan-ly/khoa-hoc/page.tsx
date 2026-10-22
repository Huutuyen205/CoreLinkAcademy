import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { courseFields } from "@/components/forms/course-fields";
import { Flash } from "@/components/layout/flash";
import { DataTable } from "@/components/ui/data-table";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { deleteCourseAction, saveCourseAction, setCatalogActiveAction } from "@/server/catalog/actions";
import { listCoursesAdmin, listSubjectsAdmin } from "@/server/catalog/admin";
import { formatGradeRange } from "@/lib/format";

export const metadata: Metadata = { title: "Khóa học" };

// FR-015 (chỉ Admin).
export default async function CoursesAdminPage({ searchParams }: { searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("ADMIN");
  const [courses, subjects] = await Promise.all([listCoursesAdmin(actor), listSubjectsAdmin(actor)]);
  return (
    <>
      <Flash code={(await searchParams).thongbao} />
      <PageHeader title="Khóa học" description="Khóa đã có lớp không xóa được, chỉ tắt xuất bản để ẩn." />
      {courses.length === 0 ? (
        <EmptyState message="Chưa có khóa học." />
      ) : (
        <DataTable
          caption="Danh sách khóa học"
          rows={courses}
          rowKey={(c) => c.id}
          columns={[
            {
              header: "Khóa học",
              primary: true,
              cell: (c) => (
                <Link href={`/quan-ly/khoa-hoc/${c.id}`} className="font-medium">
                  {c.title}
                </Link>
              ),
            },
            { header: "Môn", cell: (c) => c.subject.name },
            { header: "Khối", cell: (c) => formatGradeRange(c.gradeFrom, c.gradeTo) },
            { header: "Lớp đã mở", cell: (c) => c._count.classes },
            {
              header: "Hiển thị",
              cell: (c) => (
                <span className="flex flex-wrap gap-1">
                  <Badge tone={c.isPublished ? "success" : "neutral"}>{c.isPublished ? "Đã xuất bản" : "Ẩn"}</Badge>
                  {c.isFeatured && <Badge tone="primary">Nổi bật</Badge>}
                </span>
              ),
            },
            {
              header: "Thao tác",
              className: "md:w-[1%] md:whitespace-nowrap",
              cell: (c) => (
                <RowActions>
                  <ActionLink href={`/quan-ly/khoa-hoc/${c.id}`} icon="edit">
                    Sửa
                  </ActionLink>
                  {c.isPublished && (
                    <ActionLink href={`/khoa-hoc/${c.slug}`} icon="view">
                      Xem trên web
                    </ActionLink>
                  )}
                  <ActionButton action={setCatalogActiveAction} hidden={{ kind: "course", id: c.id, active: c.isPublished ? "0" : "1" }} icon={c.isPublished ? "hide" : "show"} tone={c.isPublished ? "default" : "success"}>
                    {c.isPublished ? "Ẩn" : "Xuất bản"}
                  </ActionButton>
                  {c._count.classes === 0 && (
                    <ActionButton action={deleteCourseAction} hidden={{ id: c.id }} icon="delete" tone="danger" confirm={`Xóa khóa học "${c.title}"?`}>
                      Xóa
                    </ActionButton>
                  )}
                </RowActions>
              ),
            },
          ]}
        />
      )}
      <details className="mt-6 rounded-block border border-line bg-surface p-4">
        <summary className="cursor-pointer font-medium text-primary">Thêm khóa học</summary>
        <Card className="mt-4 border-0 p-0">
          <ConfigForm action={saveCourseAction} submitLabel="Tạo khóa học" columns={2} fields={courseFields(subjects)} />
        </Card>
      </details>
    </>
  );
}
