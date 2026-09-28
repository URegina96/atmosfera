"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { publicApi } from "@/lib/api";
import { fmtRange, guestsLabel, nightsLabel } from "@/lib/dates";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

export function BookingSuccess() {
  const token = useSearchParams().get("token") ?? "";
  const toast = useToast();
  const { data: b, error } = useQuery({ queryKey: ["booking", token], queryFn: () => publicApi.bookingByToken(token), enabled: !!token });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: publicApi.settings });
  const link = useMutation({
    mutationFn: () => publicApi.linkTelegramDemo(token),
    onSuccess: () => toast("Telegram привязан — уведомления появятся в чате бота", "success"),
  });

  if (error || !token)
    return (
      <div className="container-x py-32 text-center">
        <h1 className="font-serif text-5xl">Заявка не найдена</h1>
        <ButtonLink href="/booking" className="mt-8">Новая заявка</ButtonLink>
      </div>
    );
  if (!b) return <div className="container-x py-40"><div className="mx-auto h-80 max-w-xl animate-pulse rounded-[28px] bg-linen" /></div>;

  const deepLink = `https://t.me/${settings?.telegramBotUsername}?start=${b.token}`;
  return (
    <section className="container-x flex justify-center py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-xl text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-graphite text-ivory">
          <Icon name="check" className="h-7 w-7" strokeWidth={1.8} />
        </motion.div>
        <p className="eyebrow mt-8">Заявка отправлена</p>
        <h1 className="mt-4 font-serif text-[56px] leading-none sm:text-[72px]">Спасибо!</h1>
        <p className="mt-6 text-[16px] text-umber/80">Мы получили вашу заявку на:</p>
        <div className="mt-6 rounded-[24px] border border-graphite/10 bg-white/70 p-6">
          <div className="font-serif text-[32px] leading-none">{b.propertyName}</div>
          <div className="mt-3 text-[18px]">{fmtRange(b.checkIn, b.checkOut)}</div>
          <div className="mt-2 text-[14px] text-taupe">{nightsLabel(b.nights)} · {guestsLabel(b.guestsCount)}</div>
          <div className="mt-5 border-t border-graphite/10 pt-4 text-[13px] text-taupe">
            Код бронирования: <span className="font-medium tracking-wider text-graphite">{b.code}</span>
          </div>
        </div>
        <p className="mt-6 text-[15px] text-umber/80">Мы свяжемся с вами для подтверждения.</p>

        <a href={deepLink} target="_blank" rel="noreferrer" className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-graphite px-8 text-[15px] font-medium text-ivory transition hover:bg-ink sm:w-auto">
          <Icon name="telegram" /> Получить подтверждение в Telegram
        </a>
        {!b.telegramLinked ? (
          <div className="mt-4 rounded-2xl border border-dashed border-graphite/20 p-4 text-[13px] text-taupe">
            Демо-режим: бот ещё не подключён.{" "}
            <button onClick={() => link.mutate()} className="font-medium text-graphite underline underline-offset-4" disabled={link.isPending}>
              Сымитировать переход в бота
            </button>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-[#4a5640]">✓ Telegram привязан — подтверждение придёт в чат</p>
        )}
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={`/booking/manage?token=${b.token}`} variant="secondary">Моя бронь</ButtonLink>
          <ButtonLink href="/" variant="ghost">На главную</ButtonLink>
        </div>
      </motion.div>
    </section>
  );
}
