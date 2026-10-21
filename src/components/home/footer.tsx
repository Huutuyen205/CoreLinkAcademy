import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { FOOTER_COURSE_LINKS, FOOTER_SUPPORT_LINKS, isPlaceholder, phoneHref, SITE } from "@/data/site";

const linkClass = "text-on-brand-muted no-underline transition-colors hover:text-white hover:underline underline-offset-4";

export function Footer() {
  const mapSrc = isPlaceholder(SITE.address) ? null : `https://www.google.com/maps?q=${encodeURIComponent(SITE.address)}&output=embed`;

  return (
    <footer className="on-brand bg-[#0e1648] text-sm">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr]">
        <div className="space-y-4">
          <Brand href="/" tone="light" />
          <p className="text-on-brand-muted">
            Trung tâm đào tạo và luyện thi Toán – Văn – Anh các cấp, từ Tiền tiểu học đến THPT, chuẩn quốc tế. Lớp nhỏ 7–12 học sinh, theo sát từng buổi học.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{SITE.address}</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a href={phoneHref(SITE.hotline)}>{SITE.hotline}</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{SITE.email}</span>
            </li>
          </ul>
        </div>

        <nav aria-label="Khóa học">
          <p className="font-heading font-bold text-white">Khóa học</p>
          <ul className="mt-3 space-y-2">
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
          <p className="font-heading font-bold text-white">Hỗ trợ</p>
          <ul className="mt-3 space-y-2">
            {FOOTER_SUPPORT_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" className={linkClass}>
                Facebook Fanpage<span className="sr-only"> (mở tab mới)</span>
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <p className="font-heading font-bold text-white">Bản đồ</p>
          <div className="mt-3 aspect-[4/3] overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
            {mapSrc ? (
              <iframe title="Bản đồ vị trí Core Link Academy" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="size-full border-0" />
            ) : (
              <div className="flex size-full items-center justify-center p-4 text-center text-on-brand-muted">
                Bản đồ Google Maps sẽ hiển thị khi cập nhật địa chỉ trung tâm.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-on-brand-muted">
        © {new Date().getFullYear()} Core Link Academy. Mọi quyền được bảo lưu.
      </div>
    </footer>
  );
}
