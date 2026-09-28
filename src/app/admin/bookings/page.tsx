"use client";

import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import { AdminTitle, useAdmin } from "@/components/admin/AdminShell";
import { STATUS_META, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { adminApi } from "@/lib/api";
import { fmtDayShort, guestsLabel, nightsLabel } from "@/lib/dates";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";

export default function AdminBookings() {
  const { openBooking, openNewBooking } = useAdmin();
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [propertyId, setPropertyId] = useState("");
  const [q, setQ] = useState("");
  const { data: properties = [] } = useQuery({ queryKey: ["admin", "properties"], queryFn: adminApi.properties });
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "bookings", status, propertyId, q], queryFn: () => adminApi.bookings({ status, propertyId: propertyId || undefined, q }), placeholderData: (p) => p });

  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Бронирования" subtitle={`${data.length} в списке`}>
        <Button onClick={() => openNewBooking()}><Icon name="plus" className="h-4 w-4" /> Добавить бронь</Button>
      </AdminTitle>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {(["ALL", ...BOOKING_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={clsx("h-9 shrink-0 rounded-full px-4 text-[13px] transition", status === s ? "bg-graphite text-ivory" : "border border-graphite/10 bg-ivory text-umber")}>
            {s === "ALL" ? "Все" : STATUS_META[s].label}
          </button>
        ))}
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <Input placeholder="Поиск: имя, телефон, код ATM-…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Поиск" />
        <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} aria-label="Дом">
          <option value="">Все дома</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-graphite/10 bg-ivory">
        <table className="w-full text-left text-[14px]">
          <thead className="hidden border-b border-graphite/10 text-[11px] uppercase tracking-[0.14em] text-taupe md:table-header-group">
            <tr><th className="px-5 py-3 font-medium">Код</th><th className="px-5 py-3 font-medium">Гость</th><th className="px-5 py-3 font-medium">Дом</th><th className="px-5 py-3 font-medium">Даты</th><th className="px-5 py-3 font-medium">Гости</th><th className="px-5 py-3 font-medium">Статус</th></tr>
          </thead>
          <tbody className="divide-y divide-graphite/10">
            {data.map((b) => (
              <tr key={b.id} onClick={() => openBooking(b.id)} className="cursor-pointer transition hover:bg-linen/50 max-md:flex max-md:flex-wrap max-md:gap-x-3 max-md:gap-y-1 max-md:p-4">
                <td className="text-[12px] tracking-wider text-taupe md:px-5 md:py-4">{b.code}</td>
                <td className="font-medium md:px-5 md:py-4 max-md:order-first max-md:w-full">{b.clientName}<div className="text-[12px] font-normal text-taupe">{b.clientPhone}</div></td>
                <td className="md:px-5 md:py-4">{b.propertyName}</td>
                <td className="md:px-5 md:py-4">{fmtDayShort(b.checkIn)} → {fmtDayShort(b.checkOut)} <span className="text-taupe">· {nightsLabel(b.nights)}</span></td>
                <td className="md:px-5 md:py-4 max-md:hidden">{guestsLabel(b.guestsCount)}</td>
                <td className="md:px-5 md:py-4 max-md:w-full"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && data.length === 0 && <p className="p-10 text-center text-taupe">Ничего не найдено</p>}
      </div>
    </div>
  );
}
