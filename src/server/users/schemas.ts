// Trường form dùng chung cho hồ sơ người dùng. (File "use server" chỉ được export hàm async nên schema để riêng.)
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(191)
  .pipe(z.union([z.literal(""), z.string().email("Email không hợp lệ.")]))
  .transform((v) => v || null);

export const phoneField = z
  .string()
  .trim()
  .max(20)
  .transform((v, ctx) => {
    if (!v) return null;
    const p = normalizePhone(v);
    if (!p) {
      ctx.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
      return z.NEVER;
    }
    return p;
  });

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự.`)
    .transform((v) => v || null);

export const optionalDate = z
  .string()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Ngày không hợp lệ.")
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null));
