import type { Metadata } from "next";
import { PropertiesList } from "@/components/site/PropertiesList";

export const metadata: Metadata = { title: "Домики", description: "Два дома с чанами недалеко от Уфы: фото, удобства и свободные даты." };

export default function Page() {
  return <PropertiesList />;
}
