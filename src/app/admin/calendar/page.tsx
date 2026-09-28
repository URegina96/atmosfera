"use client";

import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";
import { AdminTitle, Panel, useAdmin } from "@/components/admin/AdminShell";
import { REASON_LABEL } from "@/components/admin/BlockModal";
import { BookingCard } from "@/components/admin/BookingRow";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { adminApi, type BookingRow } from "@/lib/api";
import { eachDayInclusive, fromISO, shiftISO, toISO, todayISO } from "@/lib/dates";
import type { BlockedPeriod, BookingStatus } from "@/lib/types";

type View = "day" | "week" | "month";

const BAR: Record<BookingStatus | "BLOCKED", string> = {
  PENDING: "bg-[#ecd9b6] text-[#6b4d22] border border-[#c99a4e]/50",
  CONFIRMED: "bg-[#5c6650] text-ivory",
  CANCELLED: "bg-transparent text-[#8a4a3a] border border-dashed border-[#b0705f]/60",
  COMPLETED: "bg-[#b8ab99] text-graphite",
  NO_SHOW: "bg-[#d9d4ce] text-[#5c5854]",
  BLOCKED: "bg-[repeating-linear-gradient(135deg,#e6ded2_0_6px,#d8cdbd_6px_12px)] text-umber",
};

