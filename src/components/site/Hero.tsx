"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Picture } from "../Picture";
import { ButtonLink } from "../ui/Button";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Parallax moves a single pre-rendered image layer (GPU-composited transform only),
 * so scrolling stays smooth on phones.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mx = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageX = useTransform(mx, (v) => v * -10);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[600px] overflow-hidden bg-graphite"
      onPointerMove={(e) => e.pointerType === "mouse" && mx.set((e.clientX / window.innerWidth - 0.5) * 2)}
      aria-label="Загородный дом «Атмосфера»"
    >
      <motion.div style={{ y: imageY, x: imageX }} className="absolute inset-[-4%] will-change-transform">
        <motion.div className="grain relative h-full w-full" initial={{ scale: 1.06, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.8, ease: EASE }}>
          <Picture src="render:a-dusk" alt="Дом с панорамным остеклением и чаном на закате" priority className="object-[50%_60%]" />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-ink/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent" />

      <motion.div style={{ y: textY, opacity: fade }} className="container-x relative flex h-full flex-col justify-end pb-24 pt-28 will-change-transform md:pb-28">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: EASE }} className="text-[11px] font-medium uppercase tracking-eyebrow text-ivory/75">
          Загородный отдых · Уфа · 20 км от города
        </motion.p>
        <h1 className="mt-6 font-serif text-[56px] leading-[0.92] tracking-[-0.02em] text-ivory sm:text-[88px] lg:text-[118px]">
          {["Место,", "куда хочется", "уехать."].map((line, i) => (
            <span key={line} className="block overflow-hidden pb-2">
              <motion.span className={`block ${i === 2 ? "italic text-beige" : ""}`} initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.4 + i * 0.12, ease: EASE }}>
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9, ease: EASE }} className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-[16px] leading-relaxed text-ivory/80 md:text-[17px]">
            Два уютных дома среди природы, пространство для отдыха, тишины и тёплых вечеров в чане.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/#houses" variant="light" size="lg">Выбрать дом</ButtonLink>
            <ButtonLink href="/#gallery" size="lg" className="border border-ivory/30 bg-transparent text-ivory hover:bg-white/10">Посмотреть галерею</ButtonLink>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 right-10 hidden items-center gap-3 rounded-full border border-white/15 bg-ink/40 px-4 py-2 text-[12px] text-ivory/85 lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{ opacity: { delay: 1.6 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-beige" /> Чан у каждого дома
      </motion.div>
    </section>
  );
}
