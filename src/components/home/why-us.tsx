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
    <section id="vi-sao" aria-labelledby="tieu-de-vi-sao" className="on-brand relative scroll-mt-24 overflow-hidden bg-primary px-4 py-14 sm:py-20">
      <BridgeArc className="pointer-events-none absolute -bottom-4 -left-10 w-[620px] max-w-[90%] text-white/10" />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-on-brand-muted">Vì sao chọn CoreLink</p>
          <h2 id="tieu-de-vi-sao" className="mt-3 text-3xl text-white sm:text-4xl">
            Cây cầu nối học sinh với mục tiêu học tập
          </h2>
          <p className="mt-4 max-w-xl text-on-brand-muted">
            Mỗi em có một xuất phát điểm riêng. CoreLink kiểm tra đầu vào, xây lộ trình phù hợp và theo sát từng buổi học trong lớp nhỏ, để phụ huynh luôn
            biết con đang tiến bộ ra sao.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
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
                className="list-none rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/15 hover:shadow-2xl"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg text-white">{w.title}</h3>
                <p className="mt-1.5 text-sm text-on-brand-muted">{w.detail}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
