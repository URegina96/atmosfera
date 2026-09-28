"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { PageIntro } from "./PageIntro";
import { Reveal } from "./Reveal";
import { SiteShell } from "./SiteShell";

export function RulesPage() {
  const { data: rules = [] } = useQuery({ queryKey: ["rules"], queryFn: publicApi.rules });
  const { data: s } = useQuery({ queryKey: ["settings"], queryFn: publicApi.settings });
  return (
    <SiteShell>
      <PageIntro eyebrow="Правила" title="Правила проживания" text="Несколько договорённостей, чтобы отдых был спокойным для всех." />
      <div className="container-x pb-24 md:pb-36">
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[24px] bg-linen/70 p-6"><p className="eyebrow">Заезд</p><p className="mt-2 font-serif text-[40px]">с {s?.checkInTime}</p></div>
          <div className="rounded-[24px] bg-linen/70 p-6"><p className="eyebrow">Выезд</p><p className="mt-2 font-serif text-[40px]">до {s?.checkOutTime}</p></div>
        </div>
        <ol className="grid gap-x-16 md:grid-cols-2">
          {rules.map((r, i) => (
            <Reveal key={r.id} delay={(i % 2) * 0.05} className="border-t border-graphite/10 py-8">
              <li className="flex list-none gap-6">
                <span className="font-serif text-[20px] text-taupe">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="font-serif text-[28px] leading-tight">{r.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-umber/80">{r.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <p className="mt-10 text-[14px] text-taupe">Предоплата — после подтверждения бронирования. Оплата оставшейся суммы — при встрече.</p>
      </div>
    </SiteShell>
  );
}
