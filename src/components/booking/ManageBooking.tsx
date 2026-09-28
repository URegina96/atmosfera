"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { publicApi } from "@/lib/api";
import { fmtDay, fmtRange, guestsLabel, nightsLabel, todayISO } from "@/lib/dates";
import { PAYMENT_LABEL, StatusBadge } from "../ui/Badge";
import { Button, ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { AvailabilityCalendar, type Range } from "./AvailabilityCalendar";

/** Personal booking page (link from the confirmation / Telegram). Access is by the secret booking token. */
export function ManageBooking() {
  const token = useSearchParams().get("token") ?? "";
  const qc = useQueryClient();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [range, setRange] = useState<Range>({});
  const { data: b, error, isLoading } = useQuery({ queryKey: ["booking", token], queryFn: () => publicApi.bookingByToken(token), enabled: !!token });

  const cancel = useMutation({
    mutationFn: () => publicApi.cancelByToken(token),
    onSuccess: () => {
      setCancelOpen(false);
      toast("Бронирование отменено", "success");
      qc.invalidateQueries();
    },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const move = useMutation({
    mutationFn: () => publicApi.requestReschedule(token, range.checkIn!, range.checkOut!),
    onSuccess: () => {
      setMoveOpen(false);
      toast("Запрос на перенос отправлен", "success");
      qc.invalidateQueries();
    },
    onError: (e) => toast((e as Error).message, "error"),
  });

  if (!token || error)
    return (
      <div className="container-x py-32 text-center">
        <h1 className="font-serif text-5xl">Бронирование не найдено</h1>
        <p className="mt-4 text-umber/70">Проверьте ссылку или войдите в личный кабинет по телефону и коду брони.</p>
        <ButtonLink href="/account" className="mt-8">Мои бронирования</ButtonLink>
      </div>
    );
  if (isLoading || !b) return <div className="container-x py-40"><div className="mx-auto h-80 max-w-2xl animate-pulse rounded-[28px] bg-linen" /></div>;

  const active = b.status === "PENDING" || b.status === "CONFIRMED";
  const upcoming = b.checkIn >= todayISO();

  return (
    <section className="container-x max-w-3xl py-12 md:py-20">
      <Link href="/account" className="flex w-fit items-center gap-2 text-[13px] text-taupe hover:text-graphite"><Icon name="arrowLeft" className="h-4 w-4" /> Мои бронирования</Link>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <p className="eyebrow">Бронирование {b.code}</p>
        <StatusBadge status={b.status} />
      </div>
      <h1 className="mt-4 font-serif text-[48px] leading-none sm:text-[64px]">{b.propertyName}</h1>
      <p className="mt-3 text-[20px]">{fmtRange(b.checkIn, b.checkOut)}</p>

      <dl className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-graphite/10 bg-graphite/10 sm:grid-cols-2">
        {[
          ["Заезд", fmtDay(b.checkIn)],
          ["Выезд", fmtDay(b.checkOut)],
          ["Ночей", nightsLabel(b.nights)],
          ["Гости", guestsLabel(b.guestsCount)],
          ["Оплата", PAYMENT_LABEL[b.paymentStatus]],
          ["Telegram", b.telegramLinked ? "Привязан" : "Не привязан"],
        ].map(([k, v]) => (
          <div key={k} className="bg-ivory p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">{k}</dt>
            <dd className="mt-1 text-[16px]">{v}</dd>
          </div>
        ))}
      </dl>

      {b.comment && <p className="mt-6 rounded-2xl bg-linen/60 p-5 text-[14px] text-umber">💬 {b.comment}</p>}
      {b.rescheduleRequest && (
        <p className="mt-6 rounded-2xl border border-[#c99a4e]/40 bg-[#f1e4cc]/50 p-5 text-[14px]">
          🔄 Запрошен перенос на {fmtRange(b.rescheduleRequest.checkIn, b.rescheduleRequest.checkOut)}. Ожидает решения владельца.
        </p>
      )}
      <p className="mt-6 text-[13px] text-taupe">Предоплата — после подтверждения бронирования. Оплата оставшейся суммы — при встрече.</p>

      {active && upcoming && (
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => { setRange({}); setMoveOpen(true); }}><Icon name="calendar" className="h-4 w-4" /> Перенести даты</Button>
          <Button variant="danger" onClick={() => setCancelOpen(true)}>Отменить бронь</Button>
        </div>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Отменить бронь?">
        <p className="text-[15px] text-umber/80">{b.propertyName}, {fmtRange(b.checkIn, b.checkOut)}. Даты снова станут доступны для других гостей.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" className="bg-[#7a3b2c] hover:bg-[#6a3225]" onClick={() => cancel.mutate()} loading={cancel.isPending}>Да, отменить</Button>
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>Оставить бронь</Button>
        </div>
      </Modal>

      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Перенос дат" wide>
        <p className="mb-5 text-[14px] text-umber/80">Выберите новые даты. Владелец проверит запрос — текущая бронь сохранится до подтверждения переноса.</p>
        <AvailabilityCalendar propertyId={b.propertyId} value={range} onChange={setRange} ownRange={{ checkIn: b.checkIn, checkOut: b.checkOut }} />
        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[14px]">{range.checkIn && range.checkOut ? fmtRange(range.checkIn, range.checkOut) : "Даты не выбраны"}</span>
          <Button onClick={() => move.mutate()} disabled={!range.checkIn || !range.checkOut} loading={move.isPending}>Отправить запрос</Button>
        </div>
      </Modal>
    </section>
  );
}
