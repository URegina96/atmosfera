"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { AdminTitle, Panel } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/api";
import { fmtDay, shiftISO, todayISO } from "@/lib/dates";
import { formatRub } from "@/lib/services/pricing";
import type { PriceRule, PriceRuleKind } from "@/lib/types";

const KIND_LABEL: Record<PriceRuleKind, string> = { BASE: "Базовая", WEEKDAY: "Будни", WEEKEND: "Выходные (пт, сб)", HOLIDAY: "Праздники", SEASONAL: "Сезон", SPECIAL: "Особая дата" };
const RANGED: PriceRuleKind[] = ["HOLIDAY", "SEASONAL", "SPECIAL"];

export default function AdminPrices() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: properties = [] } = useQuery({ queryKey: ["admin", "properties"], queryFn: adminApi.properties });
  const [pid, setPid] = useState("");
  useEffect(() => { if (!pid && properties[0]) setPid(properties[0].id); }, [properties, pid]);
  const { data: rules = [] } = useQuery({ queryKey: ["admin", "prices", pid], queryFn: () => adminApi.priceRules(pid), enabled: !!pid });
  const [draft, setDraft] = useState<Partial<PriceRule>>({ kind: "SEASONAL" });
  const [calc, setCalc] = useState({ checkIn: todayISO(), checkOut: shiftISO(todayISO(), 2) });
  const { data: quote } = useQuery({ queryKey: ["admin", "quote", pid, calc], queryFn: () => adminApi.quote(pid, calc.checkIn, calc.checkOut), enabled: !!pid && calc.checkOut > calc.checkIn });

  const save = useMutation({
    mutationFn: (r: PriceRule) => adminApi.savePriceRule(r),
    onSuccess: () => { toast("Цена сохранена", "success"); qc.invalidateQueries(); },
  });
  const del = useMutation({ mutationFn: adminApi.deletePriceRule, onSuccess: () => qc.invalidateQueries() });

  const fixed = (kind: PriceRuleKind) => rules.find((r) => r.kind === kind);
  const setFixed = (kind: PriceRuleKind, amount: number) => {
    const r = fixed(kind);
    if (!amount && r) return del.mutate(r.id);
    if (amount) save.mutate({ id: r?.id ?? adminApi.newPriceRuleId(), propertyId: pid, kind, amount });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <AdminTitle title="Цены" subtitle="На сайте цены сейчас не показываются — расчёт виден только вам в карточке брони." />
      <div className="mb-6 flex gap-2">
        {properties.map((p) => (
          <button key={p.id} onClick={() => setPid(p.id)} className={clsx("h-10 rounded-full px-5 text-[14px]", pid === p.id ? "bg-graphite text-ivory" : "border border-graphite/10 bg-ivory")}>{p.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Цена за ночь">
          <div className="space-y-4">
            {(["BASE", "WEEKDAY", "WEEKEND"] as PriceRuleKind[]).map((k) => (
              <PriceInput key={`${pid}-${k}-${fixed(k)?.amount}`} label={KIND_LABEL[k]} value={fixed(k)?.amount} onSave={(v) => setFixed(k, v)} />
            ))}
            <p className="text-[12px] text-taupe">Приоритет: особая дата → праздник → сезон → будни/выходные → базовая.</p>
          </div>
        </Panel>
        <Panel title="Калькулятор">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Заезд" type="date" value={calc.checkIn} onChange={(e) => setCalc({ ...calc, checkIn: e.target.value })} />
            <Input label="Выезд" type="date" value={calc.checkOut} onChange={(e) => setCalc({ ...calc, checkOut: e.target.value })} />
          </div>
          {quote && (
            <div className="mt-4">
              <div className="max-h-40 space-y-1 overflow-y-auto text-[13px]">
                {quote.nights.map((n) => (
                  <div key={n.date} className="flex justify-between"><span className="text-taupe">{fmtDay(n.date)} · {n.ruleName ?? KIND_LABEL[n.kind]}</span><span>{formatRub(n.amount)}</span></div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-graphite/10 pt-3"><span>Итого</span><span className="font-serif text-[26px]">{formatRub(quote.total)}</span></div>
              {quote.hasGaps && <p className="text-[12px] text-[#9a5543]">Для некоторых ночей цена не задана</p>}
            </div>
          )}
        </Panel>
        <Panel title="Сезоны, праздники, особые даты" className="lg:col-span-2">
          <div className="space-y-2">
            {rules.filter((r) => RANGED.includes(r.kind)).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 p-3 text-[14px]">
                <span className="rounded-full bg-linen px-2.5 py-1 text-[12px]">{KIND_LABEL[r.kind]}</span>
                <span className="flex-1">{r.name ?? ""} {r.from && `${fmtDay(r.from)} – ${fmtDay(r.to!)}`}</span>
                <span className="font-medium">{formatRub(r.amount)}</span>
                <button onClick={() => del.mutate(r.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-graphite/5" aria-label="Удалить"><Icon name="trash" className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 border-t border-graphite/10 pt-5 sm:grid-cols-6">
            <div className="sm:col-span-1"><Select label="Тип" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as PriceRuleKind })}>{RANGED.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</Select></div>
            <div className="sm:col-span-2"><Input label="Название" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Лето" /></div>
            <Input label="С" type="date" value={draft.from ?? ""} onChange={(e) => setDraft({ ...draft, from: e.target.value, to: draft.to ?? e.target.value })} />
            <Input label="По" type="date" value={draft.to ?? ""} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
            <Input label="₽ / ночь" type="number" value={draft.amount ?? ""} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
          </div>
          <Button className="mt-4" disabled={!draft.from || !draft.to || !draft.amount} onClick={() => { save.mutate({ id: adminApi.newPriceRuleId(), propertyId: pid, kind: draft.kind!, amount: draft.amount!, from: draft.from, to: draft.to, name: draft.name || undefined }); setDraft({ kind: draft.kind }); }}>
            <Icon name="plus" className="h-4 w-4" /> Добавить
          </Button>
        </Panel>
      </div>
    </div>
  );
}

function PriceInput({ label, value, onSave }: { label: string; value?: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(value ? String(value) : "");
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1"><Input label={label} type="number" inputMode="numeric" placeholder="не задано" value={v} onChange={(e) => setV(e.target.value)} /></div>
      {Number(v || 0) !== (value ?? 0) && <Button variant="secondary" onClick={() => onSave(Number(v || 0))}>Сохранить</Button>}
    </div>
  );
}
