"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { schedulerTick } from "@/lib/api";
import { subscribeToExternalChanges } from "@/lib/db";
import { ToastProvider } from "./ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, retry: false, refetchOnWindowFocus: true } } }),
  );

  useEffect(() => {
    // Any write (this tab or another) refreshes every screen — availability updates instantly.
    const off = subscribeToExternalChanges(() => client.invalidateQueries());
    schedulerTick();
    const timer = setInterval(schedulerTick, 60_000);
    return () => {
      off();
      clearInterval(timer);
    };
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
