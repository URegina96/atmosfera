"use client";

import { motion } from "framer-motion";

export function Reveal({ children, delay = 0, className, y = 28 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Image reveal: a curtain slides away while the picture settles from a slight zoom. */
export function ImageReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.12 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
      <motion.div
        className="absolute inset-0 origin-top bg-linen"
        initial={{ scaleY: 1 }}
        whileInView={{ scaleY: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, delay, ease: [0.76, 0, 0.24, 1] }}
      />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, text, align = "left" }: { eyebrow: string; title: React.ReactNode; text?: string; align?: "left" | "center" }) {
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-[40px] leading-[1.02] tracking-[-0.01em] text-graphite sm:text-[56px]">{title}</h2>
      {text && <p className="mt-5 text-[16px] leading-relaxed text-umber/80">{text}</p>}
    </Reveal>
  );
}
