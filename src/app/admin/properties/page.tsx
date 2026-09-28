"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminTitle } from "@/components/admin/AdminShell";
import { Picture } from "@/components/Picture";
import { coverOf } from "@/components/site/PropertyCard";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { adminApi } from "@/lib/api";
import { guestsLabel } from "@/lib/dates";

export default function AdminProperties() {
  const { data = [] } = useQuery({ queryKey: ["admin", "properties"], queryFn: adminApi.properties });
  return (
    <div className="mx-auto max-w-5xl">
      <AdminTitle title="Дома" subtitle="Описание, удобства, фотографии и видимость на сайте">
        <ButtonLink href="/admin/properties/edit"><Icon name="plus" className="h-4 w-4" /> Добавить дом</ButtonLink>
      </AdminTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((p) => {
          const c = coverOf(p);
          return (
            <Link key={p.id} href={`/admin/properties/edit?id=${p.id}`} className="group overflow-hidden rounded-[22px] border border-graphite/10 bg-ivory transition hover:shadow-soft">
              <div className="relative aspect-[16/9] overflow-hidden">
                <div className="h-full w-full transition duration-700 group-hover:scale-105"><Picture src={c?.src} alt={c?.alt ?? p.name} /></div>
                {!p.isActive && <span className="absolute left-3 top-3 rounded-full bg-ivory/90 px-3 py-1 text-[12px]">Скрыт с сайта</span>}
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <div className="font-serif text-[26px] leading-none">{p.name}</div>
                  <div className="mt-2 text-[13px] text-taupe">{guestsLabel(p.capacity)} · {p.area} м² · {p.images.length} фото</div>
                </div>
                <Icon name="chevronRight" className="h-5 w-5 text-taupe" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
