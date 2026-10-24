import Link from "next/link";
import { ProgressBar } from "@/components/learner/progress-bar";
import { Badge, EmptyState, PageHeader } from "@/components/ui/feedback";
import { listMyClasses } from "@/server/academic/learner";
import { requireLearner } from "@/server/auth/learner";
import { CLASS_STATUS, ENROLLMENT_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";

// Học sinh / phụ huynh (của con đang chọn): các lớp đang học, mỗi thẻ có tiến độ; bấm vào lớp để xem chi tiết lớp + tài liệu (mô phỏng "Lớp của tôi" của giáo viên).
export async function LearnerClassesPage() {
  const { student, base } = await requireLearner();
  const classes = await listMyClasses(student);

  return (
    <>
      <PageHeader title="Lớp học" description="Các lớp đang theo học. Bấm vào một lớp để xem các buổi học, điểm danh, đánh giá và tài liệu." />
      {classes.length === 0 ? (
        <EmptyState message="Chưa được ghi danh vào lớp nào." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => {
            const ended = c.enrollmentStatus === "COMPLETED" || c.classStatus === "COMPLETED" || c.classStatus === "CANCELLED";
            const state = c.enrollmentStatus === "PAUSED" ? ENROLLMENT_STATUS.PAUSED : ended ? CLASS_STATUS[c.classStatus === "CANCELLED" ? "CANCELLED" : "COMPLETED"] : CLASS_STATUS[c.classStatus];
            return (
              <li key={c.id}>
                <Link href={`${base}/lop/${c.id}`} className="card-interactive block h-full rounded-block border border-line bg-surface p-5 text-ink no-underline">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg text-primary">{c.code}</h2>
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </div>
                  <p className="text-muted">{c.courseTitle}</p>
                  <p className="mt-2 text-sm">{formatSchedule(c.weekdays, c.startTime, c.endTime)}</p>
                  <p className="text-sm text-muted">
                    GV {c.teacherName}
                    {c.roomName ? ` · ${c.roomName}` : ""}
                  </p>
                  <ProgressBar className="mt-4" done={c.sessionsDone} total={c.sessionsTotal} label="Tiến độ buổi học" />
                  {c.assigned > 0 && (
                    <p className="mt-2 text-sm text-muted">
                      Đã nộp {c.submitted}/{c.assigned} bài tập
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
