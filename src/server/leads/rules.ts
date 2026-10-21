// Logic thuần của tuyển sinh (BR-002..BR-004, BR-010). Không truy cập DB.
import type { LeadStatus } from "@prisma/client";

/** BR-010: trạng thái có thể chuyển tới bằng thao tác đổi trạng thái. ENROLLED chỉ đạt qua chuyển học viên (UC-003). */
export const LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["TRIAL_SCHEDULED", "LOST"],
  TRIAL_SCHEDULED: ["TRIAL_DONE", "CONTACTED", "LOST"],
  TRIAL_DONE: ["LOST"],
  LOST: ["CONTACTED"],
  ENROLLED: [],
};

export type TransitionError = "INVALID_TRANSITION" | "LOST_REASON_REQUIRED";

export function checkLeadTransition(from: LeadStatus, to: LeadStatus, lostReason?: string | null): TransitionError | null {
  if (!LEAD_TRANSITIONS[from].includes(to)) return "INVALID_TRANSITION";
  if (to === "LOST" && !lostReason?.trim()) return "LOST_REASON_REQUIRED";
  return null;
}

/** BR-004: lead còn mở khi chưa ENROLLED/LOST. */
export function isLeadOpen(status: LeadStatus): boolean {
  return status !== "ENROLLED" && status !== "LOST";
}

export const CONVERTIBLE_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "TRIAL_SCHEDULED", "TRIAL_DONE"];

export const OVERDUE_HOURS = 24;

/** BR-003: NEW quá 24 giờ là quá hạn. */
export function isLeadOverdue(lead: { status: LeadStatus; createdAt: Date }, now: Date): boolean {
  return lead.status === "NEW" && now.getTime() - lead.createdAt.getTime() > OVERDUE_HOURS * 3_600_000;
}

export function overdueCutoff(now: Date): Date {
  return new Date(now.getTime() - OVERDUE_HOURS * 3_600_000);
}
