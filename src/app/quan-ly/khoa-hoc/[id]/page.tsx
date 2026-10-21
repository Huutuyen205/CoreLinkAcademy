import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { courseFields } from "@/components/forms/course-fields";
import { Flash } from "@/components/layout/flash";
import { Card, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { deleteCourseAction, saveCourseAction } from "@/server/catalog/actions";
import { getCourseAdmin, listSubjectsAdmin } from "@/server/catalog/admin";
import { orNotFound } from "@/server/page";

export const metadata: Metadata = { title: "Sửa khóa học" };

export default async function CourseEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ thongbao?: string }> }) {
  const actor = await requireRole("ADMIN");
  const [course, subjects] = await Promise.all([orNotFound(getCourseAdmin(actor, (await params).id)), listSubjectsAdmin(actor)]);
  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/khoa-hoc">← Khóa học</Link>
      </p>
      <Flash code={(await searchParams).thongbao} />
      <PageHeader
        title={course.title}
        description={course.isPublished ? "Đang hiển thị trên website." : "Đang ẩn trên website."}
        action={course.isPublished ? <Link href={`/khoa-hoc/${course.slug}`}>Xem trang công khai</Link> : undefined}
      />
      <Card>
        <ConfigForm action={saveCourseAction} hidden={{ id: course.id }} submitLabel="Lưu khóa học" columns={2} fields={courseFields(subjects, course)} />
      </Card>
      <Card title="Xóa khóa học" className="mt-6">
        {course._count.classes > 0 ? (
          <p className="text-muted">Khóa đã có {course._count.classes} lớp nên không xóa được. Bỏ chọn “Xuất bản” để ẩn khóa.</p>
        ) : (
          <ConfigForm action={deleteCourseAction} hidden={{ id: course.id }} submitLabel="Xóa khóa học" submitVariant="danger" confirm="Xóa vĩnh viễn khóa học này?" fields={[]} />
        )}
      </Card>
    </>
  );
}
