"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { fmtDateTime, fmtDay, fmtRange, guestsLabel, nightsLabel } from "@/lib/dates";
import { formatRub } from "@/lib/services/pricing";
import { PAYMENT_STATUSES, type ID, type PaymentStatus } from "@/lib/types";
import { AvailabilityCalendar, type Range } from "../booking/AvailabilityCalendar";
import { PAYMENT_LABEL, StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Select, Textarea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

const SOURCE_LABEL = { WEBSITE: "Сайт", TELEGRAM: "Telegram", ADMIN: "Админ" } as const;

export function BookingModal({ id, onClose }: { id: ID | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<"view" | "move" | "cancel">("view");
  const [range, setRange] = useState<Range>({});
  const [note, setNote] = useState("");
  const { data: b } = useQuery({ queryKey: ["admin", "booking", id], queryFn: () => adminApi.booking(id!), enabled: !!id });

  useEffect(() => {
    setMode("view");
    setRange({});
  }, [id]);
  useEffect(() => setNote(b?.adminNote ?? ""), [b?.adminNote, b?.id]);

  const run = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e) => toast((e as Error).message, "error"),
  });
  const act = (fn: () => Promise<unknown>, msg: string, close = false) =>
    run.mutate(fn, {
      onSuccess: () => {
        toast(msg, "success");
        setMode("view");
        if (close) onClose();
      },
    });

  const active = b && (b.status === "PENDING" || b.status === "CONFIRMED");

  return (
    <Modal open={!!id} onClose={onClose} title={b ? `Бронь ${b.code}` : "Бронь"} wide>
      {!b ? (
        <div className="h-60 animate-pulse rounded-2xl bg-linen" />
      ) : mode === "move" ? (
        <div>
          <p className="mb-4 text-[14px] text-umber/80">Текущие даты: {fmtRange(b.checkIn, b.checkOut)}. Выберите новые — старые освободятся, новые будут проверены и заняты одной операцией.</p>
          <AvailabilityCalendar
            propertyId={b.propertyId}
            value={range}
            onChange={setRange}
            ownRange={{ checkIn: b.checkIn, checkOut: b.checkOut }}
            fetcher={adminApi.availabilityFor}
          />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px]">{range.checkIn && range.checkOut ? `Новые даты: ${fmtRange(range.checkIn, range.checkOut)}` : "Выберите даты"}</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMode("view")}>Назад</Button>
              <Button disabled={!range.checkIn || !range.checkOut} loading={run.isPending} onClick={() => act(() => adminApi.reschedule(b.id, range.checkIn!, range.checkOut!), "Бронь перенесена")}>
                Перенести
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={b.status} />
                <span className="rounded-full bg-linen px-2.5 py-1 text-[12px] text-umber">{SOURCE_LABEL[b.source]}</span>
              </div>
              <h3 className="mt-3 font-serif text-[30px] leading-none">{b.propertyName}</h3>
              <p className="mt-2 text-[16px]">{fmtDay(b.checkIn)} → {fmtDay(b.checkOut)} · <span className="text-taupe">{nightsLabel(b.nights)} · {guestsLabel(b.guestsCount)}</span></p>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.16em] text-taupe">Расчёт стоимости</div>
              <div className="font-serif text-[28px]">{b.quote.total ? formatRub(b.quote.total) : "—"}</div>
              {b.quote.hasGaps && <div className="text-[11px] text-[#9a5543]">Не для всех ночей задана цена</div>}
            </div>
          </div>

          {b.rescheduleRequest && active && (
            <div className="rounded-2xl border border-[#c99a4e]/40 bg-[#f1e4cc]/50 p-4">
              <p className="text-[14px]">🔄 Клиент просит перенести на <b className="font-medium">{fmtRange(b.rescheduleRequest.checkIn, b.rescheduleRequest.checkOut)}</b></p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => act(() => adminApi.reschedule(b.id, b.rescheduleRequest!.checkIn, b.rescheduleRequest!.checkOut), "Перенос подтверждён")}>Принять перенос</Button>
                <Button size="sm" variant="ghost" onClick={() => act(() => adminApi.declineRescheduleRequest(b.id), "Запрос отклонён")}>Отклонить</Button>
              </div>
            </div>
          )}

          <div className="grid gap-4 rounded-2xl bg-white/70 p-4 sm:grid-cols-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-taupe">Клиент</div>
              <div className="mt-1 text-[15px]">{b.clientName}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-taupe">Телефон</div>
              <a href={`tel:${b.clientPhone}`} className="mt-1 block text-[15px] underline-offset-4 hover:underline">{b.clientPhone}</a>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-taupe">Telegram</div>
              <div className="mt-1 text-[15px]">{b.clientTelegram ? `@${b.clientTelegram}` : "—"} {b.telegramLinked && <span className="text-[12px] text-[#4a5640]">· бот привязан</span>}</div>
            </div>
          </div>

          {b.comment && <p className="rounded-2xl bg-linen/60 p-4 text-[14px]">💬 {b.comment}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Оплата"
              value={b.paymentStatus}
              onChange={(e) => act(() => adminApi.updateBooking(b.id, { paymentStatus: e.target.value as PaymentStatus }), "Статус оплаты обновлён")}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>
              ))}
            </Select>
            <div className="text-[12px] text-taupe sm:pt-7">Создана {fmtDateTime(b.createdAt)}{b.confirmedAt && ` · подтверждена ${fmtDateTime(b.confirmedAt)}`}{b.cancelledAt && ` · отменена ${fmtDateTime(b.cancelledAt)}${b.cancelledBy === "CLIENT" ? " клиентом" : ""}`}</div>
          </div>
          <div>
            <Textarea label="Заметка (видна только вам)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: подготовить дрова" />
            {note !== (b.adminNote ?? "") && (
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => act(() => adminApi.updateBooking(b.id, { adminNote: note }), "Заметка сохранена")}>Сохранить заметку</Button>
            )}
          </div>

          {mode === "cancel" ? (
            <div className="rounded-2xl border border-[#8a4a3a]/30 p-4">
              <p className="text-[14px]">Отменить бронь? Даты освободятся, клиент получит уведомление.</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="bg-[#7a3b2c] hover:bg-[#6a3225]" loading={run.isPending} onClick={() => act(() => adminApi.cancel(b.id), "Бронь отменена", true)}>Да, отменить</Button>
                <Button size="sm" variant="ghost" onClick={() => setMode("view")}>Нет</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 border-t border-graphite/10 pt-5">
              {b.status === "PENDING" && (
                <Button loading={run.isPending} onClick={() => act(() => adminApi.confirm(b.id), "Бронь подтверждена")}><Icon name="check" className="h-4 w-4" /> Подтвердить</Button>
              )}
              {b.status === "CONFIRMED" && (
                <>
                  <Button onClick={() => act(() => adminApi.complete(b.id), "Бронь завершена")}>Завершить</Button>
                  <Button variant="secondary" onClick={() => act(() => adminApi.noShow(b.id), "Отмечено: гость не приехал")}>Не заехал</Button>
                </>
              )}
              {active && (
                <>
                  <Button variant="secondary" onClick={() => setMode("move")}><Icon name="calendar" className="h-4 w-4" /> Перенести</Button>
                  <Button variant="danger" onClick={() => setMode("cancel")}>{b.status === "PENDING" ? "Отклонить" : "Отменить"}</Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
