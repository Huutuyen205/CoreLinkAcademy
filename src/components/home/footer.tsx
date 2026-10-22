import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Brand, BridgeArc } from "@/components/layout/brand";
import { FOOTER_COURSE_LINKS, FOOTER_SUPPORT_LINKS, isPlaceholder, phoneHref, SITE } from "@/data/site";

const linkClass =
  "inline-block py-2 text-on-brand-muted no-underline transition-colors hover:text-white sm:py-0";

/** Footer premium: gradient sâu hơn, BridgeArc trang trí, divider gradient. */
export function Footer() {
  const mapSrc = isPlaceholder(SITE.address) ? null : `https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`;

  return (
    <footer
      className="on-brand relative overflow-hidden text-sm"
      style={{ background: "linear-gradient(160deg,#050a25 0%,#0e1648 40%,#121c60 100%)" }}
    >
      {/* Họa tiết vòm cầu */}
      <BridgeArc className="pointer-events-none absolute -right-8 top-4 w-[500px] text-white/5" />

      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr]">
        <div className="space-y-5">
          <Brand href="/" tone="light" />
          <p className="leading-relaxed text-on-brand-muted">
            Trung tâm đào tạo và luyện thi Toán – Văn – Anh các cấp, từ Tiền tiểu học đến THPT.
            Lớp nhỏ 7–12 học sinh, theo sát từng buổi học.
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{SITE.address}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <a href={phoneHref(SITE.hotline)} className="hover:text-white transition-colors">
                {SITE.hotline}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{SITE.email}</span>
            </li>
          </ul>
        </div>

        <nav aria-label="Khóa học">
          <p className="font-heading text-base font-bold text-white">Khóa học</p>
          <ul className="mt-3 space-y-0.5 sm:space-y-2">
            {FOOTER_COURSE_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Hỗ trợ">
          <p className="font-heading text-base font-bold text-white">Hỗ trợ</p>
          <ul className="mt-3 space-y-0.5 sm:space-y-2">
            {FOOTER_SUPPORT_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={SITE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Facebook Fanpage<span className="sr-only"> (mở tab mới)</span>
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className="font-heading text-base font-bold text-white">Bản đồ</p>
          <div className="mt-3 aspect-[4/3] overflow-hidden rounded-2xl bg-white/8 ring-1 ring-accent/20">
            {mapSrc ? (
              <iframe
                title="Bản đồ vị trí Core Link Academy"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="size-full border-0"
              />
            ) : (
              <div className="flex size-full items-center justify-center p-4 text-center text-on-brand-muted">
                Bản đồ Google Maps sẽ hiển thị khi cập nhật địa chỉ trung tâm.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t border-white/8 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 text-center text-xs text-on-brand-muted sm:py-4"
      >
        © {new Date().getFullYear()} Core Link Academy. Mọi quyền được bảo lưu.
      </div>
    </footer>
  );
}

