import type { Metadata } from "next";
import { AccountPage } from "@/components/site/AccountPage";

export const metadata: Metadata = { title: "Мои бронирования", robots: { index: false } };

export default function Page() {
  return <AccountPage />;
}
