"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { fmtRange } from "@/lib/dates";
import { AvailabilityCalendar, type Range } from "../booking/AvailabilityCalendar";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import type { NewBookingPrefill } from "./AdminShell";

export function NewBookingModal({ prefill, onClose }: { prefill: NewBookingPrefill | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: properties = [] } = useQuery({ queryKey: ["admin", "properties"], queryFn: adminApi.properties, enabled: !!prefill });
  const [propertyId, setPropertyId] = useState("");
  const [range, setRange] = useState<Range>({});
  const [f, setF] = useState({ name: "", phone: "", telegram: "", guests: 2, comment: "", confirm: true });

  useEffect(() => {
    if (!prefill) return;
    setPropertyId(prefill.propertyId ?? properties[0]?.id ?? "");
    setRange({ checkIn: prefill.checkIn, checkOut: prefill.checkOut });
    setF({ name: "", phone: "", telegram: "", guests: 2, comment: "", confirm: true });
  }, [prefill, properties]);

  const create = useMutation({
    mutationFn: async () => {
      const b = await adminApi.createBooking({ propertyId, checkIn: range.checkIn!, checkOut: range.checkOut!, guestsCount: f.guests, name: f.name, phone: f.phone, telegramUsername: f.telegram, comment: f.comment });
      if (f.confirm) await adminApi.confirm(b.id);
      return b;
    },
    onSuccess: (b) => {
      toast(`Бронь ${b.code} создана`, "success");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e) => toast((e as Error).message, "error"),
  });
  const property = properties.find((p) => p.id === propertyId);

  return (
    <Modal open={!!prefill} onClose={onClose} title="Новая бронь" wide>
      <div className="space-y-6">
        <Select label="Дом" value={propertyId} onChange={(e) => { setPropertyId(e.target.value); setRange({}); }}>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}{p.isActive ? "" : " (скрыт)"}</option>)}
        </Select>
        {propertyId && (
          <div className="rounded-2xl border border-graphite/10 bg-white/60 p-4">
            <AvailabilityCalendar propertyId={propertyId} value={range} onChange={setRange} fetcher={adminApi.availabilityFor} />
          </div>
        )}
        <p className="text-[14px]">{range.checkIn && range.checkOut ? fmtRange(range.checkIn, range.checkOut) : "Выберите даты заезда и выезда"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Имя гостя" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input label="Телефон" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+7" />
          <Input label="Telegram" value={f.telegram} onChange={(e) => setF({ ...f, telegram: e.target.value })} placeholder="@username" />
          <Input label={`Гостей (макс. ${property?.capacity ?? "—"})`} type="number" min={1} max={property?.capacity} value={f.guests} onChange={(e) => setF({ ...f, guests: Number(e.target.value) })} />
        </div>
        <Textarea label="Комментарий" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} />
        <label className="flex items-center gap-3 text-[14px]">
          <input type="checkbox" checked={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.checked })} className="h-5 w-5 accent-graphite" /> Сразу подтвердить
        </label>
        <Button size="lg" className="w-full" disabled={!range.checkIn || !range.checkOut} loading={create.isPending} onClick={() => create.mutate()}>Создать бронь</Button>
      </div>
    </Modal>
  );
}
