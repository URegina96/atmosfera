import clsx from "clsx";
import type { BookingStatus, PaymentStatus } from "@/lib/types";

export const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  PENDING: { label: "Ожидает", cls: "bg-[#f1e4cc] text-[#7a5a2c]", dot: "bg-[#c99a4e]" },
  CONFIRMED: { label: "Подтверждена", cls: "bg-[#e3e6da] text-[#4a5640]", dot: "bg-[#7d8b6a]" },
  CANCELLED: { label: "Отменена", cls: "bg-[#efe1dc] text-[#8a4a3a]", dot: "bg-[#b0705f]" },
  COMPLETED: { label: "Завершена", cls: "bg-linen text-umber", dot: "bg-taupe" },
  NO_SHOW: { label: "Не заехал", cls: "bg-[#e7e4e1] text-[#5c5854]", dot: "bg-mist" },
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "Не требуется",
  PENDING: "Ожидается предоплата",
  PARTIALLY_PAID: "Предоплата внесена",
  PAID: "Оплачено полностью",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", m.cls, className)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center rounded-full border border-graphite/10 px-2.5 py-1 text-[12px] text-umber", className)}>{children}</span>;
}
