import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/booking/BookingForm";
import { PageIntro } from "@/components/site/PageIntro";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = { title: "Бронирование", description: "Выберите дом и даты — заявка за минуту, подтверждение в Telegram." };

export default function Page() {
  return (
    <SiteShell bookingBar={false}>
      <PageIntro eyebrow="Бронирование" title="Заявка на отдых" text="Выберите дом и даты. Мы проверим заявку и подтвердим её — уведомление придёт в Telegram." />
      <div className="container-x pb-24 md:pb-32">
        <Suspense>
          <BookingForm />
        </Suspense>
      </div>
    </SiteShell>
  );
}
