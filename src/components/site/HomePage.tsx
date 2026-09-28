"use client";

import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";
import { fmtRange, nightsBetween, nightsLabel } from "@/lib/dates";
import { AvailabilityCalendar, type Range } from "../booking/AvailabilityCalendar";
import { Picture } from "../Picture";
import { Button, ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { AmenityItem } from "./Amenities";
import { Gallery } from "./Gallery";
import { Hero } from "./Hero";
import { LocationMap } from "./LocationMap";
import { PropertyCard } from "./PropertyCard";
import { ImageReveal, Reveal, SectionHeading } from "./Reveal";
import { SiteShell } from "./SiteShell";

export function HomePage() {
  const { data: properties = [] } = useQuery({ queryKey: ["properties"], queryFn: publicApi.properties });
  const { data: amenities = [] } = useQuery({ queryKey: ["amenities"], queryFn: publicApi.amenities });
  const { data: rules = [] } = useQuery({ queryKey: ["rules"], queryFn: publicApi.rules });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: publicApi.settings });

  const used = new Set(properties.flatMap((p) => p.amenityIds));
  const shownAmenities = amenities.filter((a) => used.has(a.id));
  const galleryImages = properties.flatMap((p) => p.images.slice(0, 3).map((img) => ({ ...img, caption: p.name }))).slice(0, 5);

  return (
    <SiteShell overlay>
      <Hero />

      {/* ABOUT */}
      <section className="py-24 md:py-36" aria-labelledby="about">
        <div className="container-x grid items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <div>
            <Reveal>
              <p className="eyebrow">О месте</p>
              <h2 id="about" className="mt-4 font-serif text-[40px] leading-[1.02] sm:text-[56px]">
                Тишина, лес <br />и <em className="text-clay">тёплый свет</em> в окнах.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-lg text-[16px] leading-relaxed text-umber/85">
                «Атмосфера» — это два отдельных дома в 20 километрах от Уфы. Здесь нет суеты: только природа, панорамные окна и чан под открытым небом. Место, чтобы замедлиться — вдвоём, с семьёй или близкими друзьями.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-graphite/10 pt-8">
                {[
                  ["2", "отдельных дома"],
                  ["20", "км от Уфы"],
                  ["2", "чана под небом"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <dt className="font-serif text-[48px] leading-none">{n}</dt>
                    <dd className="mt-2 text-[13px] text-taupe">{l}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <div className="relative pb-20 sm:pb-28">
            <ImageReveal className="aspect-[4/5] rounded-[28px] shadow-soft sm:aspect-[5/4]">
              <Picture src="render:a-interior" alt="Гостиная с панорамным окном" />
            </ImageReveal>
            <motion.div
              className="absolute -bottom-2 -left-4 w-[55%] overflow-hidden rounded-[22px] border-[6px] border-ivory shadow-lift sm:-left-10"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="aspect-[4/3]">
                <Picture src="render:a-tub" alt="Чан у дома" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROPERTIES */}
      <section id="houses" className="scroll-mt-20 bg-linen/60 py-24 md:py-36">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHeading eyebrow="Домики" title={<>Два дома.<br />Один формат отдыха.</>} />
            <Reveal delay={0.1}>
              <p className="max-w-sm text-[15px] leading-relaxed text-umber/80">У каждого дома — своя терраса, свой чан и своё расписание. Выберите тот, что ближе по настроению.</p>
            </Reveal>
          </div>
          <div className="mt-16 grid gap-16 md:grid-cols-2 md:gap-10 lg:gap-16">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* AMENITIES */}
      <section id="amenities" className="scroll-mt-20 py-24 md:py-36">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.3fr]">
          <SectionHeading eyebrow="Услуги и удобства" title={<>Всё для <em className="text-clay">спокойного</em> отдыха.</>} text="Мы не перегружаем дома лишним. Только то, что действительно делает отдых удобным." />
          <Reveal delay={0.1}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shownAmenities.map((a) => (
                <AmenityItem key={a.id} amenity={a} />
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="scroll-mt-20 pb-24 md:pb-36">
        <div className="container-x">
          <div className="mb-12 flex items-end justify-between gap-6">
            <SectionHeading eyebrow="Галерея" title="Вечера в «Атмосфере»" />
            <Reveal className="hidden sm:block">
              <Link href="/properties" className="border-b border-graphite/30 pb-1 text-[13px] font-medium">Все фото домов</Link>
            </Reveal>
          </div>
          <Gallery images={galleryImages} />
        </div>
      </section>

      <BookingTeaser />

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-36" aria-labelledby="how">
        <div className="container-x">
          <SectionHeading eyebrow="Как это работает" title={<span id="how">Три простых шага</span>} />
          <ol className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-graphite/10 bg-graphite/10 md:grid-cols-3">
            {[
              ["01", "Выберите дом", "Посмотрите оба дома и выберите тот, что вам ближе."],
              ["02", "Выберите даты", "Календарь показывает только свободные даты — занятые выбрать нельзя."],
              ["03", "Получите подтверждение в Telegram", "Мы подтвердим бронь и пришлём все детали прямо в Telegram."],
            ].map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 0.1} className="bg-ivory p-8 md:p-10">
                <li className="list-none">
                  <span className="font-serif text-[64px] leading-none text-beige">{n}</span>
                  <h3 className="mt-8 font-serif text-[28px] leading-tight">{t}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-umber/80">{d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* RULES */}
      <section className="bg-linen/60 py-24 md:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading eyebrow="Правила" title="Коротко о главном" />
            <Reveal delay={0.1}>
              <ButtonLink href="/rules" variant="secondary" className="mt-8">Все правила</ButtonLink>
            </Reveal>
          </div>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {rules.slice(0, 6).map((r, i) => (
              <Reveal key={r.id} delay={i * 0.05} className="border-t border-graphite/10 py-6">
                <h3 className="font-serif text-[22px]">{r.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-umber/80">{r.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section className="py-24 md:py-36" aria-labelledby="loc">
        <div className="container-x grid items-center gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHeading eyebrow="Расположение" title={<span id="loc">Уфа · 20 км <br />от города</span>} />
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-umber/80">{settings?.directions}</p>
              {settings?.address && (
                <p className="mt-4 flex items-start gap-2 text-[15px]"><Icon name="pin" className="mt-0.5 h-5 w-5 text-clay" />{settings.address}</p>
              )}
              <ButtonLink href="/contacts" variant="secondary" className="mt-8">Контакты и проезд</ButtonLink>
            </Reveal>
          </div>
          <ImageReveal className="aspect-[10/7] rounded-[28px] border border-graphite/10">
            <LocationMap />
          </ImageReveal>
        </div>
      </section>

      <TelegramCta bot={settings?.telegramBotUsername} />
    </SiteShell>
  );
}

function BookingTeaser() {
  const { data: properties = [] } = useQuery({ queryKey: ["properties"], queryFn: publicApi.properties });
  const [propertyId, setPropertyId] = useState<string>();
  const [range, setRange] = useState<Range>({});
  const router = useRouter();
  useEffect(() => {
    if (!propertyId && properties[0]) setPropertyId(properties[0].id);
  }, [properties, propertyId]);

  const go = () => {
    const q = new URLSearchParams({ property: propertyId ?? "" });
    if (range.checkIn) q.set("checkIn", range.checkIn);
    if (range.checkOut) q.set("checkOut", range.checkOut);
    router.push(`/booking?${q}`);
  };

  return (
    <section id="booking" className="scroll-mt-20 bg-graphite py-24 text-ivory md:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-eyebrow text-ivory/50">Бронирование</p>
            <h2 className="mt-4 font-serif text-[40px] leading-[1.02] sm:text-[56px]">Выберите даты</h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/65">Календарь показывает реальную доступность. Стоимость рассчитывается в зависимости от выбранных дат и уточняется при подтверждении.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 flex gap-2" role="tablist" aria-label="Выбор дома">
              {properties.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={propertyId === p.id}
                  onClick={() => {
                    setPropertyId(p.id);
                    setRange({});
                  }}
                  className={clsx("h-11 rounded-full px-6 text-[14px] transition", propertyId === p.id ? "bg-ivory text-graphite" : "border border-ivory/20 text-ivory/80 hover:border-ivory/50")}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-10 border-t border-ivory/10 pt-6 text-[15px]">
              {range.checkIn && range.checkOut ? (
                <p>
                  {fmtRange(range.checkIn, range.checkOut)} · <span className="text-ivory/60">{nightsLabel(nightsBetween(range.checkIn, range.checkOut))}</span>
                </p>
              ) : (
                <p className="text-ivory/50">{range.checkIn ? "Теперь выберите дату выезда" : "Выберите дату заезда"}</p>
              )}
              <Button variant="light" size="lg" className="mt-6 w-full sm:w-auto" onClick={go}>
                Продолжить бронирование <Icon name="arrow" className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.15} className="rounded-[28px] bg-ivory p-5 text-graphite sm:p-8">
          {propertyId && <AvailabilityCalendar propertyId={propertyId} value={range} onChange={setRange} />}
        </Reveal>
      </div>
    </section>
  );
}

function TelegramCta({ bot }: { bot?: string }) {
  return (
    <section className="pb-24 md:pb-36">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[32px] bg-linen px-6 py-14 sm:px-14 sm:py-20">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-beige/60 blur-3xl" />
          <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow">Telegram</p>
              <h2 className="mt-4 font-serif text-[36px] leading-[1.05] sm:text-[52px]">Бронь, перенос и напоминания — в одном чате.</h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-umber/80">Бот пришлёт подтверждение, напомнит о заезде и поможет перенести или отменить бронирование.</p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <a href={`https://t.me/${bot ?? ""}`} target="_blank" rel="noreferrer" className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-graphite px-8 text-[15px] font-medium text-ivory transition hover:bg-ink">
                <Icon name="telegram" /> Открыть бота
              </a>
              <span className="text-[12px] text-taupe">@{bot}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
