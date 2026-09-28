"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import type { Property, PropertyImage } from "@/lib/types";
import { Picture } from "../Picture";
import { SCENES } from "../render/scenes";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { AdminTitle, Panel } from "./AdminShell";

type Draft = Omit<Property, "createdAt" | "updatedAt" | "sortOrder">;

/** Downscale uploads to 1600px JPEG so they stay light (the backend version stores them via FileStorageService). */
async function optimizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/№/g, "").replace(/[а-яё]/g, (ch) => ({ а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" })[ch] ?? "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function PropertyEditor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: existing } = useQuery({ queryKey: ["admin", "property", id], queryFn: () => adminApi.property(id!), enabled: !!id });
  const { data: amenities = [] } = useQuery({ queryKey: ["admin", "amenities"], queryFn: adminApi.amenities });
  const [d, setD] = useState<Draft | null>(null);

  useEffect(() => {
    if (id && existing) setD(existing);
    if (!id)
      setD({ id: adminApi.newPropertyId(), name: "", slug: "", tagline: "", description: "", capacity: 4, bedrooms: 1, bathrooms: 1, area: 50, amenityIds: [], images: [{ id: adminApi.newImageId(), src: "render:a-dusk", alt: "Дом", isCover: true }], isActive: false });
  }, [id, existing]);

  const save = useMutation({
    mutationFn: () => adminApi.saveProperty(d!),
    onSuccess: () => {
      toast("Дом сохранён", "success");
      qc.invalidateQueries();
      if (!id) router.replace(`/admin/properties/edit?id=${d!.id}`);
    },
    onError: (e) => toast((e as Error).message, "error"),
  });

  if (!d) return <div className="h-96 animate-pulse rounded-3xl bg-linen" />;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD({ ...d, [k]: v });
  const setImages = (images: PropertyImage[]) => set("images", images.some((i) => i.isCover) || !images.length ? images : images.map((i, n) => ({ ...i, isCover: n === 0 })));
  const move = (i: number, dir: -1 | 1) => {
    const arr = [...d.images];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setImages(arr);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const added: PropertyImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      added.push({ id: adminApi.newImageId(), src: await optimizeImage(f), alt: `${d.name || "Дом"} — фото`, isCover: false });
    }
    setImages([...d.images, ...added]);
    toast(`Добавлено фото: ${added.length}. Не забудьте сохранить.`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/properties" className="mb-4 flex w-fit items-center gap-2 text-[13px] text-taupe hover:text-graphite"><Icon name="arrowLeft" className="h-4 w-4" /> Все дома</Link>
      <AdminTitle title={id ? d.name || "Дом" : "Новый дом"}>
        {id && d.isActive && <Button variant="ghost" onClick={() => window.open(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/properties/${d.slug}`, "_blank")}>Открыть на сайте</Button>}
        <Button size="lg" onClick={() => save.mutate()} loading={save.isPending} disabled={!d.name || !d.slug}>Сохранить</Button>
      </AdminTitle>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Основное">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Название" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value, slug: id ? d.slug : slugify(e.target.value) })} />
              <Input label="Адрес страницы (slug)" value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} hint={`/properties/${d.slug || "…"}`} />
            </div>
            <Input label="Подзаголовок" value={d.tagline} onChange={(e) => set("tagline", e.target.value)} />
            <Textarea label="Описание" value={d.description} onChange={(e) => set("description", e.target.value)} className="min-h-[160px]" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Input label="Гостей" type="number" min={1} value={d.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
              <Input label="Спален" type="number" min={0} value={d.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} />
              <Input label="Санузлов" type="number" min={0} value={d.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} />
              <Input label="Площадь, м²" type="number" min={1} value={d.area} onChange={(e) => set("area", Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 text-[14px]">
              <input type="checkbox" checked={d.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-5 w-5 accent-graphite" />
              Показывать на сайте и принимать бронирования
            </label>
          </div>
        </Panel>
        <Panel title="Удобства">
          <div className="grid grid-cols-1 gap-2">
            {amenities.map((a) => {
              const on = d.amenityIds.includes(a.id);
              return (
                <label key={a.id} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-[14px] transition", on ? "border-graphite/40 bg-white" : "border-graphite/10")}>
                  <input type="checkbox" checked={on} onChange={() => set("amenityIds", on ? d.amenityIds.filter((x) => x !== a.id) : [...d.amenityIds, a.id])} className="accent-graphite" />
                  <Icon name={a.icon} className="h-4 w-4 text-clay" /> {a.name}
                </label>
              );
            })}
            <Link href="/admin/settings#amenities" className="mt-2 text-[12px] text-taupe underline underline-offset-4">Редактировать список удобств</Link>
          </div>
        </Panel>
        <Panel title={`Фотографии · ${d.images.length}`} className="lg:col-span-2" action={<Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}><Icon name="image" className="h-4 w-4" /> Загрузить</Button>}>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {d.images.map((img, i) => (
              <div key={img.id} className={clsx("overflow-hidden rounded-2xl border bg-white", img.isCover ? "border-graphite ring-2 ring-graphite/20" : "border-graphite/10")}>
                <div className="relative aspect-[4/3]">
                  <Picture src={img.src} alt={img.alt} />
                  {img.isCover && <span className="absolute left-2 top-2 rounded-full bg-graphite px-2 py-0.5 text-[11px] text-ivory">Главное</span>}
                </div>
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <button onClick={() => move(i, -1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-linen" aria-label="Левее"><Icon name="chevronLeft" className="h-4 w-4" /></button>
                  <button onClick={() => move(i, 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-linen" aria-label="Правее"><Icon name="chevronRight" className="h-4 w-4" /></button>
                  <button onClick={() => setImages(d.images.map((x) => ({ ...x, isCover: x.id === img.id })))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-linen" aria-label="Сделать главным"><Icon name="star" className="h-4 w-4" /></button>
                  <button onClick={() => setImages(d.images.filter((x) => x.id !== img.id))} className="grid h-8 w-8 place-items-center rounded-full text-[#8a4a3a] hover:bg-linen" aria-label="Удалить"><Icon name="trash" className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <details className="mt-4 text-[13px] text-taupe">
            <summary className="cursor-pointer">Добавить встроенную визуализацию</summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {SCENES.map((s) => (
                <button key={s} onClick={() => setImages([...d.images, { id: adminApi.newImageId(), src: `render:${s}`, alt: d.name || "Дом", isCover: false }])} className="h-16 w-24 overflow-hidden rounded-lg border border-graphite/10"><Picture src={`render:${s}`} alt={s} /></button>
              ))}
            </div>
          </details>
        </Panel>
      </div>
    </div>
  );
}
