"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminTitle } from "@/components/admin/AdminShell";
import { BookingCard } from "@/components/admin/BookingRow";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/api";
import { fmtDateTime, plural } from "@/lib/dates";

export default function AdminClients() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data = [] } = useQuery({ queryKey: ["admin", "clients", q], queryFn: () => adminApi.clients(q), placeholderData: (p) => p });
  return (
    <div className="mx-auto max-w-5xl">
      <AdminTitle title="Клиенты" subtitle={`${data.length} ${plural(data.length, "клиент", "клиента", "клиентов")}`} />
      <Input placeholder="Поиск по имени, телефону, Telegram" value={q} onChange={(e) => setQ(e.target.value)} className="mb-6" aria-label="Поиск" />
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((c) => (
          <button key={c.id} onClick={() => setOpenId(c.id)} className="flex items-center gap-4 rounded-2xl border border-graphite/10 bg-ivory p-4 text-left transition hover:border-graphite/30 hover:shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-beige font-serif text-[18px]">{c.name[0]}</span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{c.name}</div>
              <div className="truncate text-[13px] text-taupe">{c.phone}{c.telegramUsername && ` · @${c.telegramUsername}`}</div>
            </div>
            <span className="text-[12px] text-taupe">{c.bookingsCount} {plural(c.bookingsCount, "бронь", "брони", "броней")}</span>
          </button>
        ))}
      </div>
      <ClientModal id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function ClientModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: c } = useQuery({ queryKey: ["admin", "client", id], queryFn: () => adminApi.client(id!), enabled: !!id });
  const [note, setNote] = useState("");
  useEffect(() => setNote(c?.privateNote ?? ""), [c?.id, c?.privateNote]);
  const save = useMutation({ mutationFn: () => adminApi.updateClientNote(id!, note), onSuccess: () => { toast("Сохранено", "success"); qc.invalidateQueries(); } });
  return (
    <Modal open={!!id} onClose={onClose} title={c?.name ?? "Клиент"} wide>
      {c && (
        <div className="space-y-6">
          <dl className="grid gap-4 rounded-2xl bg-white/70 p-4 sm:grid-cols-2">
            <div><dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Телефон</dt><dd><a href={`tel:${c.phone}`} className="flex items-center gap-2"><Icon name="phone" className="h-4 w-4" />{c.phone}</a></dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Telegram</dt><dd>{c.telegramUsername ? `@${c.telegramUsername}` : "—"} {c.telegram && <span className="text-[12px] text-[#4a5640]">· бот привязан (id {c.telegram.telegramUserId})</span>}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Дата регистрации</dt><dd>{fmtDateTime(c.createdAt)}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.16em] text-taupe">Бронирований</dt><dd>{c.history.length}</dd></div>
          </dl>
          <div>
            <Textarea label="Заметка о клиенте (только для вас)" value={note} onChange={(e) => setNote(e.target.value)} />
            {note !== (c.privateNote ?? "") && <Button size="sm" variant="secondary" className="mt-2" onClick={() => save.mutate()}>Сохранить</Button>}
          </div>
          <div>
            <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.16em] text-taupe">История</h3>
            <div className="space-y-2">{c.history.map((b) => <BookingCard key={b.id} b={b} />)}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}
