"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import { AdminTitle } from "@/components/admin/AdminShell";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/api";
import { fmtDateTime } from "@/lib/dates";

/** Telegram outbox preview. Admin-chat buttons call the same BookingService as the panel. */
export default function AdminNotifications() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<"ADMIN" | "CLIENT">("ADMIN");
  const { data = [] } = useQuery({ queryKey: ["admin", "notifications"], queryFn: adminApi.notifications });
  const { data: bookings = [] } = useQuery({ queryKey: ["admin", "bookings", "ALL", "", ""], queryFn: () => adminApi.bookings() });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "CONFIRM" | "REJECT" }) => (action === "CONFIRM" ? adminApi.confirm(id) : adminApi.cancel(id)),
    onSuccess: (_, v) => { toast(v.action === "CONFIRM" ? "Бронь подтверждена" : "Заявка отклонена", "success"); qc.invalidateQueries(); },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const list = data.filter((n) => n.recipient === tab);

  return (
    <div className="mx-auto max-w-3xl">
      <AdminTitle title="Уведомления" subtitle="Сообщения Telegram-бота" />
      <div className="mb-6 rounded-2xl border border-dashed border-graphite/20 bg-ivory p-4 text-[13px] text-umber/80">
        Бот пока не подключён (нет TELEGRAM_BOT_TOKEN). Сообщения формируются и показываются здесь; после подключения они будут уходить в Telegram. Кнопки под заявками работают уже сейчас.
      </div>
      <div className="mb-6 flex rounded-full border border-graphite/10 bg-ivory p-1">
        {(["ADMIN", "CLIENT"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx("h-9 flex-1 rounded-full text-[13px]", tab === t ? "bg-graphite text-ivory" : "text-umber")}>
            {t === "ADMIN" ? "Чат владельца" : "Сообщения клиентам"}
          </button>
        ))}
      </div>
      <div className="space-y-4 rounded-[28px] bg-[#e7dfd2] p-4 sm:p-6">
        {list.length === 0 && <p className="py-10 text-center text-[14px] text-umber/70">Пока нет сообщений. Оставьте заявку на сайте — она появится здесь.</p>}
        {list.map((n) => {
          const booking = bookings.find((b) => b.id === n.bookingId);
          const pending = booking?.status === "PENDING";
          return (
            <div key={n.id} className="max-w-[92%] sm:max-w-[80%]">
              <div className="rounded-2xl rounded-tl-md bg-ivory p-4 shadow-sm">
                {tab === "CLIENT" && booking && <div className="mb-2 text-[12px] font-medium text-clay">→ {booking.clientName}{booking.clientTelegram && ` (@${booking.clientTelegram})`}</div>}
                <pre className="whitespace-pre-wrap font-sans text-[14px] leading-snug">{n.text}</pre>
                <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-taupe">
                  {n.bookingCode} · {fmtDateTime(n.createdAt)}
                  {n.status === "READY" ? <Icon name="check" className="h-3.5 w-3.5 text-[#5c6650]" /> : <span title={n.reason} className="text-[#9a5543]">не доставлено: {n.reason}</span>}
                </div>
              </div>
              {n.buttons && (
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {n.buttons.map((btn) => (
                    <button key={btn.action} disabled={!pending || act.isPending} onClick={() => act.mutate({ id: n.bookingId, action: btn.action })} className="rounded-xl bg-ivory/70 py-2.5 text-[13px] font-medium transition hover:bg-ivory disabled:opacity-40">
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
