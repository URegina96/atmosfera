"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { Icon } from "../ui/Icon";
import { LocationMap } from "./LocationMap";
import { PageIntro } from "./PageIntro";
import { ImageReveal, Reveal } from "./Reveal";
import { SiteShell } from "./SiteShell";

export function ContactsPage() {
  const { data: s } = useQuery({ queryKey: ["settings"], queryFn: publicApi.settings });
  const items = s
    ? [
        { icon: "phone", label: "Телефон", value: s.phone, href: `tel:${s.phone.replace(/[^+\d]/g, "")}` },
        { icon: "telegram", label: "Telegram", value: `@${s.telegramBotUsername}`, href: `https://t.me/${s.telegramBotUsername}` },
        { icon: "mail", label: "Почта", value: s.email, href: `mailto:${s.email}` },
      ]
    : [];
  return (
    <SiteShell>
      <PageIntro eyebrow="Контакты" title={<>Уфа · 20 км <br />от города</>} text={s?.directions} />
      <div className="container-x grid gap-12 pb-24 md:pb-36 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <ul className="divide-y divide-graphite/10 border-y border-graphite/10">
            {items.map((i) => (
              <li key={i.label}>
                <a href={i.href} className="group flex items-center gap-5 py-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-graphite/15 transition group-hover:bg-graphite group-hover:text-ivory"><Icon name={i.icon} /></span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-taupe">{i.label}</span>
                    <span className="font-serif text-[26px]">{i.value}</span>
                  </span>
                </a>
              </li>
            ))}
            <li className="flex items-center gap-5 py-6">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-graphite/15"><Icon name="pin" /></span>
              <span>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-taupe">Адрес</span>
                <span className="text-[16px]">{s?.address ?? "Точный адрес пришлём после подтверждения бронирования"}</span>
              </span>
            </li>
          </ul>
        </Reveal>
        <ImageReveal className="aspect-[10/7] rounded-[28px] border border-graphite/10">
          <LocationMap />
        </ImageReveal>
      </div>
    </SiteShell>
  );
}
