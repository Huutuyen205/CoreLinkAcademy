import { hash, verify } from "@node-rs/argon2";

// NFR-006: Argon2id (mặc định của @node-rs/argon2), tham số theo khuyến nghị OWASP.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/** Băm giả khi không tìm thấy tài khoản để thời gian phản hồi tương đương. */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("khong-ton-tai-0");
  await verifyPassword(await dummyHash, password);
}
