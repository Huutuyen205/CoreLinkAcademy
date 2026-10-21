import type { Metadata } from "next";
import { ConfigForm } from "@/components/forms/config-form";
import { Card, EmptyState, PageHeader } from "@/components/ui/feedback";
import { requireRole } from "@/server/auth/guard";
import { deleteRoomAction, saveRoomAction } from "@/server/catalog/actions";
import { listRoomsAdmin } from "@/server/catalog/admin";

export const metadata: Metadata = { title: "Phòng học" };

// FR-016 (chỉ Admin).
export default async function RoomsPage() {
  const actor = await requireRole("ADMIN");
  const rooms = await listRoomsAdmin(actor);
  return (
    <>
      <PageHeader title="Phòng học" />
      <div className="grid gap-4 md:grid-cols-2">
        {rooms.length === 0 && <EmptyState message="Chưa có phòng học." />}
        {rooms.map((r) => (
          <Card key={r.id} title={r.name}>
            <ConfigForm
              action={saveRoomAction}
              hidden={{ id: r.id }}
              submitLabel="Lưu"
              submitVariant="secondary"
              columns={2}
              fields={[
                { type: "text", name: "name", label: "Tên phòng", required: true, maxLength: 60, defaultValue: r.name },
                { type: "number", name: "capacity", label: "Sức chứa", required: true, min: "1", max: "500", defaultValue: String(r.capacity) },
              ]}
            />
            {r._count.classes + r._count.sessions === 0 ? (
              <ConfigForm action={deleteRoomAction} hidden={{ id: r.id }} submitLabel="Xóa phòng" submitVariant="danger" confirm="Xóa phòng này?" fields={[]} className="mt-3" />
            ) : (
              <p className="mt-3 text-sm text-muted">Đang dùng cho {r._count.classes} lớp nên không xóa được.</p>
            )}
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
            ]}
          />
        </Card>
      </div>
    </>
  );
}
