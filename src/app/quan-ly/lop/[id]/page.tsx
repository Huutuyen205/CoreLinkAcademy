import type { EnrollmentStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfigForm } from "@/components/forms/config-form";
import { Flash } from "@/components/layout/flash";
import { DataTable } from "@/components/ui/data-table";
import { TextField } from "@/components/ui/field";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { FilterForm } from "@/components/ui/filter-form";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import {
  cancelClassAction,
  cancelSessionAction,
  deleteClassAction,
  enrollStudentsAction,
  rescheduleSessionAction,
  setClassStatusAction,
  setEnrollmentStatusAction,
} from "@/server/academic/actions";
import { addMakeupSessionAction, assignSessionTeacherAction, updateClassAction } from "@/server/academic/operations-actions";
import { CLASS_TRANSITIONS, ENROLLMENT_TRANSITIONS } from "@/server/academic/rules";
import { classFormOptions, getClassForManager, listStudentsForEnrollment } from "@/server/academic/service";
import { requireRole } from "@/server/auth/guard";
import { orNotFound } from "@/server/page";
import { CLASS_STATUS, ENROLLMENT_STATUS, SESSION_STATUS } from "@/lib/labels";
import { formatSchedule } from "@/lib/schedule";
import { formatDate, formatTime, formatVn, vnDateKey } from "@/lib/time";

export const metadata: Metadata = { title: "Chi tiết lớp" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; thongbao?: string }> };

