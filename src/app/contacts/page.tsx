import type { Metadata } from "next";
import { ContactsPage } from "@/components/site/ContactsPage";

export const metadata: Metadata = { title: "Контакты", description: "Как связаться и как добраться до загородного дома «Атмосфера» под Уфой." };

export default function Page() {
  return <ContactsPage />;
}
