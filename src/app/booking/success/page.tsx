import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingSuccess } from "@/components/booking/BookingSuccess";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = { title: "Заявка отправлена", robots: { index: false } };

export default function Page() {
  return (
    <SiteShell bookingBar={false}>
      <Suspense>
        <BookingSuccess />
      </Suspense>
    </SiteShell>
  );
}
