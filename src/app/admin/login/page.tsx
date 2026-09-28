"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Picture } from "@/components/Picture";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { adminLogin } from "@/lib/auth";

export default function AdminLogin() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      await adminLogin(login, password);
      router.replace("/admin");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-ivory lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Picture src="render:b-night" alt="Дом №2 ночью" className="absolute inset-0" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
        <p className="absolute bottom-12 left-12 max-w-sm font-serif text-[40px] leading-tight text-ivory">Панель владельца «Атмосферы»</p>
      </div>
      <div className="flex items-center justify-center px-4 py-16">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate>
          <Link href="/" className="font-serif text-[22px] tracking-[0.28em]">АТМОСФЕРА</Link>
          <h1 className="pt-6 font-serif text-[40px] leading-none">Вход</h1>
          <Input label="Логин" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} />
          <Input label="Пароль" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
          <Button type="submit" size="lg" className="w-full" loading={loading}>Войти</Button>
          <div className="rounded-2xl border border-dashed border-graphite/20 p-4 text-[13px] text-umber/80">
            Демо-доступ: <b className="font-medium">admin</b> / <b className="font-medium">atmosfera2026</b>
            <button type="button" className="ml-2 underline underline-offset-4" onClick={() => { setLogin("admin"); setPassword("atmosfera2026"); }}>подставить</button>
          </div>
        </form>
      </div>
    </div>
  );
}
