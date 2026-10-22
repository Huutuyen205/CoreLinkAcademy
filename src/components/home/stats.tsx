import { STATS } from "@/data/home";
import { CountUp, Stagger, StaggerItem } from "./motion";

/** Dải số liệu nổi bật — nền gradient nhẹ, số lớn, phân cách bằng đường kẻ dọc. */
export function Stats() {
  return (
    <section
      id="so-lieu"
      aria-label="Số liệu nổi bật"
      className="scroll-mt-24 px-4 py-14 sm:py-20"
      style={{ background: "linear-gradient(180deg, rgba(244,246,254,1) 0%, rgba(238,242,255,1) 100%)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <Stagger className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <StaggerItem
              key={s.label}
              className={`text-center ${i > 0 ? "lg:border-l lg:border-primary/15" : ""}`}
            >
              <p className="font-heading text-4xl font-extrabold text-primary sm:text-5xl">
                {s.kind === "count" && <CountUp to={s.value!} suffix={s.suffix} />}
                {s.kind === "range" && (
                  <>
                    <CountUp to={s.range![0]} />–<CountUp to={s.range![1]} />
                  </>
                )}
                {s.kind === "text" && <span className="text-3xl sm:text-4xl">{s.text}</span>}
              </p>
              <p className="mt-2.5 text-sm font-medium text-muted sm:text-base">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

