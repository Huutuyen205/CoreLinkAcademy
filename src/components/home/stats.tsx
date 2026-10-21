import { STATS } from "@/data/home";
import { CountUp, Stagger, StaggerItem } from "./motion";

export function Stats() {
  return (
    <section id="so-lieu" aria-label="Số liệu nổi bật" className="scroll-mt-24 px-4 pb-4 pt-14 sm:pt-20">
      <Stagger className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {STATS.map((s) => (
          <StaggerItem key={s.label} className="text-center lg:border-l lg:border-line lg:first:border-l-0">
            <p className="font-heading text-4xl font-extrabold text-primary sm:text-5xl">
              {s.kind === "count" && <CountUp to={s.value!} suffix={s.suffix} />}
              {s.kind === "range" && (
                <>
                  <CountUp to={s.range![0]} />–<CountUp to={s.range![1]} />
                </>
              )}
              {s.kind === "text" && <span className="text-2xl sm:text-3xl">{s.text}</span>}
            </p>
            <p className="mt-2 text-sm text-muted sm:text-base">{s.label}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
