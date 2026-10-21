import { clsx, type ClassValue } from "clsx";

export function cn(...values: ClassValue[]): string {
  return clsx(values);
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

export function formatGradeRange(from: number, to: number): string {
  return from === to ? `Lớp ${from}` : `Lớp ${from}–${to}`;
}
