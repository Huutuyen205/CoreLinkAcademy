"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/components/layout/brand";
import { cn } from "@/lib/format";
import { NAV_ITEMS, type NavItem } from "@/data/nav";

const pillCta =
  "pulse-ring inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white no-underline shadow-md transition-colors hover:bg-primary-strong";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className={cn("sticky top-0 z-40 bg-white transition-shadow duration-300", scrolled ? "shadow-lg" : "shadow-sm")}>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
        <Brand href="/" />

        <nav aria-label="Điều hướng chính" className="hidden items-center lg:flex">
          {NAV_ITEMS.map((item) => (
            <DesktopItem key={item.label} item={item} open={open === item.label} setOpen={setOpen} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/dang-ky-hoc-thu" className={cn(pillCta, "hidden sm:inline-flex")}>
            Đăng ký học thử
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-soft lg:hidden"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            aria-controls="menu-di-dong"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-30 bg-primary-strong/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.nav
              key="panel"
              id="menu-di-dong"
              aria-label="Menu di động"
              className="fixed inset-y-0 right-0 z-40 flex w-[min(86vw,22rem)] flex-col overflow-y-auto bg-white p-4 shadow-2xl lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <Brand href="/" />
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-full text-primary hover:bg-primary-soft"
                  aria-label="Đóng menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-6" aria-hidden="true" />
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.label}>
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          className="flex min-h-11 w-full items-center justify-between rounded-2xl px-3 text-left font-semibold text-ink hover:bg-primary-soft"
                          aria-expanded={mobileSection === item.label}
                          onClick={() => setMobileSection((s) => (s === item.label ? null : item.label))}
                        >
                          {item.label}
                          <ChevronDown
                            className={cn("size-5 transition-transform", mobileSection === item.label && "rotate-180")}
                            aria-hidden="true"
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {mobileSection === item.label && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-3"
                            >
                              {item.children.map((c) => (
                                <li key={c.label}>
                                  <Link
                                    href={c.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex min-h-11 items-center rounded-2xl px-3 text-sm text-muted no-underline hover:bg-primary-soft hover:text-primary"
                                  >
                                    {c.label}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex min-h-11 items-center rounded-2xl px-3 font-semibold text-ink no-underline hover:bg-primary-soft"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <Link href="/dang-ky-hoc-thu" onClick={() => setMobileOpen(false)} className={cn(pillCta, "mt-6 w-full")}>
                Đăng ký học thử
              </Link>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function DesktopItem({ item, open, setOpen }: { item: NavItem; open: boolean; setOpen: (v: string | null) => void }) {
  const hasChildren = Boolean(item.children);
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setHover(true);
        if (hasChildren) setOpen(item.label);
      }}
      onMouseLeave={() => {
        setHover(false);
        if (hasChildren) setOpen(null);
      }}
      onFocus={() => {
        setHover(true);
        if (hasChildren) setOpen(item.label);
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setHover(false);
        if (hasChildren) setOpen(null);
      }}
    >
      <Link
        href={item.href}
        className="relative inline-flex min-h-11 items-center gap-1 px-3 text-sm font-semibold text-ink no-underline transition-colors hover:text-primary xl:px-3.5"
        aria-haspopup={hasChildren ? "true" : undefined}
        aria-expanded={hasChildren ? open : undefined}
      >
        {item.label}
        {hasChildren && <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />}
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-accent"
          initial={false}
          animate={{ scaleX: hover || open ? 1 : 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      </Link>

      <AnimatePresence>
        {hasChildren && open && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 min-w-64 rounded-2xl border border-line bg-white p-2 shadow-xl"
          >
            {item.children!.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  onClick={() => setOpen(null)}
                  className="block rounded-xl px-3 py-2.5 text-sm text-ink no-underline transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
