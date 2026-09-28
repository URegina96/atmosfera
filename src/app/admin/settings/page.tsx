"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminTitle, Panel } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { AMENITY_ICONS, Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { adminApi, publicApi } from "@/lib/api";
import { changeAdminPassword } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";
import { resetDatabase } from "@/lib/db";
import type { Amenity, HouseRule, Settings } from "@/lib/types";

export default function AdminSettings() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: settings } = useQuery({ queryKey: ["admin", "settings"], queryFn: adminApi.settings });
  const { data: rulesData } = useQuery({ queryKey: ["rules-admin"], queryFn: publicApi.rules });
  const { data: amenities = [] } = useQuery({ queryKey: ["admin", "amenities"], queryFn: adminApi.amenities });
  const { data: audit = [] } = useQuery({ queryKey: ["admin", "audit"], queryFn: adminApi.audit });
  const [s, setS] = useState<Settings | null>(null);
  const [rules, setRules] = useState<HouseRule[]>([]);
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [newAmenity, setNewAmenity] = useState({ name: "", icon: "star" });

  useEffect(() => { if (settings) setS(settings); }, [settings]);
  useEffect(() => { if (rulesData) setRules(rulesData); }, [rulesData]);

  const done = (msg: string) => { toast(msg, "success"); qc.invalidateQueries(); };
  const saveSettings = useMutation({ mutationFn: () => adminApi.saveSettings(s!), onSuccess: () => done("Настройки сохранены") });
  const saveRules = useMutation({ mutationFn: () => adminApi.saveRules(rules.filter((r) => r.title.trim())), onSuccess: () => done("Правила сохранены") });
  const saveAmenity = useMutation({ mutationFn: (a: Amenity) => adminApi.saveAmenity(a), onSuccess: () => done("Удобство сохранено") });
  const delAmenity = useMutation({ mutationFn: adminApi.deleteAmenity, onSuccess: () => done("Удобство удалено") });
  const changePwd = useMutation({ mutationFn: () => changeAdminPassword(pwd.current, pwd.next), onSuccess: () => { setPwd({ current: "", next: "" }); toast("Пароль изменён", "success"); }, onError: (e) => toast((e as Error).message, "error") });

  if (!s) return <div className="h-96 animate-pulse rounded-3xl bg-linen" />;
  const f = <K extends keyof Settings>(k: K) => ({ value: s[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value }) });

  return (
    <div className="mx-auto max-w-5xl">
      <AdminTitle title="Настройки" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Контакты и заезд" action={<Button size="sm" onClick={() => saveSettings.mutate()} loading={saveSettings.isPending}>Сохранить</Button>}>
          <div className="space-y-4">
            <Input label="Телефон" {...f("phone")} />
            <Input label="E-mail" {...f("email")} />
            <Input label="Telegram-бот (username)" {...f("telegramBotUsername")} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Заезд с" type="time" {...f("checkInTime")} />
              <Input label="Выезд до" type="time" {...f("checkOutTime")} />
              <Input label="Мин. ночей" type="number" min={1} value={s.minNights} onChange={(e) => setS({ ...s, minNights: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-3 text-[14px]"><input type="checkbox" checked={s.reminder3h} onChange={(e) => setS({ ...s, reminder3h: e.target.checked })} className="h-5 w-5 accent-graphite" /> Напоминание за 3 часа до заезда (за 24 часа — всегда)</label>
          </div>
        </Panel>
        <Panel title="Расположение" action={<Button size="sm" onClick={() => saveSettings.mutate()} loading={saveSettings.isPending}>Сохранить</Button>}>
          <div className="space-y-4">
            <Input label="Строка локации" {...f("locationLine")} />
            <Input label="Адрес" {...f("address")} />
            <label className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 text-[14px]"><input type="checkbox" checked={s.showExactAddress} onChange={(e) => setS({ ...s, showExactAddress: e.target.checked })} className="h-5 w-5 accent-graphite" /> Показывать точный адрес на сайте</label>
            <Textarea label="Как добраться (текст на сайте)" {...f("directions")} />
          </div>
        </Panel>

        <Panel title="Правила проживания" className="lg:col-span-2" action={<Button size="sm" onClick={() => saveRules.mutate()} loading={saveRules.isPending}>Сохранить правила</Button>}>
          <div className="space-y-3">
            {rules.map((r, i) => (
              <div key={r.id} className="grid gap-2 rounded-2xl bg-white/70 p-3 sm:grid-cols-[200px_1fr_auto]">
                <Input value={r.title} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} aria-label="Заголовок правила" />
                <Input value={r.text} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} aria-label="Текст правила" />
                <div className="flex gap-1">
                  <button onClick={() => i > 0 && setRules(rules.map((x, j) => (j === i - 1 ? rules[i] : j === i ? rules[i - 1] : x)))} className="grid h-12 w-10 place-items-center rounded-xl hover:bg-linen" aria-label="Выше"><Icon name="up" className="h-4 w-4" /></button>
                  <button onClick={() => setRules(rules.filter((_, j) => j !== i))} className="grid h-12 w-10 place-items-center rounded-xl text-[#8a4a3a] hover:bg-linen" aria-label="Удалить"><Icon name="trash" className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setRules([...rules, { id: adminApi.newRuleId(), title: "", text: "" }])}><Icon name="plus" className="h-4 w-4" /> Добавить правило</Button>
          </div>
        </Panel>

        <Panel title="Справочник удобств">
          <div id="amenities" className="space-y-2">
            {amenities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-[14px]">
                <Icon name={a.icon} className="h-4 w-4 text-clay" />
                <span className="flex-1">{a.name}</span>
                <button onClick={() => delAmenity.mutate(a.id)} className="grid h-8 w-8 place-items-center rounded-full text-[#8a4a3a] hover:bg-linen" aria-label={`Удалить ${a.name}`}><Icon name="trash" className="h-4 w-4" /></button>
              </div>
            ))}
            <div className="flex items-end gap-2 pt-3">
              <div className="flex-1"><Input label="Новое удобство" value={newAmenity.name} onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })} placeholder="Баня" /></div>
              <div className="w-28"><Select label="Иконка" value={newAmenity.icon} onChange={(e) => setNewAmenity({ ...newAmenity, icon: e.target.value })}>{AMENITY_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}</Select></div>
              <Button disabled={!newAmenity.name.trim()} onClick={() => { saveAmenity.mutate({ id: adminApi.newAmenityId(), name: newAmenity.name.trim(), icon: newAmenity.icon }); setNewAmenity({ name: "", icon: "star" }); }}><Icon name="plus" className="h-4 w-4" /></Button>
            </div>
          </div>
        </Panel>

        <Panel title="Безопасность">
          <div className="space-y-4">
            <Input label="Текущий пароль" type="password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
            <Input label="Новый пароль" type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} hint="Минимум 8 символов" />
            <Button variant="secondary" onClick={() => changePwd.mutate()} loading={changePwd.isPending} disabled={!pwd.current || !pwd.next}>Сменить пароль</Button>
            <div className="border-t border-graphite/10 pt-4 text-[13px] text-taupe">
              Telegram: токен бота и ID чата владельца задаются только в переменных окружения сервера (TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID) и не хранятся в коде.
            </div>
            <Button variant="danger" size="sm" onClick={() => { if (confirm("Сбросить все данные демо к исходным?")) { resetDatabase(); toast("Демо-данные восстановлены", "success"); } }}>Сбросить демо-данные</Button>
          </div>
        </Panel>

        <Panel title="Журнал действий" className="lg:col-span-2">
          <div className="max-h-96 divide-y divide-graphite/10 overflow-y-auto text-[13px]">
            {audit.length === 0 && <p className="py-4 text-taupe">Пока пусто</p>}
            {audit.map((a) => (
              <div key={a.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2.5">
                <span className="w-28 text-taupe">{fmtDateTime(a.at)}</span>
                <span className="font-mono text-[11px] text-clay">{a.action}</span>
                <span className="flex-1">{a.details}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
