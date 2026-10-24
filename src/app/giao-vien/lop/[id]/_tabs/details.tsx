import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/feedback";
import type { getClassForTeacher } from "@/server/academic/service";
import { SESSION_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { formatTime, formatVn } from "@/lib/time";

type Klass = Awaited<ReturnType<typeof getClassForTeacher>>;

export function DetailsTab({ klass, actorId }: { klass: Klass; actorId: string }) {
  const sessions = klass.isOwner ? klass.sessions : klass.sessions.filter((s) => s.teacherId === actorId);
  const done = klass.sessions.filter((s) => s.status === "COMPLETED").length;
  const info: [string, string][] = [
    ["Khóa học", klass.course.title],
    ["Lịch học", formatSchedule(klass.weekdays, klass.startTime, klass.endTime)],
    ["Phòng", klass.room?.name ?? "Chưa xếp phòng"],
    ["Giáo viên", klass.teacher.fullName],
    ["Sĩ số", `${klass.enrollments.length}/${klass.capacity}`],
    ["Tiến độ", `${done}/${klass.totalSessions} buổi`],
  ];
  return (
    <div className="space-y-6">
      <Card
        title="Thông tin lớp"
        action={
          klass.isOwner ? (
            <span className="flex flex-wrap gap-2">
              <ButtonLink href={`/giao-vien/lop/${klass.id}/danh-gia`} variant="secondary" size="sm">
                Đánh giá định kỳ
              </ButtonLink>
              <ButtonLink href={`/thong-bao/gui?lop=${klass.id}`} variant="secondary" size="sm">
                Gửi thông báo
              </ButtonLink>
              <ButtonLink href={`/tin-nhan/lop/${klass.id}`} variant="secondary" size="sm">
                Nhóm trao đổi
              </ButtonLink>
            </span>
          ) : undefined
        }
      >
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {info.map(([k, v]) => (
            <div key={k}>
              <dt className="text-sm text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Buổi học">
        <ol className="divide-y divide-line">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/giao-vien/buoi/${s.id}`} className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2 text-ink no-underline hover:text-primary">
                <span>
                  Buổi {s.index} · {formatVn(s.startsAt, "EEE dd/MM")} {formatTime(s.startsAt)}
                </span>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {s._count.attendances > 0 && <span>{s._count.attendances} em</span>}
                  {s.status !== "SCHEDULED" && <Badge tone={SESSION_STATUS[s.status].tone}>{SESSION_STATUS[s.status].label}</Badge>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
