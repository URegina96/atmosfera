"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { publicApi } from "@/lib/api";
import { NAV } from "./Header";

export function Footer() {
  const { data: s } = useQuery({ queryKey: ["settings"], queryFn: publicApi.settings });
  return (
    <footer className="bg-graphite text-ivory/80">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div>
          <div className="font-serif text-[28px] tracking-[0.28em] text-ivory">АТМОСФЕРА</div>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ivory/60">Загородный дом «Атмосфера». Два дома с чанами среди природы — {s?.locationLine ?? "Уфа · 20 км от города"}.</p>
        </div>
        <nav className="flex flex-col gap-3 text-[14px]" aria-label="Навигация в подвале">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="w-fit hover:text-ivory">{n.label}</Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3 text-[14px]">
          {s && (
            <>
              <a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`} className="w-fit hover:text-ivory">{s.phone}</a>
              <a href={`https://t.me/${s.telegramBotUsername}`} className="w-fit hover:text-ivory">Telegram: @{s.telegramBotUsername}</a>
              <a href={`mailto:${s.email}`} className="w-fit hover:text-ivory">{s.email}</a>
            </>
          )}
          <Link href="/admin" className="mt-4 w-fit text-[12px] text-ivory/35 hover:text-ivory/70">Вход для владельца</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-[12px] text-ivory/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Загородный дом «Атмосфера»</span>
          <span>Предоплата — после подтверждения бронирования. Оплата оставшейся суммы — при встрече.</span>
        </div>
      </div>
    </footer>
  );
}
