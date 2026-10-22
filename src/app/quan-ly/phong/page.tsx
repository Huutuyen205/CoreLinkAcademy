import type { Metadata } from "next";
import { ConfigForm } from "@/components/forms/config-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { ActionButton, ActionLink, RowActions } from "@/components/ui/row-actions";
import { requireRole } from "@/server/auth/guard";
import { deleteRoomAction, saveRoomAction, setCatalogActiveAction } from "@/server/catalog/actions";
import { listRoomsAdmin } from "@/server/catalog/admin";

export const metadata: Metadata = { title: "Phòng học" };

// FR-016 + Admin §8: thêm/sửa phòng, trạng thái (ngừng sử dụng không xếp được cho lớp/buổi mới), xem lịch sử dụng phòng.
export default async function RoomsPage() {
  const actor = await requireRole("ADMIN");
  const rooms = await listRoomsAdmin(actor);
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
