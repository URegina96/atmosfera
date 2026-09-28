import type { Metadata } from "next";
import { Suspense } from "react";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = { title: "Моё бронирование", robots: { index: false } };

export default function Page() {
  return (
    <SiteShell bookingBar={false}>
      <Suspense>
        <ManageBooking />
      </Suspense>
    </SiteShell>
  );
}
