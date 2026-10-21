import { Mail, Phone, Search } from "lucide-react";
import Link from "next/link";
import { TOP_LINKS } from "@/data/nav";
import { isPlaceholder, phoneHref, SITE } from "@/data/site";

const linkClass = "text-white/90 no-underline transition-colors hover:text-white hover:underline underline-offset-4";

export function TopBar() {
  return (
    <div className="on-brand bg-primary-strong text-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-2">
        <div className="flex min-w-0 items-center gap-x-5 gap-y-1">
          <a href={phoneHref(SITE.hotline)} className={`${linkClass} inline-flex items-center gap-2`}>
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="sr-only">Hotline: </span>
              {SITE.hotline}
            </span>
          </a>
          <a
            href={isPlaceholder(SITE.email) ? "/#dang-ky" : `mailto:${SITE.email}`}
            className={`${linkClass} hidden items-center gap-2 md:inline-flex`}
          >
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="sr-only">Email: </span>
              {SITE.email}
            </span>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <nav aria-label="Liên kết nhanh" className="hidden items-center gap-5 sm:flex">
            {TOP_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/khoa-hoc"
            aria-label="Tìm khóa học"
            className="inline-flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <Search className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
