"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminLogout, getAdminSession, type AdminSession } from "@/lib/auth";
import type { ID, ISODate } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { BlockModal } from "./BlockModal";
import { BookingModal } from "./BookingModal";
import { NewBookingModal } from "./NewBookingModal";

export const ADMIN_NAV = [
  { href: "/admin", label: "Сводка", icon: "home" },
  { href: "/admin/calendar", label: "Календарь", icon: "calendar" },
  { href: "/admin/bookings", label: "Брони", icon: "list" },
  { href: "/admin/properties", label: "Дома", icon: "building" },
  { href: "/admin/clients", label: "Клиенты", icon: "users" },
  { href: "/admin/prices", label: "Цены", icon: "tag" },
  { href: "/admin/blocked", label: "Блокировки", icon: "lock" },
  { href: "/admin/notifications", label: "Уведомления", icon: "bell" },
  { href: "/admin/settings", label: "Настройки", icon: "settings" },
];
const MOBILE_MAIN = ["/admin", "/admin/calendar", "/admin/bookings", "/admin/clients"];

export interface NewBookingPrefill {
  propertyId?: ID;
  checkIn?: ISODate;
  checkOut?: ISODate;
}

interface AdminCtx {
  session: AdminSession;
  openBooking: (id: ID) => void;
  openNewBooking: (p?: NewBookingPrefill) => void;
  openBlock: (p?: NewBookingPrefill) => void;
}
const Ctx = createContext<AdminCtx | null>(null);
export const useAdmin = () => useContext(Ctx)!;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);
  const [bookingId, setBookingId] = useState<ID | null>(null);
  const [newBooking, setNewBooking] = useState<NewBookingPrefill | null>(null);
  const [block, setBlock] = useState<NewBookingPrefill | null>(null);
  const [more, setMore] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    const s = getAdminSession();
    setSession(s);
    if (!s && !isLogin) router.replace("/admin/login");
  }, [pathname, isLogin, router]);
  useEffect(() => setMore(false), [pathname]);

  const openBooking = useCallback((id: ID) => setBookingId(id), []);
  const openNewBooking = useCallback((p: NewBookingPrefill = {}) => setNewBooking(p), []);
  const openBlock = useCallback((p: NewBookingPrefill = {}) => setBlock(p), []);

  if (isLogin) return <>{children}</>;
  if (!session) return <div className="min-h-screen bg-ivory" />;

  const logout = () => {
    adminLogout();
    router.replace("/admin/login");
  };

  return (
    <Ctx.Provider value={{ session, openBooking, openNewBooking, openBlock }}>
      <div className="min-h-screen bg-[#F3EEE6]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-graphite/10 bg-ivory lg:flex">
          <Link href="/admin" className="px-7 pb-2 pt-8 font-serif text-[22px] tracking-[0.28em]">АТМОСФЕРА</Link>
          <p className="px-7 text-[11px] uppercase tracking-[0.2em] text-taupe">Панель владельца</p>
          <nav className="mt-8 flex flex-1 flex-col gap-0.5 px-3" aria-label="Разделы админки">
            {ADMIN_NAV.map((n) => (
              <Link key={n.href} href={n.href} className={clsx("flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] transition", pathname === n.href ? "bg-graphite text-ivory" : "text-umber hover:bg-graphite/5")}>
                <Icon name={n.icon} className="h-[18px] w-[18px]" /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-graphite/10 p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-beige font-serif text-[16px]">{session.name[0]}</span>
              <div className="flex-1">
                <div className="text-[14px]">{session.name}</div>
                <div className="text-[11px] text-taupe">Администратор</div>
              </div>
              <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-full hover:bg-graphite/5" aria-label="Выйти"><Icon name="logout" className="h-4 w-4" /></button>
            </div>
            <Link href="/" className="mt-1 flex items-center gap-2 px-3 text-[12px] text-taupe hover:text-graphite"><Icon name="arrowLeft" className="h-3.5 w-3.5" /> На сайт</Link>
          </div>
        </aside>

        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-graphite/10 bg-ivory px-4 lg:hidden">
          <Link href="/admin" className="font-serif text-[18px] tracking-[0.24em]">АТМОСФЕРА</Link>
          <button onClick={logout} className="flex items-center gap-2 text-[13px] text-taupe"><Icon name="logout" className="h-4 w-4" /> Выйти</button>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-graphite/10 bg-ivory pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Разделы">
          {ADMIN_NAV.filter((n) => MOBILE_MAIN.includes(n.href)).map((n) => (
            <Link key={n.href} href={n.href} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[10px]", pathname === n.href ? "text-graphite" : "text-taupe")}>
              <Icon name={n.icon} className="h-5 w-5" /> {n.label}
            </Link>
          ))}
          <button onClick={() => setMore(true)} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[10px]", !MOBILE_MAIN.includes(pathname) ? "text-graphite" : "text-taupe")}>
            <Icon name="menu" className="h-5 w-5" /> Ещё
          </button>
        </nav>

        <AnimatePresence>
          {more && (
            <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-ink/40" onClick={() => setMore(false)} />
              <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-ivory p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-graphite/15" />
                <div className="grid grid-cols-3 gap-2">
                  {ADMIN_NAV.filter((n) => !MOBILE_MAIN.includes(n.href)).map((n) => (
                    <Link key={n.href} href={n.href} className="flex flex-col items-center gap-2 rounded-2xl bg-white/70 p-4 text-[12px]">
                      <Icon name={n.icon} /> {n.label}
                    </Link>
                  ))}
                  <Link href="/" className="flex flex-col items-center gap-2 rounded-2xl bg-white/70 p-4 text-[12px]"><Icon name="arrowLeft" /> На сайт</Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <BookingModal id={bookingId} onClose={() => setBookingId(null)} />
        <NewBookingModal prefill={newBooking} onClose={() => setNewBooking(null)} />
        <BlockModal prefill={block} onClose={() => setBlock(null)} />
      </div>
    </Ctx.Provider>
  );
}

export function AdminTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[36px] leading-none sm:text-[44px]">{title}</h1>
        {subtitle && <p className="mt-2 text-[14px] text-taupe">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <section className={clsx("min-w-0 rounded-[22px] border border-graphite/10 bg-ivory p-5 sm:p-6", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.16em] text-taupe">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
