"use client";

import { fmtDayShort, guestsLabel, nightsLabel } from "@/lib/dates";
import type { BookingRow } from "@/lib/api";
import { StatusBadge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { useAdmin } from "./AdminShell";

export function BookingCard({ b, compact }: { b: BookingRow; compact?: boolean }) {
  const { openBooking } = useAdmin();
  return (
    <button onClick={() => openBooking(b.id)} className="flex w-full items-center gap-4 rounded-2xl border border-graphite/10 bg-white/70 p-4 text-left transition hover:border-graphite/30 hover:shadow-soft">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{b.clientName}</span>
          <StatusBadge status={b.status} />
          {b.rescheduleRequest && <span className="rounded-full bg-[#f1e4cc] px-2 py-0.5 text-[11px] text-[#7a5a2c]">перенос?</span>}
        </div>
        <div className="mt-1 truncate text-[13px] text-taupe">
          {b.propertyName} · {fmtDayShort(b.checkIn)} → {fmtDayShort(b.checkOut)}{!compact && ` · ${nightsLabel(b.nights)}`} · {guestsLabel(b.guestsCount)}
        </div>
      </div>
      <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-taupe" />
    </button>
  );
}
