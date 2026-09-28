"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clientApi } from "@/lib/api";
import { clientLogin, clientLogout, getClientSession, type ClientSession } from "@/lib/auth";
import { fmtRange, guestsLabel, nightsLabel } from "@/lib/dates";
import { StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { PageIntro } from "./PageIntro";
import { SiteShell } from "./SiteShell";

export function AccountPage() {
  const [session, setSession] = useState<ClientSession | null | undefined>(undefined);
  useEffect(() => setSession(getClientSession()), []);
  if (session === undefined) return <SiteShell><div className="h-[60vh]" /></SiteShell>;
  return (
    <SiteShell>
      {session ? <MyBookings session={session} onLogout={() => { clientLogout(); setSession(null); }} /> : <Login onLogin={setSession} />}
    </SiteShell>
  );
}

function Login({ onLogin }: { onLogin: (s: ClientSession) => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onLogin(clientLogin(phone, code));
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <>
      <PageIntro eyebrow="Личный кабинет" title="Мои бронирования" text="Войдите по номеру телефона и коду бронирования — он указан в подтверждении и в Telegram." />
      <div className="container-x grid gap-10 pb-24 md:grid-cols-[1fr_1fr] md:pb-36">
        <form onSubmit={submit} className="space-y-5 rounded-[28px] border border-graphite/10 bg-white/70 p-6 sm:p-8" noValidate>
          <Input label="Телефон" type="tel" autoComplete="tel" placeholder="+7 900 000-00-00" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Код бронирования" placeholder="ATM-1042" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} error={error} />
          <Button type="submit" size="lg" className="w-full">Войти</Button>
        </form>
        <div className="rounded-[28px] border border-dashed border-graphite/20 p-6 text-[14px] leading-relaxed text-umber/80 sm:p-8">
          <p className="eyebrow">Демо-доступ</p>
          <p className="mt-4">Телефон: <b className="font-medium text-graphite">+7 900 000-00-00</b><br />Код: <b className="font-medium text-graphite">ATM-1042</b></p>
          <p className="mt-4">После новой заявки на сайте можно войти с её телефоном и кодом со страницы «Спасибо».</p>
          <button type="button" onClick={() => { setPhone("+7 900 000-00-00"); setCode("ATM-1042"); }} className="mt-5 font-medium text-graphite underline underline-offset-4">Подставить демо-данные</button>
        </div>
      </div>
    </>
  );
}

function MyBookings({ session, onLogout }: { session: ClientSession; onLogout: () => void }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["my-bookings", session.clientId], queryFn: clientApi.myBookings });
  return (
    <>
      <PageIntro eyebrow="Личный кабинет" title={`Здравствуйте, ${session.name.split(" ")[0]}`}>
        <button onClick={() => { onLogout(); qc.removeQueries({ queryKey: ["my-bookings"] }); }} className="mt-6 flex items-center gap-2 text-[14px] text-taupe hover:text-graphite">
          <Icon name="logout" className="h-4 w-4" /> Выйти
        </button>
      </PageIntro>
      <div className="container-x space-y-3 pb-24 md:pb-36">
        {isLoading && <div className="h-32 animate-pulse rounded-[24px] bg-linen" />}
        {data.map((b) => (
          <Link key={b.token} href={`/booking/manage?token=${b.token}`} className="group flex flex-col gap-4 rounded-[24px] border border-graphite/10 bg-white/60 p-6 transition hover:border-graphite/30 hover:shadow-soft sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-serif text-[28px] leading-none">{b.propertyName}</span>
                <StatusBadge status={b.status} />
              </div>
              <p className="mt-2 text-[15px]">{fmtRange(b.checkIn, b.checkOut)} · <span className="text-taupe">{nightsLabel(b.nights)} · {guestsLabel(b.guestsCount)}</span></p>
              <p className="mt-1 text-[12px] tracking-wider text-taupe">{b.code}</p>
            </div>
            <span className="flex items-center gap-2 text-[13px] font-medium">Открыть <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
        ))}
      </div>
    </>
  );
}
