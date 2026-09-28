"use client";

import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { addMonths, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { publicApi } from "@/lib/api";
import { eachDayInclusive, fromISO, shiftISO, toISO, todayISO } from "@/lib/dates";
import type { AvailabilityDay, DayStatus, ID, ISODate } from "@/lib/types";
import { Icon } from "../ui/Icon";

export interface Range {
  checkIn?: ISODate;
  checkOut?: ISODate;
}

interface Props {
  propertyId: ID;
  value: Range;
  onChange?: (r: Range) => void;
  /** Nights of the booking being rescheduled — treated as free. */
  ownRange?: { checkIn: ISODate; checkOut: ISODate };
  months?: 1 | 2;
  /** Admin can pass a fetcher that ignores the "past" restriction etc. */
  fetcher?: (propertyId: ID, from: ISODate, to: ISODate) => Promise<AvailabilityDay[]>;
  readOnly?: boolean;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function AvailabilityCalendar({ propertyId, value, onChange, ownRange, months = 2, fetcher, readOnly }: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(value.checkIn ? fromISO(value.checkIn) : new Date()));
  const [dir, setDir] = useState(1);
  const [hover, setHover] = useState<ISODate | null>(null);

  const from = toISO(startOfMonth(cursor));
  const to = toISO(endOfMonth(addMonths(cursor, months - 1)));
  const { data, isLoading } = useQuery({
    queryKey: ["availability", propertyId, from, to, fetcher ? "admin" : "public"],
    queryFn: async () => (fetcher ? fetcher(propertyId, from, to) : (await publicApi.availability(propertyId, from, to)).days),
    placeholderData: (prev) => prev,
  });

  const statusOf = useMemo(() => {
    const m = new Map<ISODate, DayStatus>();
    data?.forEach((d) => m.set(d.date, d.status));
    return (d: ISODate): DayStatus => {
      if (ownRange && d >= ownRange.checkIn && d < ownRange.checkOut && d >= todayISO()) return "AVAILABLE";
      return m.get(d) ?? (d < todayISO() ? "PAST" : "AVAILABLE");
    };
  }, [data, ownRange]);

  const nightFree = (d: ISODate) => statusOf(d) === "AVAILABLE";

  /** When check-in is picked, the first unavailable night after it is the latest possible check-out. */
  const maxCheckout = useMemo(() => {
    if (!value.checkIn || value.checkOut) return null;
    let d = value.checkIn;
    for (let i = 0; i < 90; i++) {
      d = shiftISO(d, 1);
      if (!nightFree(d)) return d;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.checkIn, value.checkOut, statusOf]);

  function pick(d: ISODate) {
    if (readOnly || !onChange) return;
    const { checkIn, checkOut } = value;
    if (checkIn && !checkOut && d > checkIn && maxCheckout && d <= maxCheckout) {
      onChange({ checkIn, checkOut: d });
      return;
    }
    if (nightFree(d)) onChange({ checkIn: d, checkOut: undefined });
  }

  const go = (n: number) => {
    setDir(n);
    setCursor((c) => addMonths(c, n));
  };
  const canGoBack = startOfMonth(cursor) > startOfMonth(new Date());

  const previewEnd = value.checkIn && !value.checkOut && hover && maxCheckout && hover > value.checkIn && hover <= maxCheckout ? hover : null;

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} disabled={!canGoBack} className="grid h-10 w-10 place-items-center rounded-full border border-graphite/10 transition hover:border-graphite/30 disabled:opacity-30" aria-label="Предыдущий месяц">
          <Icon name="chevronLeft" className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-sm text-taupe">
          {isLoading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-taupe border-t-transparent" />}
        </div>
        <button type="button" onClick={() => go(1)} className="grid h-10 w-10 place-items-center rounded-full border border-graphite/10 transition hover:border-graphite/30" aria-label="Следующий месяц">
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={from}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={clsx("grid gap-8", months === 2 && "md:grid-cols-2")}
          >
            {Array.from({ length: months }, (_, i) => addMonths(cursor, i)).map((month, i) => (
              <div key={toISO(month)} className={clsx(i > 0 && "hidden md:block")}>
                <div className="mb-3 text-center font-serif text-xl capitalize">{format(month, "LLLL yyyy", { locale: ru })}</div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="pb-2 text-[11px] uppercase tracking-wider text-taupe">{w}</div>
                  ))}
                  {Array.from({ length: (getDay(startOfMonth(month)) + 6) % 7 }, (_, k) => <div key={`e${k}`} />)}
                  {eachDayInclusive(toISO(startOfMonth(month)), toISO(endOfMonth(month))).map((d) => {
                    const st = statusOf(d);
                    const isStart = d === value.checkIn;
                    const end = value.checkOut ?? previewEnd;
                    const isEnd = d === end;
                    const inRange = !!value.checkIn && !!end && d > value.checkIn && d < end;
                    const selectingOut = !!value.checkIn && !value.checkOut;
                    const checkoutOk = selectingOut && maxCheckout && d > value.checkIn! && d <= maxCheckout;
                    const enabled = !readOnly && (checkoutOk || st === "AVAILABLE");
                    const label = `${format(fromISO(d), "d MMMM", { locale: ru })}: ${
                      st === "AVAILABLE" ? "доступно" : st === "BOOKED" ? "забронировано" : st === "BLOCKED" ? "недоступно" : "прошедшая дата"
                    }`;
                    return (
                      <div key={d} className={clsx("relative h-11", inRange && "bg-beige/70", isStart && end && "bg-gradient-to-r from-transparent from-50% to-beige/70 to-50%", isEnd && value.checkIn && "bg-gradient-to-l from-transparent from-50% to-beige/70 to-50%")}>
                        <button
                          type="button"
                          disabled={!enabled}
                          onClick={() => pick(d)}
                          onMouseEnter={() => setHover(d)}
                          onMouseLeave={() => setHover(null)}
                          aria-label={label}
                          aria-pressed={isStart || isEnd}
                          className={clsx(
                            "relative mx-auto grid h-11 w-11 place-items-center rounded-full text-[14px] tabular-nums transition-colors",
                            isStart || isEnd
                              ? "bg-graphite font-medium text-ivory"
                              : st === "PAST"
                                ? "text-mist/70"
                                : st === "BOOKED"
                                  ? checkoutOk
                                    ? "text-graphite hover:bg-linen"
                                    : "text-taupe/70 line-through decoration-taupe/50"
                                  : st === "BLOCKED"
                                    ? "text-taupe/60"
                                    : enabled
                                      ? "text-graphite hover:bg-linen"
                                      : "text-mist",
                            st === "BLOCKED" && !isStart && !isEnd && "bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgba(154,139,120,.18)_4px_5px)]",
                            selectingOut && !checkoutOk && st === "AVAILABLE" && !isStart && "opacity-40",
                          )}
                        >
                          {fromISO(d).getDate()}
                          {d === todayISO() && !isStart && !isEnd && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-clay" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-taupe">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-graphite/30" /> Доступно</span>
        <span className="flex items-center gap-2"><span className="text-[11px] line-through">12</span> Забронировано</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[repeating-linear-gradient(135deg,transparent_0_2px,rgba(154,139,120,.5)_2px_3px)]" /> Заблокировано</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-graphite" /> Выбрано</span>
      </div>
    </div>
  );
}
