import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { TextField } from "@/components/ui/field";
import { Badge, Card, EmptyState } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import type { getClassForTeacher } from "@/server/academic/service";
import { createSupplementalSetAction } from "@/server/practice/actions";
import { ENROLLMENT_STATUS, PRACTICE_DIFFICULTY } from "@/lib/labels";
import { foldVietnamese } from "@/lib/search";

type Klass = Awaited<ReturnType<typeof getClassForTeacher>>;

const DIFFICULTY_OPTIONS = (Object.keys(PRACTICE_DIFFICULTY) as (keyof typeof PRACTICE_DIFFICULTY)[]).map((d) => ({ value: d, label: PRACTICE_DIFFICULTY[d].label }));

export function StudentsTab({ klass, q, absentees }: { klass: Klass; q: string; absentees: Set<string> }) {
  const terms = foldVietnamese(q).split(/\s+/).filter(Boolean);
  const students = klass.enrollments.filter((e) => terms.every((t) => foldVietnamese(`${e.student.fullName} ${e.student.studentCode ?? ""}`).includes(t)));
  return (
    <Card title={`Học sinh (${klass.enrollments.length})`}>
      {klass.enrollments.length > 6 && (
        <FilterForm className="mb-3 max-w-md">
          <input type="hidden" name="tab" value="hoc-sinh" />
          <TextField name="q" label="Tìm học sinh" defaultValue={q} maxLength={80} />
        </FilterForm>
      )}
      {klass.enrollments.length === 0 ? (
        <EmptyState message="Lớp chưa có học sinh." />
      ) : students.length === 0 ? (
        <EmptyState message="Không có học sinh phù hợp." />
      ) : (
        <ul className="divide-y divide-line">
          {students.map((e) => (
            <li key={e.student.id} className="py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <Link href={`/giao-vien/hoc-sinh/${e.student.id}`} className="font-medium">
                    {e.student.fullName}
                  </Link>
                  <span className="text-sm text-muted">{e.student.studentCode}</span>
                  {e.status !== "ACTIVE" && <Badge tone={ENROLLMENT_STATUS[e.status].tone}>{ENROLLMENT_STATUS[e.status].label}</Badge>}
                  {absentees.has(e.student.id) && <Badge tone="danger">Vắng 2 buổi liên tiếp</Badge>}
                </span>
              </div>
              {e.status === "ACTIVE" && (
                <details className="group mt-1">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-control border border-primary/30 px-3 text-sm font-semibold text-primary hover:bg-primary-soft group-open:bg-primary-soft [&::-webkit-details-marker]:hidden">
                    Tạo đề bổ sung
                  </summary>
                  <div className="mt-3 rounded-block border border-line bg-paper p-4">
                    <ConfigForm
                      action={createSupplementalSetAction}
                      hidden={{ classId: klass.id, studentId: e.student.id, subjectId: klass.course.subjectId }}
                      submitLabel="Tạo đề (nháp)"
                      columns={2}
                      fields={[
                        { type: "text", name: "title", label: "Tên đề", required: true, maxLength: 200, wide: true },
                        { type: "text", name: "topic", label: "Chuyên đề", required: true, maxLength: 100 },
                        { type: "text", name: "format", label: "Dạng bài", required: true, maxLength: 60, defaultValue: "Trắc nghiệm" },
                        { type: "select", name: "difficulty", label: "Mức độ", required: true, options: DIFFICULTY_OPTIONS, defaultValue: "MEDIUM" },
                      ]}
                    />
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
