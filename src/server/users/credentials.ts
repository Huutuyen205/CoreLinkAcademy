import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Tx } from "@/server/db";

/** BR-007: `HS` + năm 2 số + 4 số tăng dần. */
export function formatStudentCode(year: number, seq: number): string {
  return `HS${String(year % 100).padStart(2, "0")}${String(seq).padStart(4, "0")}`;
}

export function nextSeqFrom(lastCode: string | null | undefined): number {
  const seq = lastCode ? Number(lastCode.slice(4)) : 0;
  return Number.isFinite(seq) ? seq + 1 : 1;
}

export async function nextStudentCode(tx: Tx, now = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const prefix = formatStudentCode(year, 0).slice(0, 4);
  const last = await tx.user.findFirst({
    where: { studentCode: { startsWith: prefix } },
    orderBy: { studentCode: "desc" },
    select: { studentCode: true },
  });
  return formatStudentCode(year, nextSeqFrom(last?.studentCode));
}

// Bỏ ký tự dễ nhầm (0/O, 1/l/I).
const LETTERS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";

/** Mật khẩu tạm 10 ký tự, luôn có chữ và số (thỏa BR-006). */
export function generateTempPassword(): string {
  const all = LETTERS + DIGITS;
  const chars = [LETTERS[randomInt(LETTERS.length)]!, DIGITS[randomInt(DIGITS.length)]!];
  while (chars.length < 10) chars.push(all[randomInt(all.length)]!);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  if (!field) return true;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.some((t) => String(t).includes(field)) : String(target ?? "").includes(field);
}

/** Chạy lại tối đa 3 lần khi va chạm mã học sinh (docs/06 §3). */
export async function withStudentCodeRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= 3 || !isUniqueViolation(error, "studentCode")) throw error;
    }
  }
}
