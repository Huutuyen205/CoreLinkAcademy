import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const phone = z
  .string()
  .trim()
  .min(1, "Nhập số điện thoại.")
  .max(20, "Số điện thoại không hợp lệ.")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Số điện thoại di động Việt Nam không hợp lệ." });
      return z.NEVER;
    }
    return normalized;
  });

const optionalEmail = z
  .string()
  .trim()
  .max(191)
  .transform((v) => v.toLowerCase())
  .pipe(z.union([z.literal(""), z.string().email("Email không hợp lệ.")]))
  .transform((v) => v || null);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự.`)
    .transform((v) => v || null);

const gradeLevel = z.coerce
  .number({ invalid_type_error: "Chọn khối lớp." })
  .int()
  .min(1, "Chọn khối lớp.")
  .max(12, "Chọn khối lớp.");

/** API-001 — FR-004. Giới hạn độ dài mọi trường (T-01). */
export const trialRequestSchema = z.object({
  parentName: z.string().trim().min(2, "Nhập họ tên phụ huynh.").max(120, "Tối đa 120 ký tự."),
  phone,
  email: optionalEmail,
  studentName: z.string().trim().min(2, "Nhập họ tên học sinh.").max(120, "Tối đa 120 ký tự."),
  gradeLevel,
  subjectId: z.string().trim().min(1, "Chọn môn quan tâm.").max(40),
  courseSlug: optionalText(160),
  note: optionalText(1000),
  consent: z.literal("on", { errorMap: () => ({ message: "Bạn cần đồng ý để học viện liên hệ tư vấn." }) }),
});

export type TrialRequestInput = z.infer<typeof trialRequestSchema>;

/** API-004 — FR-009. */
export const convertLeadSchema = z
  .object({
    leadId: z.string().min(1).max(40),
    studentName: z.string().trim().min(2, "Nhập họ tên học sinh.").max(120),
    gradeLevel,
    studentEmail: optionalEmail,
    studentPhone: z
      .string()
      .trim()
      .max(20)
      .transform((value, ctx) => {
        if (!value) return null;
        const normalized = normalizePhone(value);
        if (!normalized) {
          ctx.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
          return z.NEVER;
        }
        return normalized;
      }),
    parentName: z.string().trim().min(2, "Nhập họ tên phụ huynh.").max(120),
    parentPhone: phone,
    parentEmail: optionalEmail,
  })
  .superRefine((v, ctx) => {
    if (v.studentPhone && v.studentPhone === v.parentPhone) {
      ctx.addIssue({ code: "custom", path: ["studentPhone"], message: "SĐT học sinh phải khác SĐT phụ huynh." });
    }
    if (v.studentEmail && v.studentEmail === v.parentEmail) {
      ctx.addIssue({ code: "custom", path: ["studentEmail"], message: "Email học sinh phải khác email phụ huynh." });
    }
  });

export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
