"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";

export const NAV = [
  { href: "/properties", label: "Домики" },
  { href: "/#amenities", label: "Услуги" },
  { href: "/#gallery", label: "Галерея" },
  { href: "/rules", label: "Правила" },
  { href: "/contacts", label: "Контакты" },
];

export function Header({ overlay = false }: { overlay?: boolean }) {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(!overlay);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useMotionValueEvent(scrollY, "change", (y) => setSolid(!overlay || y > 40));
  useEffect(() => setOpen(false), [pathname]);

  const light = overlay && !solid && !open;
  return (
    <>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          solid || open ? "border-b border-graphite/10 bg-ivory/95 md:bg-ivory/85 md:backdrop-blur-xl" : "border-b border-white/10 bg-transparent",
        )}
      >
        <div className="container-x flex h-16 items-center justify-between md:h-20">
          <Link href="/" className={clsx("font-serif text-[22px] tracking-[0.28em] transition-colors md:text-[24px]", light ? "text-ivory" : "text-graphite")} aria-label="Атмосфера — на главную">
            АТМОСФЕРА
          </Link>
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Основная навигация">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={clsx("text-[13px] tracking-wide transition-colors", light ? "text-ivory/80 hover:text-ivory" : "text-umber hover:text-graphite", pathname === n.href && "underline underline-offset-8")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/account" className={clsx("hidden h-10 items-center gap-2 rounded-full px-4 text-[13px] transition md:flex", light ? "text-ivory/85 hover:bg-white/10" : "text-umber hover:bg-graphite/5")}>
              <Icon name="user" className="h-4 w-4" /> Мои брони
            </Link>
            <ButtonLink href="/booking" variant={light ? "light" : "primary"} size="sm" className="hidden sm:inline-flex md:h-11 md:px-6">
              Забронировать
            </ButtonLink>
            <button onClick={() => setOpen((o) => !o)} className={clsx("grid h-10 w-10 place-items-center rounded-full lg:hidden", light ? "text-ivory" : "text-graphite")} aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open}>
              <Icon name={open ? "x" : "menu"} className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 bg-ivory pt-20 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <nav className="container-x flex flex-col" aria-label="Мобильная навигация">
              {[...NAV, { href: "/account", label: "Мои бронирования" }].map((n, i) => (
                <motion.div key={n.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex items-center justify-between border-b border-graphite/10 py-5 font-serif text-[32px]">
                    {n.label}
                    <Icon name="arrow" className="h-5 w-5 text-taupe" />
                  </Link>
                </motion.div>
              ))}
              <ButtonLink href="/booking" size="lg" className="mt-8 w-full">Забронировать</ButtonLink>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Sticky bottom CTA for phones. */
export function MobileBookingBar() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 320));
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite/10 bg-ivory px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:hidden">
          <ButtonLink href="/booking" size="lg" className="w-full">Забронировать</ButtonLink>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
