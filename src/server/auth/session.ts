// DECISION-D09: phiên lưu trong DB; cookie chỉ chứa token ngẫu nhiên, DB lưu sha256(token).
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { db } from "@/server/db";
import { SESSION_DAYS } from "./rules";

const COOKIE_NAME = "cl_session";

export type Actor = {
  id: string;
  role: Role;
  fullName: string;
  mustChangePassword: boolean;
  avatarFileId: string | null;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  // Dọn phiên hết hạn của chính người này cùng lúc tạo phiên mới (bảng sessions không phình vô hạn).
  await Promise.all([
    db.session.create({ data: { id: hashToken(token), userId, expiresAt } }),
    db.session.deleteMany({ where: { userId, expiresAt: { lte: now } } }),
  ]);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Người dùng của phiên hiện tại, hoặc null. Gọi nhiều lần trong một request chỉ truy vấn một lần. */
export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, role: true, fullName: true, status: true, mustChangePassword: true, avatarFileId: true } },
    },
  });
  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return null;

  const { id, role, fullName, mustChangePassword, avatarFileId } = session.user;
  return { id, role, fullName, mustChangePassword, avatarFileId };
});

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(COOKIE_NAME);
}

/** Thu hồi mọi phiên của một người dùng (đổi mật khẩu, bị khóa), có thể giữ lại phiên hiện tại. */
export async function revokeUserSessions(userId: string, keepCurrent = false): Promise<void> {
  let keepId: string | undefined;
  if (keepCurrent) {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    keepId = token ? hashToken(token) : undefined;
  }
  await db.session.deleteMany({ where: { userId, ...(keepId ? { id: { not: keepId } } : {}) } });
}
