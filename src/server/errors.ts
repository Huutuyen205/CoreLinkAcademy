// Quy ước lỗi (docs/09-architecture §4): lỗi nghiệp vụ → thông báo cho form; lỗi quyền → 404.

export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string>,
    /** Danh sách chi tiết hiển thị dưới thông báo (vd. từng buổi trùng lịch). */
    readonly details?: string[],
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Không có quyền truy cập") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  details?: string[];
  /** Giá trị đã gửi (không gồm mật khẩu) để điền lại form khi lỗi — React 19 reset form sau action. */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = { ok: false };
