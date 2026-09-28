"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PropertyImage } from "@/lib/types";
import { Picture } from "../Picture";
import { Icon } from "../ui/Icon";
import { ImageReveal } from "./Reveal";

export function Gallery({ images, layout = "mosaic" }: { images: (PropertyImage & { caption?: string })[]; layout?: "mosaic" | "strip" }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <>
      <div className={clsx(layout === "mosaic" ? "grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4" : "no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4")}>
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setOpen(i)}
            className={clsx(
              "group relative overflow-hidden rounded-2xl text-left",
              layout === "mosaic" && i === 0 && "col-span-2 row-span-2 aspect-square md:aspect-auto",
              layout === "mosaic" && i !== 0 && "aspect-[4/3]",
              layout === "strip" && "aspect-[4/3] w-[80%] shrink-0 snap-center sm:w-[46%]",
            )}
            aria-label={`Открыть фото: ${img.alt}`}
          >
            <ImageReveal className="h-full w-full" delay={i * 0.06}>
              <div className="h-full w-full transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]">
                <Picture src={img.src} alt={img.alt} />
              </div>
            </ImageReveal>
            {img.caption && <span className="absolute bottom-3 left-3 rounded-full bg-ivory/90 px-3 py-1 text-[12px]">{img.caption}</span>}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {open !== null && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/92 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label="Просмотр фотографий">
            <motion.div key={open} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="aspect-[16/10] w-full max-w-6xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <Picture src={images[open].src} alt={images[open].alt} />
            </motion.div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[13px] text-ivory/70">{images[open].alt} · {open + 1} / {images.length}</div>
            <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-ivory" aria-label="Закрыть"><Icon name="x" /></button>
            <button className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-ivory" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + images.length) % images.length); }} aria-label="Предыдущее фото"><Icon name="chevronLeft" /></button>
            <button className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-ivory" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % images.length); }} aria-label="Следующее фото"><Icon name="chevronRight" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