export default function AdminCalendar() {
  const { openBooking, openNewBooking, openBlock } = useAdmin();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [showCancelled, setShowCancelled] = useState(false);

  const from = toISO(view === "month" ? startOfMonth(anchor) : view === "week" ? startOfWeek(anchor, { weekStartsOn: 1 }) : anchor);
  const to = view === "month" ? toISO(endOfMonth(anchor)) : view === "week" ? shiftISO(from, 6) : from;
  const days = eachDayInclusive(from, to);
  const { data } = useQuery({ queryKey: ["admin", "calendar", from, to], queryFn: () => adminApi.calendar(shiftISO(from, -1), shiftISO(to, 1)) });

  const step = (n: number) => setAnchor((a) => (view === "month" ? addMonths(a, n) : addDays(a, n * (view === "week" ? 7 : 1))));
  const title =
    view === "month"
      ? format(anchor, "LLLL yyyy", { locale: ru })
      : view === "week"
        ? `${format(fromISO(from), "d MMM", { locale: ru })} — ${format(fromISO(to), "d MMM yyyy", { locale: ru })}`
        : format(anchor, "EEEE, d MMMM", { locale: ru });

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle title="Календарь">
        <Button onClick={() => openNewBooking()}><Icon name="plus" className="h-4 w-4" /> Бронь</Button>
        <Button variant="secondary" onClick={() => openBlock()}><Icon name="lock" className="h-4 w-4" /> Блокировка</Button>
      </AdminTitle>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-graphite/10 bg-ivory p-1" role="tablist">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={clsx("h-9 rounded-full px-4 text-[13px] transition", view === v ? "bg-graphite text-ivory" : "text-umber")}>
              {v === "day" ? "День" : v === "week" ? "Неделя" : "Месяц"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-graphite/10 bg-ivory" aria-label="Назад"><Icon name="chevronLeft" className="h-4 w-4" /></button>
          <span className="min-w-[170px] text-center text-[14px] capitalize">{title}</span>
          <button onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full border border-graphite/10 bg-ivory" aria-label="Вперёд"><Icon name="chevronRight" className="h-4 w-4" /></button>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(new Date())}>Сегодня</Button>
        </div>
      </div>

      {!data ? (
        <div className="h-72 animate-pulse rounded-3xl bg-linen" />
      ) : view === "day" ? (
        <DayView date={from} data={data} />
      ) : (
        <Panel className="!p-0 overflow-hidden">
          <div className="no-scrollbar overflow-x-auto">
            <div style={{ minWidth: view === "month" ? 140 + days.length * 44 : 720 }}>
              <div className="flex border-b border-graphite/10">
                <div className="sticky left-0 z-10 w-[140px] shrink-0 bg-ivory" />
                {days.map((d) => (
                  <div key={d} className={clsx("flex-1 border-l border-graphite/5 py-2 text-center", d === todayISO() && "bg-beige/40")}>
                    <div className="text-[10px] uppercase text-taupe">{format(fromISO(d), "EEEEEE", { locale: ru })}</div>
                    <div className={clsx("text-[13px] tabular-nums", d === todayISO() && "font-semibold")}>{fromISO(d).getDate()}</div>
                  </div>
                ))}
              </div>
              {data.properties.map((p) => {
                const rowBookings = data.bookings.filter((b) => b.propertyId === p.id && (showCancelled || b.status !== "CANCELLED"));
                const rowBlocks = data.blocks.filter((x) => x.propertyId === p.id);
                return (
                  <div key={p.id} className="flex border-b border-graphite/10 last:border-0">
                    <div className="sticky left-0 z-10 flex w-[140px] shrink-0 items-center bg-ivory px-4 font-serif text-[18px]">{p.name}</div>
                    <div className="relative flex flex-1">
                      {days.map((d) => (
                        <button
                          key={d}
                          onClick={() => openNewBooking({ propertyId: p.id, checkIn: d, checkOut: shiftISO(d, 1) })}
                          className={clsx("h-[72px] flex-1 border-l border-graphite/5 transition hover:bg-linen/70", d === todayISO() && "bg-beige/25")}
                          aria-label={`Создать бронь: ${p.name}, ${d}`}
                        />
                      ))}
                      {rowBlocks.map((x) => (
                        <Bar key={x.id} from={from} total={days.length} start={x.from} end={shiftISO(x.to, 1)} cls={BAR.BLOCKED} label={REASON_LABEL[x.reason]} onClick={() => openBlock({ propertyId: p.id })} half={false} />
                      ))}
                      {rowBookings.map((b) => (
                        <Bar key={b.id} from={from} total={days.length} start={b.checkIn} end={b.checkOut} cls={BAR[b.status]} label={b.clientName} onClick={() => openBooking(b.id)} half />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-taupe">
        {(["PENDING", "CONFIRMED", "CANCELLED", "BLOCKED"] as const).map((s) => (
          <span key={s} className="flex items-center gap-2">
            <span className={clsx("h-3 w-6 rounded", BAR[s])} />
            {{ PENDING: "Ожидает", CONFIRMED: "Подтверждена", CANCELLED: "Отменена", BLOCKED: "Заблокировано" }[s]}
          </span>
        ))}
        <label className="ml-auto flex items-center gap-2">
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-graphite" /> Показывать отменённые
        </label>
      </div>
    </div>
  );
}

/** Bars start mid-day at check-in and end mid-day at check-out, so turnover days show both guests. */
function Bar({ from, total, start, end, cls, label, onClick, half }: { from: string; total: number; start: string; end: string; cls: string; label: string; onClick: () => void; half: boolean }) {
  const offset = half ? 0.5 : 0;
  const s = Math.max(differenceInCalendarDays(fromISO(start), fromISO(from)) + offset, 0);
  const e = Math.min(differenceInCalendarDays(fromISO(end), fromISO(from)) + offset, total);
  if (e <= 0 || s >= total) return null;
  return (
    <button
      onClick={onClick}
      className={clsx("absolute top-1/2 z-[1] h-10 -translate-y-1/2 overflow-hidden truncate rounded-lg px-2 text-left text-[12px] font-medium shadow-sm transition hover:brightness-95", cls)}
      style={{ left: `calc(${(s / total) * 100}% + 2px)`, width: `calc(${((e - s) / total) * 100}% - 4px)` }}
      title={label}
    >
      {label}
    </button>
  );
}

function DayView({ date, data }: { date: string; data: { properties: { id: string; name: string }[]; bookings: BookingRow[]; blocks: BlockedPeriod[] } }) {
  const { openNewBooking } = useAdmin();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.properties.map((p) => {
        const bs = data.bookings.filter((b) => b.propertyId === p.id && b.status !== "CANCELLED");
        const checkIns = bs.filter((b) => b.checkIn === date);
        const checkOuts = bs.filter((b) => b.checkOut === date);
        const staying = bs.filter((b) => b.checkIn < date && b.checkOut > date);
        const block = data.blocks.find((x) => x.propertyId === p.id && x.from <= date && x.to >= date);
        const empty = !checkIns.length && !checkOuts.length && !staying.length && !block;
        return (
          <Panel key={p.id} title={p.name}>
            <div className="space-y-3">
              {block && <div className={clsx("rounded-2xl p-4 text-[14px]", BAR.BLOCKED)}>Заблокировано · {REASON_LABEL[block.reason]}{block.note && ` · ${block.note}`}</div>}
              {checkOuts.map((b) => <div key={b.id}><div className="mb-1 text-[12px] text-taupe">Выезд</div><BookingCard b={b} compact /></div>)}
              {staying.map((b) => <div key={b.id}><div className="mb-1 text-[12px] text-taupe">Проживают</div><BookingCard b={b} compact /></div>)}
              {checkIns.map((b) => <div key={b.id}><div className="mb-1 text-[12px] text-[#4a5640]">Заезд</div><BookingCard b={b} compact /></div>)}
              {empty && (
                <div className="rounded-2xl border border-dashed border-graphite/15 p-6 text-center text-[14px] text-taupe">
                  Свободно
                  <Button size="sm" variant="secondary" className="ml-3" onClick={() => openNewBooking({ propertyId: p.id, checkIn: date, checkOut: shiftISO(date, 1) })}>Создать бронь</Button>
                </div>
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
