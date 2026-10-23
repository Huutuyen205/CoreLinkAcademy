"use client";

import type { LeadStatus } from "@prisma/client";
import { Clock, GripVertical, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/format";
import { initialActionState } from "@/server/errors";
import { changeLeadStatusAction } from "@/server/leads/actions";
import { LEAD_TRANSITIONS } from "@/server/leads/rules";

export type BoardLead = {
  id: string;
  parentName: string;
  studentName: string;
  phone: string;
  phoneLabel: string;
  gradeLevel: number | null;
  interest: string | null;
  createdLabel: string;
  overdue: boolean;
};
export type BoardColumn = { status: LeadStatus; label: string; total: number; leads: BoardLead[] };

const COLUMN_TONE: Record<LeadStatus, string> = {
  NEW: "border-t-accent",
  CONTACTED: "border-t-primary-light",
  TRIAL_SCHEDULED: "border-t-warning",
  TRIAL_DONE: "border-t-primary",
  ENROLLED: "border-t-success",
  LOST: "border-t-danger",
};

/**
 * FEAT-B1: lead theo giai đoạn. Kéo thẻ sang cột khác = đổi trạng thái (server kiểm tra lại BR-010).
 * "Đã nhập học" chỉ đạt qua "Chuyển thành học viên" (FR-009) → thả vào đó sẽ mở trang lead.
 */
export function LeadBoard({ columns, labels }: { columns: BoardColumn[]; labels: Record<LeadStatus, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState<{ id: string; from: LeadStatus } | null>(null);
  const [over, setOver] = useState<LeadStatus | null>(null);

  const move = (leadId: string, from: LeadStatus, to: LeadStatus, name: string) => {
    if (from === to) return;
    if (to === "ENROLLED") {
      router.push(`/quan-ly/lead/${leadId}#chuyen-hoc-vien`);
      return;
    }
    if (!LEAD_TRANSITIONS[from].includes(to)) {
      toast(`Không chuyển được từ "${labels[from]}" sang "${labels[to]}".`, "danger");
      return;
    }
    let lostReason = "";
    if (to === "LOST") {
      const reason = window.prompt(`Lý do "${name}" không theo học?`);
      if (!reason?.trim()) return;
      lostReason = reason.trim();
    }
    start(async () => {
      const fd = new FormData();
      fd.set("leadId", leadId);
      fd.set("status", to);
      fd.set("lostReason", lostReason);
      const result = await changeLeadStatusAction(initialActionState, fd);
      toast(result.ok ? `${name}: ${labels[to]}` : (result.message ?? "Không cập nhật được."), result.ok ? "success" : "danger");
      router.refresh();
    });
  };

  return (
    <div className={cn("-mx-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:px-0", pending && "opacity-80")}>
      <div className="flex min-w-max gap-3">
        {columns.map((col) => {
          const canDrop = dragging !== null && dragging.from !== col.status && (col.status === "ENROLLED" || LEAD_TRANSITIONS[dragging.from].includes(col.status));
          return (
            <section
              key={col.status}
              aria-label={`${col.label}: ${col.total} lead`}
              onDragOver={(e) => {
                if (!canDrop) return;
                e.preventDefault();
                setOver(col.status);
              }}
              onDragLeave={() => setOver((s) => (s === col.status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const data = dragging;
                setDragging(null);
                if (!data) return;
                const lead = columns.find((c) => c.status === data.from)?.leads.find((l) => l.id === data.id);
                move(data.id, data.from, col.status, lead?.parentName ?? "Lead");
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-block border border-t-4 border-line bg-paper-2/60",
                COLUMN_TONE[col.status],
                dragging && !canDrop && dragging.from !== col.status && "opacity-50",
                over === col.status && "ring-2 ring-accent",
              )}
            >
              <header className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-bold">{col.label}</h2>
                <span className="rounded-full bg-surface px-2 text-xs font-bold text-muted">{col.total}</span>
              </header>
              <ul className="custom-scrollbar flex max-h-[65dvh] flex-col gap-2 overflow-y-auto px-2 pb-2">
                {col.leads.length === 0 && <li className="rounded-control border border-dashed border-line p-3 text-center text-xs text-muted">Trống</li>}
                {col.leads.map((l) => {
                  const targets = LEAD_TRANSITIONS[col.status];
                  return (
                    <li
                      key={l.id}
                      draggable={col.status !== "ENROLLED"}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", l.id);
                        setDragging({ id: l.id, from: col.status });
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      className={cn("group rounded-control border bg-surface p-3 shadow-sm", l.overdue ? "border-warning/60" : "border-line", col.status !== "ENROLLED" && "cursor-grab active:cursor-grabbing")}
                    >
                      <div className="flex items-start gap-1.5">
                        {col.status !== "ENROLLED" && <GripVertical className="mt-0.5 hidden size-4 shrink-0 text-subtle lg:block" aria-hidden="true" />}
                        <div className="min-w-0 flex-1">
                          <Link href={`/quan-ly/lead/${l.id}`} className="block truncate font-semibold">
                            {l.parentName}
                          </Link>
                          <p className="truncate text-xs text-muted">
                            HS: {l.studentName}
                            {l.gradeLevel ? ` · lớp ${l.gradeLevel}` : ""}
                          </p>
                          {l.interest && <p className="truncate text-xs text-primary">{l.interest}</p>}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 no-underline">
                          <Phone className="size-3.5" aria-hidden="true" />
                          {l.phoneLabel}
                        </a>
                        <span className={cn("inline-flex items-center gap-1", l.overdue ? "font-semibold text-warning" : "text-muted")}>
                          <Clock className="size-3.5" aria-hidden="true" />
                          {l.overdue ? "Quá 24 giờ" : l.createdLabel}
                        </span>
                      </div>
                      {targets.length > 0 && (
                        <label className="mt-2 block">
                          <span className="sr-only">Chuyển {l.parentName} sang</span>
                          <select
                            value=""
                            disabled={pending}
                            onChange={(e) => move(l.id, col.status, e.target.value as LeadStatus, l.parentName)}
                            className="block min-h-9 w-full rounded-control border border-line bg-paper px-2 text-xs"
                          >
                            <option value="">Chuyển sang…</option>
                            {targets.map((t) => (
                              <option key={t} value={t}>
                                {labels[t]}
                              </option>
                            ))}
                            {col.status !== "LOST" && <option value="ENROLLED">{labels.ENROLLED} (chuyển học viên)</option>}
                          </select>
                        </label>
                      )}
                    </li>
                  );
                })}
                {col.total > col.leads.length && (
                  <li className="text-center text-xs">
                    <Link href={`/quan-ly/lead?status=${col.status}`}>Xem tất cả {col.total} →</Link>
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
