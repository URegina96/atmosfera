"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { shiftISO, todayISO } from "@/lib/dates";
import { BLOCK_REASONS, type BlockReason } from "@/lib/types";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import type { NewBookingPrefill } from "./AdminShell";

export const REASON_LABEL: Record<BlockReason, string> = { PERSONAL: "Личные даты", REPAIR: "Ремонт", MAINTENANCE: "Технический перерыв", OTHER: "Другое" };

export function BlockModal({ prefill, onClose }: { prefill: NewBookingPrefill | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: properties = [] } = useQuery({ queryKey: ["admin", "properties"], queryFn: adminApi.properties, enabled: !!prefill });
  const [f, setF] = useState({ propertyId: "", from: todayISO(), to: todayISO(), reason: "PERSONAL" as BlockReason, note: "" });

  useEffect(() => {
    if (!prefill) return;
    const from = prefill.checkIn ?? todayISO();
    setF({ propertyId: prefill.propertyId ?? properties[0]?.id ?? "", from, to: prefill.checkOut ? shiftISO(prefill.checkOut, -1) : from, reason: "PERSONAL", note: "" });
  }, [prefill, properties]);

  const save = useMutation({
    mutationFn: () => adminApi.createBlock({ propertyId: f.propertyId, from: f.from, to: f.to, reason: f.reason, note: f.note || undefined }),
    onSuccess: () => {
      toast("Даты заблокированы", "success");
      qc.invalidateQueries();
      onClose();
    },
    onError: (e) => toast((e as Error).message, "error"),
  });

  return (
    <Modal open={!!prefill} onClose={onClose} title="Заблокировать даты">
      <div className="space-y-5">
        <Select label="Дом" value={f.propertyId} onChange={(e) => setF({ ...f, propertyId: e.target.value })}>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="С (ночь)" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: e.target.value > f.to ? e.target.value : f.to })} />
          <Input label="По (ночь)" type="date" value={f.to} min={f.from} onChange={(e) => setF({ ...f, to: e.target.value })} />
        </div>
        <Select label="Причина" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value as BlockReason })}>
          {BLOCK_REASONS.map((r) => <option key={r} value={r}>{REASON_LABEL[r]}</option>)}
        </Select>
        <Input label="Комментарий (не виден клиентам)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <Button size="lg" className="w-full" loading={save.isPending} onClick={() => save.mutate()}>Заблокировать</Button>
      </div>
    </Modal>
  );
}
