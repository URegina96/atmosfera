"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminTitle, useAdmin } from "@/components/admin/AdminShell";
import { REASON_LABEL } from "@/components/admin/BlockModal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/api";
import { fmtDay, nightsBetween, nightsLabel, shiftISO, todayISO } from "@/lib/dates";

export default function AdminBlocked() {
  const { openBlock } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const { data = [] } = useQuery({ queryKey: ["admin", "blocks"], queryFn: adminApi.blocks });
  const { data: properties = [] } = useQuery({ queryKey: ["admin", "properties"], queryFn: adminApi.properties });
  const del = useMutation({ mutationFn: adminApi.deleteBlock, onSuccess: () => { toast("Даты снова доступны", "success"); qc.invalidateQueries(); } });
  const t = todayISO();
  return (
    <div className="mx-auto max-w-4xl">
      <AdminTitle title="Блокировки" subtitle="Даты, недоступные клиентам: личные, ремонт, технический перерыв">
        <Button onClick={() => openBlock()}><Icon name="plus" className="h-4 w-4" /> Заблокировать даты</Button>
      </AdminTitle>
      <div className="space-y-3">
        {data.length === 0 && <p className="rounded-2xl border border-dashed border-graphite/15 p-10 text-center text-taupe">Нет заблокированных дат</p>}
        {data.map((b) => (
          <div key={b.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-graphite/10 bg-ivory p-5 ${b.to < t ? "opacity-50" : ""}`}>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[repeating-linear-gradient(135deg,#e6ded2_0_4px,#d8cdbd_4px_8px)]"><Icon name="lock" className="h-4 w-4" /></span>
            <div className="flex-1">
              <div className="font-medium">{properties.find((p) => p.id === b.propertyId)?.name} · {fmtDay(b.from)} – {fmtDay(b.to)}</div>
              <div className="text-[13px] text-taupe">{REASON_LABEL[b.reason]} · {nightsLabel(nightsBetween(b.from, shiftISO(b.to, 1)))}{b.note && ` · ${b.note}`}</div>
            </div>
            <Button size="sm" variant="danger" onClick={() => del.mutate(b.id)}>Снять блокировку</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