export default async function ManageClassPage({ params, searchParams }: Props) {
  const actor = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const sp = await searchParams;
  const [klass, options] = await Promise.all([orNotFound(getClassForManager(actor, id)), classFormOptions(actor)]);
  const isClosed = klass.status === "COMPLETED" || klass.status === "CANCELLED";
  const teacherOptions = options.teachers.map((t) => ({ value: t.id, label: t.fullName }));
  const roomOptions = options.rooms.map((r) => ({ value: r.id, label: `${r.name} (${r.capacity} chỗ)` }));
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const canEnroll = klass.status === "OPEN" || klass.status === "IN_PROGRESS";
  const candidates = canEnroll ? await listStudentsForEnrollment(actor, klass.id, q) : [];
  const seats = klass.enrollments.filter((e) => e.status === "ACTIVE" || e.status === "PAUSED").length;
  const nextStatuses = CLASS_TRANSITIONS[klass.status].filter((s) => s !== "CANCELLED");
  const canCancel = CLASS_TRANSITIONS[klass.status].includes("CANCELLED");
  const canDelete = klass.enrollments.length === 0 || klass.status === "CANCELLED";
  const now = new Date();

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/quan-ly/lop">← Danh sách lớp</Link>
      </p>
      <Flash code={sp.thongbao} />
      <PageHeader
        title={`Lớp ${klass.code}`}
        description={`${klass.course.title} · GV ${klass.teacher.fullName}${klass.room ? ` · ${klass.room.name}` : ""}`}
        action={
          <RowActions>
            <Badge tone={CLASS_STATUS[klass.status].tone}>{CLASS_STATUS[klass.status].label}</Badge>
            {!isClosed && (
              <ActionLink href="#sua-lop" icon="edit">
                Sửa lớp
              </ActionLink>
            )}
            <ActionLink href={`/quan-ly/lich?lop=${klass.id}`} icon="schedule">
              Lịch
            </ActionLink>
            <ActionLink href={`/tin-nhan/lop/${klass.id}`} icon="message">
              Nhóm lớp
            </ActionLink>
            {canCancel && (
              <ActionButton
                action={cancelClassAction}
                hidden={{ classId: klass.id }}
                icon="cancel"
                tone="danger"
                prompt={{ name: "reason", message: `Hủy lớp ${klass.code}? Các buổi chưa học sẽ bị hủy và lớp nhận thông báo.
Lý do (không bắt buộc):` }}
              >
                Hủy lớp
              </ActionButton>
            )}
            {canDelete && (
              <ActionButton
                action={deleteClassAction}
                hidden={{ classId: klass.id }}
                icon="delete"
                tone="danger"
                confirm={`Xóa hẳn lớp ${klass.code} cùng toàn bộ buổi học${klass.enrollments.length ? ", ghi danh, điểm danh và bài tập" : ""}? Không hoàn tác được.`}
              >
                Xóa lớp
              </ActionButton>
            )}
          </RowActions>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Thông tin lớp">
            <dl className="grid gap-3 sm:grid-cols-3">
              <Info label="Lịch học" value={formatSchedule(klass.weekdays, klass.startTime, klass.endTime)} />
              <Info label="Khai giảng" value={formatDate(klass.startDate)} />
              <Info label="Sĩ số" value={`${seats}/${klass.capacity} (đang học + bảo lưu)`} />
            </dl>
          </Card>

          <Card title={`Học sinh (${klass.enrollments.length})`}>
            {klass.enrollments.length === 0 ? (
              <EmptyState message="Lớp chưa có học sinh." />
            ) : (
              <DataTable
                caption="Học sinh của lớp"
                rows={klass.enrollments}
                rowKey={(e) => e.id}
                columns={[
                  {
                    header: "Học sinh",
                    primary: true,
                    cell: (e) => (
                      <Link href={`/quan-ly/hoc-vien/${e.student.id}`}>
                        {e.student.fullName} ({e.student.studentCode ?? "—"})
                      </Link>
                    ),
                  },
                  { header: "Trạng thái", cell: (e) => <Badge tone={ENROLLMENT_STATUS[e.status].tone}>{ENROLLMENT_STATUS[e.status].label}</Badge> },
                  {
                    header: "Đổi trạng thái",
                    cell: (e) =>
                      ENROLLMENT_TRANSITIONS[e.status].length === 0 ? (
                        <span className="text-sm text-muted">Trạng thái cuối</span>
                      ) : (
                        <ConfigForm
                          action={setEnrollmentStatusAction}
                          hidden={{ enrollmentId: e.id }}
                          submitLabel="Lưu"
                          submitVariant="secondary"
                          className="space-y-2"
                          fields={[
                            {
                              type: "select",
                              name: "status",
                              label: "Chuyển sang",
                              required: true,
                              placeholder: "Chọn",
                              options: ENROLLMENT_TRANSITIONS[e.status].map((s: EnrollmentStatus) => ({ value: s, label: ENROLLMENT_STATUS[s].label })),
                            },
                          ]}
                        />
                      ),
                  },
                ]}
              />
            )}
          </Card>

          <Card title={`Buổi học (${klass.sessions.length})`}>
            <ol className="divide-y divide-line">
              {klass.sessions.map((s) => (
                <li key={s.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        Buổi {s.index} · {formatVn(s.startsAt, "EEEE dd/MM/yyyy")}
                        {s.isMakeup && (
                          <span className="ml-2 align-middle">
                            <Badge tone="primary">Học bù</Badge>
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted">
                        {formatTime(s.startsAt)}–{formatTime(s.endsAt)} · {s.teacher.fullName}
                        {s.room ? ` · ${s.room.name}` : ""} · đã điểm danh {s._count.attendances} em
                      </p>
                      {s.teacherId !== klass.teacherId && <p className="text-sm text-warning">Giáo viên dạy thay: {s.teacher.fullName}</p>}
                      {s.note && <p className="text-sm text-muted">Ghi chú: {s.note}</p>}
                      {s.cancelReason && <p className="text-sm text-danger">Lý do hủy: {s.cancelReason}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={SESSION_STATUS[s.status].tone}>{SESSION_STATUS[s.status].label}</Badge>
                      {s.status !== "CANCELLED" && (
                        <Link href={`/quan-ly/buoi/${s.id}`} className="inline-flex min-h-11 items-center px-1 text-sm">
                          Điểm danh
                        </Link>
                      )}
                    </div>
                  </div>
                  {s.status === "SCHEDULED" && s.startsAt > now && (
                    <details>
                      <summary className="cursor-pointer py-2.5 text-sm text-primary">Dời, hủy hoặc đổi giáo viên</summary>
                      <div className="mt-3 grid gap-6 md:grid-cols-2">
                        <ConfigForm
                          action={assignSessionTeacherAction}
                          hidden={{ sessionId: s.id }}
                          submitLabel="Phân công"
                          submitVariant="secondary"
                          className="md:col-span-2"
                          fields={[
                            { type: "select", name: "teacherId", label: "Giáo viên dạy buổi này", required: true, options: teacherOptions, defaultValue: s.teacherId },
                            { type: "text", name: "note", label: "Ghi chú (tùy chọn)", maxLength: 255 },
                          ]}
                        />
                        <ConfigForm
                          action={rescheduleSessionAction}
                          hidden={{ sessionId: s.id }}
                          submitLabel="Dời buổi"
                          submitVariant="secondary"
                          fields={[
                            { type: "date", name: "date", label: "Ngày mới", required: true, defaultValue: vnDateKey(s.startsAt) },
                            { type: "time", name: "startTime", label: "Bắt đầu", required: true, defaultValue: formatTime(s.startsAt) },
                            { type: "time", name: "endTime", label: "Kết thúc", required: true, defaultValue: formatTime(s.endsAt) },
                            { type: "text", name: "reason", label: "Lý do", required: true, maxLength: 255 },
                          ]}
                        />
                        <ConfigForm
                          action={cancelSessionAction}
                          hidden={{ sessionId: s.id }}
                          submitLabel="Hủy buổi"
                          submitVariant="danger"
                          confirm="Hủy buổi học này?"
                          fields={[{ type: "text", name: "reason", label: "Lý do hủy", required: true, maxLength: 255 }]}
                        />
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          {!isClosed && (
            <Card title="Sửa lớp / phân công giáo viên" className="scroll-mt-24" id="sua-lop">
              <ConfigForm
                action={updateClassAction}
                hidden={{ classId: klass.id }}
                submitLabel="Lưu"
                submitVariant="secondary"
                confirm="Đổi giáo viên hoặc phòng sẽ áp dụng cho các buổi chưa diễn ra và gửi thông báo cho lớp. Tiếp tục?"
                fields={[
                  { type: "text", name: "code", label: "Mã lớp", required: true, maxLength: 30, defaultValue: klass.code },
                  { type: "select", name: "teacherId", label: "Giáo viên phụ trách", required: true, options: teacherOptions, defaultValue: klass.teacherId },
                  { type: "select", name: "roomId", label: "Phòng", placeholder: "Chưa xếp phòng", options: roomOptions, defaultValue: klass.roomId ?? "" },
                  { type: "number", name: "capacity", label: "Sĩ số tối đa", required: true, min: "1", max: "100", defaultValue: String(klass.capacity) },
                ]}
              />
            </Card>
          )}

          {!isClosed && (
            <Card title="Xếp buổi học bù">
              <ConfigForm
                action={addMakeupSessionAction}
                hidden={{ classId: klass.id }}
                submitLabel="Thêm buổi học bù"
                submitVariant="secondary"
                fields={[
                  { type: "date", name: "date", label: "Ngày", required: true },
                  { type: "time", name: "startTime", label: "Bắt đầu", required: true, defaultValue: klass.startTime },
                  { type: "time", name: "endTime", label: "Kết thúc", required: true, defaultValue: klass.endTime },
                  { type: "select", name: "teacherId", label: "Giáo viên", placeholder: "Giáo viên phụ trách lớp", options: teacherOptions },
                  { type: "select", name: "roomId", label: "Phòng", placeholder: "Phòng của lớp", options: roomOptions },
                  { type: "text", name: "note", label: "Ghi chú (vd. bù buổi nghỉ lễ)", maxLength: 255 },
                ]}
              />
            </Card>
          )}

          {canEnroll && (
            <Card title="Ghi danh học sinh">
              <FilterForm className="mb-4">
                <TextField name="q" label="Tìm theo tên hoặc mã HS" defaultValue={q} maxLength={80} />
              </FilterForm>
              {candidates.length === 0 ? (
                <p className="text-sm text-muted">Không có học sinh phù hợp để ghi danh.</p>
              ) : (
                <ConfigForm
                  action={enrollStudentsAction}
                  hidden={{ classId: klass.id }}
                  submitLabel="Ghi danh"
                  fields={[
                    {
                      type: "checkboxes",
                      name: "studentIds",
                      label: `Chọn học sinh (còn ${Math.max(0, klass.capacity - seats)} chỗ)`,
                      options: candidates.map((c) => ({ value: c.id, label: `${c.fullName} · ${c.studentCode ?? ""}${c.gradeLevel ? ` · lớp ${c.gradeLevel}` : ""}` })),
                    },
                  ]}
                />
              )}
            </Card>
          )}

          {nextStatuses.length > 0 && (
            <Card title="Trạng thái lớp">
              <ConfigForm
                action={setClassStatusAction}
                hidden={{ classId: klass.id }}
                submitLabel="Cập nhật"
                confirm="Đổi trạng thái lớp? Kết thúc lớp không hoàn tác được."
                fields={[
                  {
                    type: "select",
                    name: "status",
                    label: "Chuyển sang",
                    required: true,
                    placeholder: "Chọn",
                    hint: "Kết thúc: học sinh đang học → hoàn thành. Muốn hủy lớp: dùng nút \"Hủy lớp\" ở đầu trang.",
                    options: nextStatuses.map((s) => ({ value: s, label: CLASS_STATUS[s].label })),
                  },
                ]}
              />
            </Card>
          )}

          {(canCancel || canDelete) && (
            <Card title="Hủy / xóa lớp">
              <ul className="mb-3 space-y-1 text-sm text-muted">
                <li>
                  <strong className="text-ink">Hủy lớp:</strong> giữ lại lịch sử, các buổi chưa học bị hủy, GV/HS/PH nhận thông báo.
                </li>
                <li>
                  <strong className="text-ink">Xóa lớp:</strong> xóa hẳn. Lớp đã có học sinh phải hủy trước rồi mới xóa được.
                </li>
              </ul>
              <RowActions>
                {canCancel && (
                  <ActionButton action={cancelClassAction} hidden={{ classId: klass.id }} icon="cancel" tone="danger" prompt={{ name: "reason", message: `Hủy lớp ${klass.code}?
Lý do (không bắt buộc):` }}>
                    Hủy lớp
                  </ActionButton>
                )}
                {canDelete && (
                  <ActionButton action={deleteClassAction} hidden={{ classId: klass.id }} icon="delete" tone="danger" confirm={`Xóa hẳn lớp ${klass.code}? Không hoàn tác được.`}>
                    Xóa lớp
                  </ActionButton>
                )}
              </RowActions>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
