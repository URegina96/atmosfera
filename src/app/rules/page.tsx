import type { Metadata } from "next";
import { RulesPage } from "@/components/site/RulesPage";

export const metadata: Metadata = { title: "Правила проживания", description: "Правила заезда, выезда и проживания в загородном доме «Атмосфера»." };

export default function Page() {
  return <RulesPage />;
}
