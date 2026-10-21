"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

type Props = Omit<React.ComponentProps<typeof Button>, "type"> & { pendingLabel?: string };

/** Nút submit tự đổi chữ "Đang lưu…" và disabled khi form đang gửi (docs/08 §5). */
export function SubmitButton({ children, pendingLabel = "Đang lưu…", disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
