import type { Role } from "@prisma/client";

export type ChatLink = { label: string; href: string };

/** Nút bấm trong câu trả lời (chọn con, chọn ngày…): bấm = gửi lại đúng ý định với tham số đã chọn. */
export type ChatChoice = { label: string; intent: string; childId?: string; day?: number; classCode?: string };

export type ChatAnswer = {
  intent: string;
  text: string;
  lines: string[];
  links: ChatLink[];
  choices: ChatChoice[];
  /** chip: bấm câu gợi ý · rule: khớp từ khóa · ai: AI nhận diện ý định · fallback: không hiểu */
  via: "chip" | "rule" | "ai" | "fallback";
};

export type ChatRequest = {
  text?: string;
  intent?: string;
  childId?: string;
  day?: number;
  classCode?: string;
};

export type IntentDef = {
  id: string;
  roles: Role[];
  /** Nhãn nút gợi ý; có thể khác theo vai trò. */
  label: string;
  labels?: Partial<Record<Role, string>>;
  /** Mô tả ngắn cho AI nhận diện ý định. */
  description: string;
  /** Cụm từ đã chuẩn hóa (không dấu, chữ thường) → trọng số. */
  keywords: Record<string, number>;
  /** Hiện thành nút gợi ý (thứ tự trong danh sách). */
  chip?: boolean;
};
