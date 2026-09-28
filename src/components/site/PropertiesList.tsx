"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { PageIntro } from "./PageIntro";
import { PropertyCard } from "./PropertyCard";
import { SiteShell } from "./SiteShell";

export function PropertiesList() {
  const { data: properties = [], isLoading } = useQuery({ queryKey: ["properties"], queryFn: publicApi.properties });
  return (
    <SiteShell>
      <PageIntro eyebrow="Домики" title={<>Два дома.<br />Один формат отдыха.</>} text="Отдельные дома с террасой и чаном. Выберите дом, чтобы посмотреть фото, удобства и свободные даты." />
      <div className="container-x grid gap-16 pb-24 md:grid-cols-2 md:gap-10 md:pb-36 lg:gap-16">
        {isLoading && [0, 1].map((i) => <div key={i} className="aspect-[5/4] animate-pulse rounded-[28px] bg-linen" />)}
        {properties.map((p, i) => (
          <PropertyCard key={p.id} property={p} index={i} />
        ))}
      </div>
    </SiteShell>
  );
}
