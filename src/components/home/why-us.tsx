import { Award, Route, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { BridgeArc } from "@/components/layout/brand";
import { ButtonLink } from "@/components/ui/button";
import { WHY_US } from "@/data/home";
import { Reveal, Stagger, StaggerItem } from "./motion";

const ICONS: Record<(typeof WHY_US)[number]["icon"], LucideIcon> = {
  users: Users,
  award: Award,
  route: Route,
  shield: ShieldCheck,
};

export function WhyUs() {
  return (
    <section
      id="vi-sao"
      aria-labelledby="tieu-de-vi-sao"
      className="on-brand relative scroll-mt-24 overflow-hidden px-4 py-16 sm:py-24"
      style={{ background: "linear-gradient(155deg,#0a1240 0%,#172085 38%,#1f2f98 70%,#2840c0 100%)" }}
    >
      {/* Họa tiết vòm cầu */}
      <BridgeArc className="pointer-events-none absolute -bottom-6 -left-8 w-[600px] max-w-[90%] text-white/8" />
      {/* Orbs trang trí */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 size-48 rounded-full bg-primary-light/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="label-overline text-on-brand-muted">Vì sao chọn CoreLink</p>
          <h2 id="tieu-de-vi-sao" className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Cây cầu nối học sinh<br className="hidden sm:block" /> với mục tiêu học tập
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-on-brand-muted sm:text-base">
            Mỗi em có một xuất phát điểm riêng. CoreLink kiểm tra đầu vào, xây lộ trình phù hợp
            và theo sát từng buổi học trong lớp nhỏ, để phụ huynh luôn biết con đang tiến bộ ra sao.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/#dang-ky" variant="inverse" className="rounded-full px-6">
              Đăng ký kiểm tra đầu vào
            </ButtonLink>
            <ButtonLink href="/khoa-hoc" variant="outline-inverse" className="rounded-full px-6">
              Xem học phí
            </ButtonLink>
          </div>
        </Reveal>

        <Stagger as="ul" className="grid gap-4 sm:grid-cols-2">
          {WHY_US.map((w) => {
            const Icon = ICONS[w.icon];
            return (
              <StaggerItem
                key={w.title}
                as="li"
                className="glass-card-dark list-none rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/10 hover:shadow-2xl"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-lg text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-brand-muted">{w.detail}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

