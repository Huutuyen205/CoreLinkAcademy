"use client";

import { ChevronDown, Download, KeyRound, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { logout } from "@/server/auth/actions";
import type { NavItem } from "./nav-links";

/**
 * Menu người dùng ở góc phải thanh trên: ảnh + tên, mở ra hồ sơ, đổi mật khẩu, cài ứng dụng, đăng xuất.
 * `compact` (điện thoại): chỉ còn ảnh đại diện; `extraNav`: mục điều hướng không có trên thanh đáy.
 */
export function UserMenu({
  fullName,
  roleLabel,
  avatarFileId,
  compact = false,
  extraNav = [],
}: {
  fullName: string;
  roleLabel: string;
  avatarFileId: string | null;
  compact?: boolean;
  extraNav?: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink no-underline hover:bg-paper";
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={compact ? `Tài khoản của ${fullName}` : undefined}
        className={
          compact
            ? "flex size-10 cursor-pointer items-center justify-center rounded-full ring-2 ring-white/30"
            : "flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-primary-soft"
        }
      >
        <Avatar name={fullName} fileId={avatarFileId} size={compact ? "md" : "sm"} />
        {!compact && (
          <>
            <span className="hidden min-w-0 text-left leading-tight xl:block">
              <span className="block max-w-40 truncate text-sm font-semibold text-ink">{fullName}</span>
              <span className="block text-[11px] text-muted">{roleLabel}</span>
            </span>
            <ChevronDown className="size-4 text-muted" aria-hidden="true" />
          </>
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden text-ink rounded-block border border-line bg-surface shadow-xl">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar name={fullName} fileId={avatarFileId} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{fullName}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
          </div>
          <Link href="/tai-khoan" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <User className="size-4 text-muted" aria-hidden="true" /> Hồ sơ &amp; ảnh đại diện
          </Link>
          <Link href="/doi-mat-khau" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <KeyRound className="size-4 text-muted" aria-hidden="true" /> Đổi mật khẩu
          </Link>
          <Link href="/cai-ung-dung" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <Download className="size-4 text-muted" aria-hidden="true" /> Cài ứng dụng
          </Link>
          {extraNav.length > 0 && (
            <div className="border-t border-line py-1">
              {extraNav.map((i) => (
                <Link key={i.href} href={i.href} role="menuitem" onClick={() => setOpen(false)} className={item}>
                  {i.label}
                </Link>
              ))}
            </div>
          )}
          <form action={logout} className="border-t border-line">
            <button type="submit" role="menuitem" className={`${item} text-danger`}>
              <LogOut className="size-4" aria-hidden="true" /> Đăng xuất
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
