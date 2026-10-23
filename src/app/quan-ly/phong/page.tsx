import type { Metadata } from "next";
import { ConfigForm } from "@/components/forms/config-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import { requireRole } from "@/server/auth/guard";
import { deleteRoomAction, saveRoomAction, setCatalogActiveAction } from "@/server/catalog/actions";
import { listRoomsAdmin, roomUsage } from "@/server/catalog/admin";
import { formatTime, formatVn, parseWeekParam, vnWeekRange } from "@/lib/time";

export const metadata: Metadata = { title: "Phòng học" };

// FR-016 + Admin §8: thêm/sửa phòng, trạng thái (ngừng sử dụng không xếp được cho lớp/buổi mới), xem lịch sử dụng phòng.
export default async function RoomsPage() {
  const actor = await requireRole("ADMIN");
  const { from, to } = vnWeekRange(parseWeekParam(undefined));
  const [rooms, usage] = await Promise.all([listRoomsAdmin(actor), roomUsage(actor, from, to)]);
  return (
    <>
      <PageHeader title="Phòng học" description="Phòng tạm ngừng sẽ không chọn được khi mở lớp, xếp học bù hoặc đổi phòng." />
      <div className="grid gap-4 md:grid-cols-2">
        {rooms.length === 0 && <EmptyState message="Chưa có phòng học." />}
        {rooms.map((r) => (
          <Card
            key={r.id}
            title={r.name}
            action={
              <RowActions>
                {!r.isActive && <Badge tone="neutral">Tạm ngừng</Badge>}
                <ActionLink href={`/quan-ly/lich?phong=${r.id}`} icon="schedule">
                  Lịch
                </ActionLink>
                <ActionButton action={setCatalogActiveAction} hidden={{ kind: "room", id: r.id, active: r.isActive ? "0" : "1" }} icon={r.isActive ? "hide" : "restore"} tone={r.isActive ? "default" : "success"}>
                  {r.isActive ? "Tạm ngừng" : "Dùng lại"}
                </ActionButton>
                {r._count.classes + r._count.sessions === 0 && (
                  <ActionButton action={deleteRoomAction} hidden={{ id: r.id }} icon="delete" tone="danger" confirm={`Xóa phòng ${r.name}?`}>
                    Xóa
                  </ActionButton>
                )}
              </RowActions>
            }
          >
            <RoomUsageLine u={usage.get(r.id)} />
            <ConfigForm
              action={saveRoomAction}
              hidden={{ id: r.id, statusField: "1" }}
              submitLabel="Lưu"
              submitVariant="secondary"
              columns={2}
              fields={[
                { type: "text", name: "name", label: "Tên phòng", required: true, maxLength: 60, defaultValue: r.name },
                { type: "number", name: "capacity", label: "Sức chứa", required: true, min: "1", max: "500", defaultValue: String(r.capacity) },
                { type: "text", name: "note", label: "Ghi chú (thiết bị, tầng…)", maxLength: 255, wide: true, defaultValue: r.note ?? "" },
                { type: "checkbox", name: "isActive", label: "Đang sử dụng", defaultChecked: r.isActive, wide: true },
              ]}
            />
            {r._count.classes + r._count.sessions > 0 && <p className="mt-3 text-sm text-muted">Đang dùng cho {r._count.classes} lớp nên không xóa được.</p>}
          </Card>
        ))}
        <Card title="Thêm phòng">
          <ConfigForm
            action={saveRoomAction}
            submitLabel="Thêm phòng"
            columns={2}
            fields={[
              { type: "text", name: "name", label: "Tên phòng", required: true, maxLength: 60 },
              { type: "number", name: "capacity", label: "Sức chứa", required: true, min: "1", max: "500", defaultValue: "16" },
              { type: "text", name: "note", label: "Ghi chú", maxLength: 255, wide: true },
            ]}
          />
        </Card>
      </div>
    </>
  );
}

/** Tình trạng sử dụng phòng (Admin §8): đang có lớp không, buổi kế tiếp, mức dùng trong tuần. */
function RoomUsageLine({ u }: { u?: { weekSessions: number; weekMinutes: number; current: { classCode: string; endsAt: Date } | null; next: { classCode: string; startsAt: Date } | null } }) {
  return (
    <div className="mb-4 grid gap-2 rounded-control bg-paper p-3 text-sm sm:grid-cols-3">
      <p>
        <span className="block text-xs text-muted">Bây giờ</span>
        {u?.current ? (
          <span className="font-semibold text-danger">
            Đang học lớp {u.current.classCode} (đến {formatTime(u.current.endsAt)})
          </span>
        ) : (
          <span className="font-semibold text-success">Trống</span>
        )}
      </p>
      <p>
        <span className="block text-xs text-muted">Buổi kế tiếp</span>
        {u?.next ? `${u.next.classCode} · ${formatVn(u.next.startsAt, "EEE dd/MM HH:mm")}` : "Chưa có lịch"}
      </p>
      <p>
        <span className="block text-xs text-muted">Tuần này</span>
        {u ? `${u.weekSessions} buổi · ${Math.round((u.weekMinutes / 60) * 10) / 10} giờ` : "0 buổi"}
      </p>
    </div>
  );
}
