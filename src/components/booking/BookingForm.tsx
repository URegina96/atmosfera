"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { publicApi } from "@/lib/api";
import { fmtDay, guestsLabel, nightsBetween, nightsLabel, plural } from "@/lib/dates";
import { ApiError } from "@/lib/services/errors";
import { Picture } from "../Picture";
import { coverOf } from "../site/PropertyCard";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

const schema = z.object({
  propertyId: z.string().min(1, "Выберите дом"),
  checkIn: z.string().min(1, "Выберите дату заезда"),
  checkOut: z.string().min(1, "Выберите дату выезда"),
  guestsCount: z.number().int().min(1),
  name: z.string().trim().min(2, "Укажите имя"),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 12, "Укажите телефон, например +7 900 000-00-00"),
  telegramUsername: z
    .string()
    .trim()
    .refine((v) => v === "" || /^@?[a-zA-Z0-9_]{4,32}$/.test(v), "Ник в Telegram: латиница, цифры и _, например @anna")
    .optional(),
  comment: z.string().max(500, "Не более 500 символов").optional(),
});
type FormValues = z.infer<typeof schema>;

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

export function BookingForm() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const idempotencyKey = useRef(newKey());
  const { data: properties = [] } = useQuery({ queryKey: ["properties"], queryFn: publicApi.properties });

  const { register, handleSubmit, watch, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: params.get("property") ?? "",
      checkIn: params.get("checkIn") ?? "",
      checkOut: params.get("checkOut") ?? "",
      guestsCount: 2,
      name: "",
      phone: "",
      telegramUsername: "",
      comment: "",
    },
  });
  const v = watch();
  const property = properties.find((p) => p.id === v.propertyId);

  useEffect(() => {
    if (!v.propertyId && properties[0]) setValue("propertyId", properties[0].id);
    const slug = params.get("slug");
    if (slug) {
      const p = properties.find((x) => x.slug === slug);
      if (p && !v.propertyId) setValue("propertyId", p.id);
    }
  }, [properties, params, setValue, v.propertyId]);

  useEffect(() => {
    if (property && v.guestsCount > property.capacity) setValue("guestsCount", property.capacity);
  }, [property, v.guestsCount, setValue]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => publicApi.createBooking({ ...values, idempotencyKey: idempotencyKey.current }),
    onSuccess: (b) => {
      idempotencyKey.current = newKey();
      router.push(`/booking/success?token=${b.token}`);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "BOOKING_CONFLICT") {
        toast("Эти даты только что заняли. Пожалуйста, выберите другие.", "error");
        setValue("checkIn", "");
        setValue("checkOut", "");
        qc.invalidateQueries({ queryKey: ["availability"] });
      } else toast(e instanceof Error ? e.message : "Не удалось отправить заявку", "error");
    },
  });

  const nights = v.checkIn && v.checkOut ? nightsBetween(v.checkIn, v.checkOut) : 0;
  const e = formState.errors;
  const cover = property ? coverOf(property) : undefined;

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
      <div className="space-y-14">
        <Step n="01" title="Дом" error={e.propertyId?.message}>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Выберите дом">
            {properties.map((p) => {
              const active = p.id === v.propertyId;
              const c = coverOf(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setValue("propertyId", p.id, { shouldValidate: true });
                    setValue("checkIn", "");
                    setValue("checkOut", "");
                  }}
                  className={clsx("flex items-center gap-4 rounded-2xl border p-3 text-left transition", active ? "border-graphite bg-white shadow-soft" : "border-graphite/10 bg-white/50 hover:border-graphite/30")}
                >
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                    <Picture src={c?.src} alt={c?.alt ?? p.name} />
                  </div>
                  <div>
                    <div className="font-serif text-[22px] leading-none">{p.name}</div>
                    <div className="mt-1.5 text-[12px] text-taupe">до {p.capacity} {plural(p.capacity, "гостя", "гостей", "гостей")} · {p.area} м²</div>
                  </div>
                  <span className={clsx("ml-auto grid h-6 w-6 place-items-center rounded-full border", active ? "border-graphite bg-graphite text-ivory" : "border-graphite/20")}>
                    {active && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step n="02" title="Даты" error={e.checkIn?.message ?? e.checkOut?.message}>
          <div className="rounded-[24px] border border-graphite/10 bg-white/60 p-4 sm:p-6">
            {v.propertyId && (
              <AvailabilityCalendar
                propertyId={v.propertyId}
                value={{ checkIn: v.checkIn || undefined, checkOut: v.checkOut || undefined }}
                onChange={(r) => {
                  setValue("checkIn", r.checkIn ?? "", { shouldValidate: !!r.checkIn });
                  setValue("checkOut", r.checkOut ?? "", { shouldValidate: !!r.checkOut });
                }}
              />
            )}
          </div>
          <p className="mt-3 text-[13px] text-taupe">День выезда остаётся свободным для следующих гостей — в него можно заехать.</p>
        </Step>

        <Step n="03" title="Гости">
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setValue("guestsCount", Math.max(1, v.guestsCount - 1))} className="grid h-12 w-12 place-items-center rounded-full border border-graphite/15 text-xl hover:border-graphite/40" aria-label="Меньше гостей">−</button>
            <span className="min-w-[110px] text-center font-serif text-[28px]" aria-live="polite">{guestsLabel(v.guestsCount)}</span>
            <button type="button" onClick={() => setValue("guestsCount", Math.min(property?.capacity ?? 10, v.guestsCount + 1))} className="grid h-12 w-12 place-items-center rounded-full border border-graphite/15 text-xl hover:border-graphite/40 disabled:opacity-30" disabled={!!property && v.guestsCount >= property.capacity} aria-label="Больше гостей">+</button>
            {property && <span className="text-[13px] text-taupe">максимум {property.capacity}</span>}
          </div>
        </Step>

        <Step n="04" title="Контакты">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Имя" autoComplete="name" placeholder="Анна" {...register("name")} error={e.name?.message} />
            <Input label="Телефон" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 900 000-00-00" {...register("phone")} error={e.phone?.message} />
            <Input label="Telegram" placeholder="@username" autoCapitalize="none" {...register("telegramUsername")} error={e.telegramUsername?.message} hint="Пришлём подтверждение в Telegram" />
            <div className="sm:col-span-2">
              <Textarea label="Комментарий" placeholder="Например: приедем с детьми" {...register("comment")} error={e.comment?.message} />
            </div>
          </div>
        </Step>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-[28px] border border-graphite/10 bg-white/70 shadow-soft">
          <div className="aspect-[16/9]">{cover && <Picture src={cover.src} alt={cover.alt} />}</div>
          <div className="p-6 sm:p-8">
            <p className="eyebrow">Ваша заявка</p>
            <h2 className="mt-3 font-serif text-[32px] leading-none">{property?.name ?? "Выберите дом"}</h2>
            <dl className="mt-6 space-y-3 border-t border-graphite/10 pt-6 text-[14px]">
              <Row label="Заезд" value={v.checkIn ? fmtDay(v.checkIn) : "—"} />
              <Row label="Выезд" value={v.checkOut ? fmtDay(v.checkOut) : "—"} />
              <Row label="Ночей" value={nights ? nightsLabel(nights) : "—"} />
              <Row label="Гости" value={guestsLabel(v.guestsCount)} />
            </dl>
            <div className="mt-6 space-y-2 rounded-2xl bg-linen/70 p-4 text-[13px] leading-relaxed text-umber">
              <p>Стоимость рассчитывается в зависимости от выбранных дат и уточняется при подтверждении.</p>
              <p>Предоплата — после подтверждения бронирования. Оплата оставшейся суммы — при встрече.</p>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full" loading={mutation.isPending}>
              Отправить заявку
            </Button>
            <p className="mt-3 text-center text-[12px] text-taupe">Нажимая кнопку, вы соглашаетесь с обработкой контактных данных для связи по брони.</p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Step({ n, title, error, children }: { n: string; title: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-6 flex items-baseline gap-4">
        <span className="font-serif text-[18px] text-taupe">{n}</span>
        <span className="font-serif text-[32px] leading-none">{title}</span>
      </legend>
      {children}
      {error && <p className="mt-3 text-[13px] text-[#9a5543]" role="alert">{error}</p>}
    </fieldset>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-taupe">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
