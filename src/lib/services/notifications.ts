import { uid } from "../db";
import { fmtRange, guestsLabel, nightsBetween, nightsLabel } from "../dates";
import type { Booking, DB, NotificationEvent, NotificationRecord } from "../types";

/**
 * NotificationService. Builds Telegram messages for the client and the admin chat and stores
 * them in the outbox. Each message has a dedupe key, so replaying an event never produces a
 * second delivery. While the bot token is not configured, messages stay in status READY and
 * are shown in the admin panel as a preview.
 */

const STATUS_LINE: Record<Booking["status"], string> = {
  PENDING: "⏳ Ожидает подтверждения",
  CONFIRMED: "✅ Подтверждено",
  CANCELLED: "❌ Отменено",
  COMPLETED: "🏁 Завершено",
  NO_SHOW: "🚫 Гость не приехал",
};

function context(db: DB, booking: Booking) {
  const property = db.properties.find((p) => p.id === booking.propertyId);
  const client = db.clients.find((c) => c.id === booking.clientId);
  return {
    house: property?.name ?? "Дом",
    client,
    dates: fmtRange(booking.checkIn, booking.checkOut),
    nights: nightsLabel(nightsBetween(booking.checkIn, booking.checkOut)),
    guests: guestsLabel(booking.guestsCount),
  };
}

function adminText(db: DB, event: NotificationEvent, booking: Booking): string {
  const c = context(db, booking);
  const who = c.client ? `👤 ${c.client.name}\n📞 ${c.client.phone}` : "";
  const head: Record<NotificationEvent, string> = {
    NEW_BOOKING: "🔔 НОВАЯ ЗАЯВКА",
    BOOKING_CONFIRMED: "✅ БРОНЬ ПОДТВЕРЖДЕНА",
    BOOKING_CANCELLED: booking.cancelledBy === "CLIENT" ? "❌ КЛИЕНТ ОТМЕНИЛ БРОНЬ" : "❌ БРОНЬ ОТМЕНЕНА",
    BOOKING_RESCHEDULED: "🔄 БРОНЬ ПЕРЕНЕСЕНА",
    RESCHEDULE_REQUESTED: "🔄 ЗАПРОС НА ПЕРЕНОС",
    BOOKING_REMINDER: "⏰ ЗАВТРА ЗАЕЗД",
  };
  let body = `${head[event]}\n\n🏡 ${c.house}\n\n📅 ${c.dates}\n\n🌙 ${c.nights}\n\n${who}\n\n👥 ${c.guests}`;
  if (event === "RESCHEDULE_REQUESTED" && booking.rescheduleRequest) {
    body += `\n\n➡️ Новые даты: ${fmtRange(booking.rescheduleRequest.checkIn, booking.rescheduleRequest.checkOut)}`;
  }
  if (booking.comment) body += `\n\n💬 Комментарий:\n${booking.comment}`;
  body += `\n\nСтатус:\n${STATUS_LINE[booking.status]}`;
  return body;
}

function clientText(db: DB, event: NotificationEvent, booking: Booking, soon = false): string | null {
  const c = context(db, booking);
  switch (event) {
    case "NEW_BOOKING":
      return `🏡 Заявка получена!\n\n${c.house}\n\n${c.dates}\n\n👥 ${c.guests}\n\nСтатус:\n\n⏳ Ожидает подтверждения\n\nПосле подтверждения мы сообщим вам здесь.`;
    case "BOOKING_CONFIRMED":
      return `✅ Бронирование подтверждено!\n\n🏡 ${c.house}\n\n📅 ${c.dates}\n\n👥 ${c.guests}\n\nДо встречи в «Атмосфере» 🤍`;
    case "BOOKING_CANCELLED":
      return `❌ Бронирование отменено.\n\nДом:\n${c.house}\n\nДаты:\n${c.dates}`;
    case "BOOKING_RESCHEDULED":
      return `🔄 Бронирование перенесено.\n\n🏡 ${c.house}\n\n📅 Новые даты: ${c.dates}\n\n👥 ${c.guests}`;
    case "RESCHEDULE_REQUESTED":
      return `🔄 Запрос на перенос получен.\n\nМы проверим даты и сообщим вам о решении.`;
    case "BOOKING_REMINDER":
      return `⏰ Напоминание\n\n${soon ? "Совсем скоро" : "Завтра"} ждём вас в «Атмосфере».\n\n🏡 ${c.house}\n📅 ${c.dates}\n\nЗаезд с ${db.settings.checkInTime}.`;
  }
}

function enqueue(db: DB, rec: Omit<NotificationRecord, "id" | "createdAt" | "channel">) {
  if (db.notifications.some((n) => n.dedupeKey === rec.dedupeKey)) return; // idempotent
  db.notifications.unshift({ ...rec, id: uid("ntf"), channel: "TELEGRAM", createdAt: new Date().toISOString() });
}

/** Dispatch a booking event to both recipients. `version` distinguishes repeated events of the same kind (e.g. two reschedules). */
export function notify(db: DB, event: NotificationEvent, booking: Booking, version = booking.updatedAt, soon = false) {
  const base = `${event}:${booking.id}:${version}`;
  enqueue(db, {
    event,
    recipient: "ADMIN",
    bookingId: booking.id,
    text: adminText(db, event, booking),
    buttons: event === "NEW_BOOKING" ? [{ label: "✅ Подтвердить", action: "CONFIRM" }, { label: "❌ Отклонить", action: "REJECT" }] : undefined,
    status: "READY",
    dedupeKey: `ADMIN:${base}`,
  });

  const text = clientText(db, event, booking, soon);
  if (!text) return;
  const client = db.clients.find((c) => c.id === booking.clientId);
  const linked = !!client?.telegram;
  enqueue(db, {
    event,
    recipient: "CLIENT",
    bookingId: booking.id,
    text,
    status: linked ? "READY" : "SKIPPED",
    reason: linked ? undefined : "Клиент ещё не привязал Telegram",
    dedupeKey: `CLIENT:${base}`,
  });
}

/**
 * Reminder scheduler: 24h (and optionally 3h) before check-in. Keys are per booking and per
 * check-in date, so the reminder is sent once and again only if the stay is rescheduled.
 */
export function runReminders(db: DB, now = new Date()): number {
  let created = 0;
  const [h, m] = db.settings.checkInTime.split(":").map(Number);
  for (const b of db.bookings) {
    if (b.status !== "CONFIRMED") continue;
    const checkInAt = new Date(`${b.checkIn}T00:00:00`);
    checkInAt.setHours(h, m);
    const hoursLeft = (checkInAt.getTime() - now.getTime()) / 36e5;
    const windows: [string, number][] = [["24H", 24]];
    if (db.settings.reminder3h) windows.push(["3H", 3]);
    for (const [label, hrs] of windows) {
      if (hoursLeft > 0 && hoursLeft <= hrs) {
        const before = db.notifications.length;
        notify(db, "BOOKING_REMINDER", b, `${label}:${b.checkIn}`, label === "3H");
        created += db.notifications.length - before;
      }
    }
  }
  return created;
}
