"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "default" | "success" | "error";
interface ToastItem { id: number; text: string; tone: Tone }

const Ctx = createContext<(text: string, tone?: Tone) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: Tone = "default") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, text, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-8" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto max-w-md rounded-full px-5 py-3 text-sm shadow-lift ${
                t.tone === "error" ? "bg-[#6b3a2e] text-ivory" : t.tone === "success" ? "bg-graphite text-ivory" : "bg-ivory text-graphite border border-graphite/10"
              }`}
              role="status"
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
