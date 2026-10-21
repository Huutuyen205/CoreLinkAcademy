import { UserRound } from "lucide-react";
import Image from "next/image";
import { TEACHERS } from "@/data/home";
import { Reveal, Stagger, StaggerItem } from "./motion";

export function Teachers() {
  return (
    <section id="giao-vien" aria-labelledby="tieu-de-giao-vien" className="scroll-mt-24 px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Đội ngũ giáo viên</p>
          <h2 id="tieu-de-giao-vien" className="mt-2 text-2xl text-ink sm:text-4xl">
            Thầy cô tận tâm, theo sát từng em
          </h2>
        </Reveal>

        <Stagger as="ul" className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {TEACHERS.map((t, i) => (
            <StaggerItem key={i} as="li" className="group list-none overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
              <div className="relative aspect-[4/5] overflow-hidden bg-primary-soft">
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                  {t.photo ? (
                    <Image src={t.photo} alt={`Giáo viên ${t.subject}`} fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-b from-primary-soft to-brand-tint text-primary/40">
                      <UserRound className="size-1/2" strokeWidth={1.25} aria-hidden="true" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t.subject}</p>
                <h3 className="mt-1 text-base text-ink sm:text-lg">{t.name}</h3>
                <p className="mt-1 text-sm text-muted">{t.degree}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
