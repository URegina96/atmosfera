"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminTitle, Panel, useAdmin } from "@/components/admin/AdminShell";
import { BookingCard } from "@/components/admin/BookingRow";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { adminApi } from "@/lib/api";
import { fmtDay, guestsLabel, plural, todayISO } from "@/lib/dates";

export default function Dashboard() {
  const { openNewBooking, openBlock, openBooking, session } = useAdmin();
  const { data: d } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApi.dashboard });
  const today = format(new Date(), "EEEE, d MMMM", { locale: ru });

  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title={`Добрый день, ${session.name}`} subtitle={today[0].toUpperCase() + today.slice(1)}>
        <Button size="lg" onClick={() => openNewBooking()}><Icon name="plus" className="h-4 w-4" /> Добавить бронь</Button>
        <Button size="lg" variant="secondary" onClick={() => openBlock()}><Icon name="lock" className="h-4 w-4" /> Заблокировать даты</Button>
      </AdminTitle>

      {!d ? (
        <div className="h-96 animate-pulse rounded-3xl bg-linen" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Сегодня" className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [d.checkInsToday.length, plural(d.checkInsToday.length, "заезд", "заезда", "заездов")],
                [d.checkOutsToday.length, plural(d.checkOutsToday.length, "выезд", "выезда", "выездов")],
                [d.guestsNow, "гостей сейчас"],
                [d.pending.length, plural(d.pending.length, "новая заявка", "новые заявки", "новых заявок")],
              ].map(([n, l]) => (
                <div key={String(l)} className="rounded-2xl bg-white/70 p-4">
                  <div className="font-serif text-[44px] leading-none">{n}</div>
                  <div className="mt-2 text-[13px] text-taupe">{l}</div>
                </div>
              ))}
            </div>
            {(d.checkInsToday.length > 0 || d.checkOutsToday.length > 0) && (
              <div className="mt-5 space-y-2">
                {d.checkInsToday.map((b) => (
                  <div key={b.id} className="flex items-center gap-3"><span className="w-14 text-[12px] text-[#4a5640]">заезд</span><div className="flex-1"><BookingCard b={b} compact /></div></div>
                ))}
                {d.checkOutsToday.map((b) => (
                  <div key={b.id} className="flex items-center gap-3"><span className="w-14 text-[12px] text-taupe">выезд</span><div className="flex-1"><BookingCard b={b} compact /></div></div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Ближайшая бронь">
            {d.nextCheckIn ? (
              <button onClick={() => openBooking(d.nextCheckIn!.id)} className="w-full text-left">
                <div className="font-serif text-[32px] leading-none">{d.nextCheckIn.propertyName}</div>
                <div className="mt-3 text-[18px]">{d.nextCheckIn.checkIn === todayISO() ? "Сегодня" : fmtDay(d.nextCheckIn.checkIn)}</div>
                <div className="mt-1 text-[14px] text-taupe">заезд с 14:00 · {guestsLabel(d.nextCheckIn.guestsCount)}</div>
                <div className="mt-1 text-[14px]">{d.nextCheckIn.clientName}</div>
              </button>
            ) : (
              <p className="text-[14px] text-taupe">Нет предстоящих заездов</p>
            )}
            {d.nextCheckOut && (
              <div className="mt-5 border-t border-graphite/10 pt-4 text-[13px] text-taupe">
                Следующий выезд: <span className="text-graphite">{d.nextCheckOut.propertyName}, {d.nextCheckOut.checkOut === todayISO() ? "сегодня" : fmtDay(d.nextCheckOut.checkOut)}</span>
              </div>
            )}
          </Panel>

          <Panel title={`Новые заявки · ${d.pending.length}`} className="lg:col-span-2">
            {d.pending.length === 0 ? <p className="text-[14px] text-taupe">Все заявки обработаны ✨</p> : <div className="space-y-2">{d.pending.map((b) => <BookingCard key={b.id} b={b} />)}</div>}
          </Panel>

          <Panel title="За неделю">
            <dl className="space-y-3 text-[14px]">
              {[
                ["Новых бронирований", d.week.bookings],
                ["Отмен", d.week.cancellations],
                ["Новых клиентов", d.week.newClients],
                ["Заездов на неделе", d.week.upcomingThisWeek],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between"><dt className="text-taupe">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-6 space-y-3 border-t border-graphite/10 pt-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-taupe">Загрузка на 7 дней</div>
              {d.occupancy.map((o) => (
                <div key={o.propertyId}>
                  <div className="flex justify-between text-[13px]"><span>{o.name}</span><span className="text-taupe">{o.percent}%</span></div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-linen"><div className="h-full rounded-full bg-clay" style={{ width: `${o.percent}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
