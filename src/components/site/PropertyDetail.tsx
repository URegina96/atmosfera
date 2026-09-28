"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { publicApi } from "@/lib/api";
import { fmtRange, nightsBetween, nightsLabel, plural } from "@/lib/dates";
import { AvailabilityCalendar, type Range } from "../booking/AvailabilityCalendar";
import { Picture } from "../Picture";
import { Button, ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { AmenityItem } from "./Amenities";
import { Gallery } from "./Gallery";
import { coverOf } from "./PropertyCard";
import { Reveal, SectionHeading } from "./Reveal";
import { SiteShell } from "./SiteShell";

export function PropertyDetail({ slug }: { slug: string }) {
  const { data: p, isLoading, error } = useQuery({ queryKey: ["property", slug], queryFn: () => publicApi.property(slug) });
  const { data: amenities = [] } = useQuery({ queryKey: ["amenities"], queryFn: publicApi.amenities });
  const { data: rules = [] } = useQuery({ queryKey: ["rules"], queryFn: publicApi.rules });
  const [range, setRange] = useState<Range>({});
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);

  if (isLoading)
    return (
      <SiteShell overlay>
        <div ref={heroRef} className="h-[80svh] animate-pulse bg-graphite" />
      </SiteShell>
    );
  if (error || !p)
    return (
      <SiteShell>
        <div ref={heroRef} className="container-x py-32 text-center">
          <h1 className="font-serif text-5xl">Дом не найден</h1>
          <ButtonLink href="/properties" className="mt-8">Все дома</ButtonLink>
        </div>
      </SiteShell>
    );

  const cover = coverOf(p);
  const list = amenities.filter((a) => p.amenityIds.includes(a.id));
  const hasTub = p.amenityIds.includes("am-tub");
  const facts = [
    { icon: "users", label: "Гости", value: `до ${p.capacity}` },
    { icon: "bed", label: "Спальни", value: String(p.bedrooms) },
    { icon: "bath", label: plural(p.bathrooms, "Санузел", "Санузла", "Санузлов"), value: String(p.bathrooms) },
    { icon: "area", label: "Площадь", value: `${p.area} м²` },
    ...(hasTub ? [{ icon: "tub", label: "Чан", value: "Есть" }] : []),
  ];

  const continueBooking = () => {
    const q = new URLSearchParams({ property: p.id });
    if (range.checkIn) q.set("checkIn", range.checkIn);
    if (range.checkOut) q.set("checkOut", range.checkOut);
    router.push(`/booking?${q}`);
  };

  return (
    <SiteShell overlay>
      <section ref={heroRef} className="relative h-[88svh] min-h-[560px] overflow-hidden bg-graphite">
        <motion.div style={{ y }} initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
          <Picture src={cover?.src} alt={cover?.alt ?? p.name} />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/40" />
        <div className="container-x relative flex h-full flex-col justify-end pb-14">
          <Link href="/properties" className="mb-6 flex w-fit items-center gap-2 text-[13px] text-ivory/70 hover:text-ivory">
            <Icon name="arrowLeft" className="h-4 w-4" /> Все дома
          </Link>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }} className="font-serif text-[64px] leading-[0.95] text-ivory sm:text-[104px]">
            {p.name}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-[17px] text-ivory/75">
            {p.tagline}
          </motion.p>
        </div>
      </section>

      <section className="border-b border-graphite/10">
        <div className="container-x no-scrollbar flex gap-10 overflow-x-auto py-8">
          {facts.map((f) => (
            <div key={f.label} className="flex shrink-0 items-center gap-3">
              <Icon name={f.icon} className="h-6 w-6 text-clay" />
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-taupe">{f.label}</div>
                <div className="font-serif text-[22px] leading-tight">{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
          <Reveal>
            <p className="eyebrow">О доме</p>
            <p className="mt-6 font-serif text-[28px] leading-[1.3] sm:text-[34px]">{p.description}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Удобства</p>
            <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {list.map((a) => (
                <AmenityItem key={a.id} amenity={a} />
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-x">
          <Gallery images={p.images} />
        </div>
      </section>

      <section id="availability" className="bg-linen/60 py-20 md:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading eyebrow="Доступность" title="Свободные даты" text="Выберите даты заезда и выезда — мы перенесём их в заявку." />
            <Reveal delay={0.1} className="mt-10">
              {range.checkIn && range.checkOut ? (
                <p className="text-[16px]">
                  {fmtRange(range.checkIn, range.checkOut)} · <span className="text-taupe">{nightsLabel(nightsBetween(range.checkIn, range.checkOut))}</span>
                </p>
              ) : (
                <p className="text-[15px] text-taupe">{range.checkIn ? "Выберите дату выезда" : "Выберите дату заезда"}</p>
              )}
              <p className="mt-3 text-[14px] text-umber/70">До {p.capacity} {plural(p.capacity, "гостя", "гостей", "гостей")}. Стоимость уточняется при подтверждении.</p>
              <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={continueBooking}>
                Забронировать {p.name}
              </Button>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="rounded-[28px] border border-graphite/10 bg-ivory p-4 sm:p-8">
            <AvailabilityCalendar propertyId={p.id} value={range} onChange={setRange} />
          </Reveal>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-x">
          <div className="flex items-end justify-between gap-6">
            <SectionHeading eyebrow="Правила" title="Перед приездом" />
            <Link href="/rules" className="hidden border-b border-graphite/30 pb-1 text-[13px] font-medium sm:block">
              Все правила
            </Link>
          </div>
          <div className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {rules.slice(0, 6).map((r) => (
              <div key={r.id} className="border-t border-graphite/10 py-6">
                <h3 className="font-serif text-[22px]">{r.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-umber/80">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
