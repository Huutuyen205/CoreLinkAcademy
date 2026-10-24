import Link from "next/link";
import { EvaluationList } from "@/components/learner/evaluation-list";
import { ProgressBar } from "@/components/learner/progress-bar";
import { FileList } from "@/components/files/file-list";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { TabLinks } from "@/components/ui/tab-links";
import { getClassForStudent } from "@/server/academic/learner";
import { attendanceRate, formatRate } from "@/server/attendance/rules";
import { requireLearner } from "@/server/auth/learner";
import type { Actor } from "@/server/auth/session";
import { listDocuments } from "@/server/documents/service";
import { orNotFound } from "@/server/page";
import { ATTENDANCE_STATUS, ATTITUDE, CLASS_STATUS, DOCUMENT_KIND, ENROLLMENT_STATUS, SESSION_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { formatDate, formatTime, formatVn } from "@/lib/time";

const TABS = [
  { key: "chi-tiet", label: "Chi tiết lớp" },
  { key: "tai-lieu", label: "Tài liệu học tập" },
] as const;

type Klass = Awaited<ReturnType<typeof getClassForStudent>>;

// Học sinh / phụ huynh (của con đang chọn): chi tiết một lớp — thông tin lớp, các buổi (điểm danh + đánh giá từng buổi), tài liệu học tập (mô phỏng trang lớp của giáo viên).
export async function LearnerClassDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { viewer, student, base } = await requireLearner();
  const { id } = await params;
  const tab = (await searchParams).tab === "tai-lieu" ? "tai-lieu" : "chi-tiet";
  const klass = await orNotFound(getClassForStudent(student, id));
  const state = klass.enrollmentStatus === "PAUSED" ? ENROLLMENT_STATUS.PAUSED : klass.enrollmentStatus === "COMPLETED" ? ENROLLMENT_STATUS.COMPLETED : CLASS_STATUS[klass.status];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`${base}/lop`}>← Lớp học</Link>
      </p>
      <PageHeader title={`Lớp ${klass.code}`} action={<Badge tone={state.tone}>{state.label}</Badge>} />
      <TabLinks
        label="Mục của lớp"
        active={tab}
        tabs={TABS.map((t) => ({ key: t.key, label: t.label, href: t.key === "chi-tiet" ? `${base}/lop/${klass.id}` : `${base}/lop/${klass.id}?tab=${t.key}` }))}
      />
      {tab === "tai-lieu" ? <MaterialsTab classId={klass.id} viewer={viewer} /> : <DetailsTab klass={klass} base={base} />}
    </>
  );
}

function DetailsTab({ klass, base }: { klass: Klass; base: string }) {
  const now = Date.now();
  const counted = klass.sessions.filter((s) => s.status !== "CANCELLED");
  const done = counted.filter((s) => s.startsAt.getTime() <= now).length;
  const rate = attendanceRate(klass.sessions.flatMap((s) => (s.attendance ? [{ status: s.attendance.status, sessionCancelled: s.status === "CANCELLED" }] : [])));
  const current = klass.sessions.find((s) => s.status !== "CANCELLED" && s.status !== "COMPLETED" && s.endsAt.getTime() > now);
  const ongoing = !!current && current.startsAt.getTime() <= now;

  return (
    <div className="space-y-6">
      <Card>
        <p className="truncate text-lg font-semibold text-primary">
          {klass.code} - {klass.room?.name ?? "Chưa xếp phòng"}
        </p>
        <p className="truncate">GV {klass.teacher.fullName}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-muted">Khóa học</dt>
            <dd className="text-base">{klass.course.title}</dd>
          </div>
          <div>
            <dt className="text-muted">Lịch học</dt>
            <dd className="text-base">{formatSchedule(klass.weekdays, klass.startTime, klass.endTime)}</dd>
          </div>
          <div>
            <dt className="text-muted">Chuyên cần</dt>
            <dd className="text-base">{formatRate(rate)}</dd>
          </div>
        </dl>
        <ProgressBar className="mt-4" done={done} total={counted.length} label="Tiến độ buổi học" />
      </Card>

      {current && (
        <Card title={ongoing ? "Buổi đang học" : "Buổi học sắp tới"}>
          <Link href={`${base}/buoi/${current.id}`} className="flex min-h-12 flex-wrap items-center justify-between gap-2 text-ink no-underline hover:text-primary">
            <span className="font-medium">
              Buổi {current.index} · {formatVn(current.startsAt, "EEEE dd/MM")} {formatTime(current.startsAt)}–{formatTime(current.endsAt)}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted">
              <Badge tone={ongoing ? "success" : "primary"}>{ongoing ? "Đang học" : "Sắp tới"}</Badge>
              <span className="text-primary">Xem buổi →</span>
            </span>
          </Link>
        </Card>
      )}

      <Card title="Buổi học">
        {klass.sessions.length === 0 ? (
          <EmptyState message="Lớp chưa có buổi học nào." />
        ) : (
          <ol className="divide-y divide-line">
            {klass.sessions.map((s) => {
              const att = s.attendance;
              const attitude = att?.attitude ? ATTITUDE[att.attitude] : undefined;
              return (
                <li key={s.id}>
                  <Link href={`${base}/buoi/${s.id}`} className="block py-3 text-ink no-underline hover:text-primary">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0">
                        Buổi {s.index} · {formatVn(s.startsAt, "EEE dd/MM")} {formatTime(s.startsAt)}
                        {s.isMakeup && <span className="text-sm text-muted"> (học bù)</span>}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-sm">
                        {s.status === "CANCELLED" ? (
                          <Badge tone={SESSION_STATUS.CANCELLED.tone}>{SESSION_STATUS.CANCELLED.label}</Badge>
                        ) : att ? (
                          <Badge tone={ATTENDANCE_STATUS[att.status].tone}>{ATTENDANCE_STATUS[att.status].label}</Badge>
                        ) : s.startsAt.getTime() <= now ? (
                          <span className="text-muted">Chưa điểm danh</span>
                        ) : (
                          <span className="text-muted">Chưa diễn ra</span>
                        )}
                        {attitude && <Badge tone={attitude.tone}>{attitude.label}</Badge>}
                      </span>
                    </span>
                    {att?.comment && <span className="mt-1 block whitespace-pre-line text-sm text-muted">Nhận xét: {att.comment}</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <EvaluationList evaluations={klass.evaluations} hideWhenEmpty />
    </div>
  );
}

// Tài liệu theo quyền của người đang đăng nhập (phụ huynh chỉ thấy tài liệu cho phép phụ huynh xem); lớp đã được kiểm tra ghi danh của học sinh ở trên.
async function MaterialsTab({ classId, viewer }: { classId: string; viewer: Actor }) {
  const docs = await listDocuments(viewer, { classId });
  return (
    <Card title={`Tài liệu học tập (${docs.length})`}>
      {docs.length === 0 ? (
        <EmptyState message="Giáo viên chưa chia sẻ tài liệu nào cho lớp." />
      ) : (
        <ul className="space-y-4">
          {docs.map((d) => (
            <li key={d.id}>
              <p className="font-medium">
                <Link href={`/tai-lieu/${d.id}`}>{d.title}</Link>{" "}
                <span className="text-sm font-normal text-muted">
                  · {DOCUMENT_KIND[d.kind]} · {formatDate(d.updatedAt)}
                </span>
              </p>
              {d.description && <p className="line-clamp-2 text-sm text-muted">{d.description}</p>}
              {d.files.length > 0 && (
                <div className="mt-2">
                  <FileList files={d.files} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
