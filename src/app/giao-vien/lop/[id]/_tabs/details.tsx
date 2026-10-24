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
  const now = Date.now();
  // Buổi đang học (đang diễn ra) hoặc sắp tới gần nhất — đưa lên đầu trang.
  const current = sessions.find((s) => s.status !== "CANCELLED" && s.status !== "COMPLETED" && s.endsAt.getTime() > now);
  const ongoing = !!current && current.startsAt.getTime() <= now;
  const done = klass.sessions.filter((s) => s.status === "COMPLETED").length;
  const room = klass.room?.name ?? "Chưa xếp phòng";
  return (
    <div className="space-y-6">
      <Card>
        <p className="truncate text-lg font-semibold text-primary">
          {klass.code} - {room}
        </p>
        <p className="truncate">{klass.teacher.fullName}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-muted">Khóa học</dt>
            <dd className="text-base">{klass.course.title}</dd>
          </div>
          <div>
            <dt className="text-muted">Lịch học</dt>
            <dd className="text-base">{formatSchedule(klass.weekdays, klass.startTime, klass.endTime)}</dd>
          </div>
          <div className="flex gap-x-8">
            <div>
              <dt className="text-muted">Sĩ số</dt>
              <dd className="text-base">
                {klass.enrollments.length}/{klass.capacity}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Tiến độ</dt>
              <dd className="text-base">
                {done}/{klass.totalSessions} buổi
              </dd>
            </div>
          </div>
        </dl>
        {klass.isOwner && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
            {[
              { href: `/giao-vien/lop/${klass.id}/danh-gia`, label: "Đánh giá định kỳ" },
              { href: `/thong-bao/gui?lop=${klass.id}`, label: "Gửi thông báo" },
              { href: `/tin-nhan/lop/${klass.id}`, label: "Nhóm trao đổi" },
            ].map((b) => (
              <ButtonLink key={b.href} href={b.href} variant="secondary" size="sm" className="h-auto min-h-11 w-full whitespace-normal px-2 py-1 text-center text-xs leading-tight sm:text-sm">
                {b.label}
              </ButtonLink>
            ))}
          </div>
        )}
      </Card>

      {current && (
        <Card title={ongoing ? "Buổi đang học" : "Buổi học sắp tới"}>
          <Link href={`/giao-vien/buoi/${current.id}`} className="flex min-h-12 flex-wrap items-center justify-between gap-2 text-ink no-underline hover:text-primary">
            <span className="font-medium">
              Buổi {current.index} · {formatVn(current.startsAt, "EEEE dd/MM")} {formatTime(current.startsAt)}–{formatTime(current.endsAt)}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted">
              <Badge tone={ongoing ? "success" : "primary"}>{ongoing ? "Đang học" : "Sắp tới"}</Badge>
              <span className="text-primary">Vào buổi →</span>
            </span>
          </Link>
        </Card>
      )}

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
