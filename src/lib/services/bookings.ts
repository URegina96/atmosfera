import { uid } from "../db";
import { nightsBetween } from "../dates";
import type { AuditAction, Booking, BookingSource, BookingStatus, Client, DB, ID, ISODate, PublicBooking } from "../types";
import { assertAvailable, validateStayDates } from "./availability";
import { ApiError, badRequest, notFound } from "./errors";
import { notify } from "./notifications";

/**
 * BookingService — the only place with booking business logic. The website, the Telegram bot
 * and the admin panel all call these functions; none of them re-implements the rules.
 */

export interface CreateBookingInput {
  propertyId: ID;
  checkIn: ISODate;
  checkOut: ISODate;
  guestsCount: number;
  name: string;
  phone: string;
  telegramUsername?: string;
  comment?: string;
  idempotencyKey?: string;
}

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("8") || digits.startsWith("7"))) return `+7${digits.slice(1)}`;
  if (digits.length === 10) return `+7${digits}`;
  return `+${digits}`;
};

const normalizeTelegram = (raw?: string) => raw?.trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "") || undefined;

function audit(db: DB, action: AuditAction, entityId: ID | undefined, details: string, actor = "admin") {
  db.audit.unshift({ id: uid("aud"), action, entityId, details, actor, at: new Date().toISOString() });
}
export { audit as writeAudit };

function findOrCreateClient(db: DB, name: string, phone: string, telegramUsername?: string): Client {
  const normalized = normalizePhone(phone);
  let client = db.clients.find((c) => c.phone === normalized);
  if (!client) {
    client = { id: uid("cl"), name: name.trim(), phone: normalized, createdAt: new Date().toISOString() };
    db.clients.push(client);
  }
  if (telegramUsername) client.telegramUsername = normalizeTelegram(telegramUsername);
  return client;
}

function nextCode(db: DB) {
  const max = db.bookings.reduce((m, b) => Math.max(m, Number(b.code.split("-")[1]) || 0), 1000);
  return `ATM-${max + 1}`;
}

export function getBooking(db: DB, id: ID) {
  const b = db.bookings.find((x) => x.id === id);
  if (!b) throw notFound("Бронирование");
  return b;
}

function transition(b: Booking, to: BookingStatus) {
  if (!TRANSITIONS[b.status].includes(to)) {
    throw new ApiError(409, "INVALID_STATUS_TRANSITION", `Нельзя перевести бронь из ${b.status} в ${to}`);
  }
  b.status = to;
  b.updatedAt = new Date().toISOString();
}

export function createBooking(db: DB, input: CreateBookingInput, source: BookingSource): Booking {
  // Idempotency: a retried request with the same key returns the original booking.
  if (input.idempotencyKey) {
    const existing = db.bookings.find((b) => b.idempotencyKey === input.idempotencyKey);
    if (existing) return existing;
  }
  const property = db.properties.find((p) => p.id === input.propertyId);
  if (!property) throw notFound("Дом");
  if (!property.isActive && source !== "ADMIN") throw new ApiError(409, "PROPERTY_INACTIVE", "Дом временно недоступен");

  const errors: string[] = [];
  if (input.name.trim().length < 2) errors.push("name: укажите имя");
  if (normalizePhone(input.phone).replace(/\D/g, "").length < 11) errors.push("phone: неверный номер");
  if (errors.length) throw badRequest("VALIDATION_ERROR", "Проверьте данные формы", errors);
  if (input.guestsCount < 1 || input.guestsCount > property.capacity) {
    throw badRequest("CAPACITY_EXCEEDED", `Дом рассчитан максимум на ${property.capacity} гостей`);
  }
  if (source !== "ADMIN") validateStayDates(input.checkIn, input.checkOut, db.settings.minNights);
  else if (input.checkOut <= input.checkIn) throw badRequest("INVALID_DATES", "Дата выезда должна быть позже даты заезда");

  // Re-check inside the transaction right before writing.
  assertAvailable(db, property.id, input.checkIn, input.checkOut);

  const client = findOrCreateClient(db, input.name, input.phone, input.telegramUsername);
  const now = new Date().toISOString();
  const booking: Booking = {
    id: uid("bk"),
    code: nextCode(db),
    token: uid("tk") + Math.random().toString(36).slice(2, 10),
    propertyId: property.id,
    clientId: client.id,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guestsCount: input.guestsCount,
    status: "PENDING",
    paymentStatus: "PENDING",
    source,
    comment: input.comment?.trim() || undefined,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };
  db.bookings.push(booking);
  notify(db, "NEW_BOOKING", booking);
  if (source === "ADMIN") audit(db, "ADMIN_CREATED_BOOKING", booking.id, `${booking.code}, ${property.name}, ${input.checkIn} → ${input.checkOut}`);
  return booking;
}

export function confirmBooking(db: DB, id: ID, actor = "admin") {
  const b = getBooking(db, id);
  transition(b, "CONFIRMED");
  b.confirmedAt = b.updatedAt;
  audit(db, "ADMIN_CONFIRMED_BOOKING", b.id, b.code, actor);
  notify(db, "BOOKING_CONFIRMED", b);
  return b;
}

export function cancelBooking(db: DB, id: ID, by: "CLIENT" | "ADMIN", actor = "admin") {
  const b = getBooking(db, id);
  transition(b, "CANCELLED");
  b.cancelledAt = b.updatedAt;
  b.cancelledBy = by;
  b.rescheduleRequest = undefined;
  if (b.paymentStatus === "PENDING") b.paymentStatus = "NOT_REQUIRED";
  if (by === "ADMIN") audit(db, "ADMIN_CANCELLED_BOOKING", b.id, b.code, actor);
  notify(db, "BOOKING_CANCELLED", b);
  return b;
}

export function completeBooking(db: DB, id: ID) {
  const b = getBooking(db, id);
  transition(b, "COMPLETED");
  audit(db, "ADMIN_COMPLETED_BOOKING", b.id, b.code);
  return b;
}

export function markNoShow(db: DB, id: ID) {
  const b = getBooking(db, id);
  transition(b, "NO_SHOW");
  audit(db, "ADMIN_MARKED_NO_SHOW", b.id, b.code);
  return b;
}

/** Old nights are released and new ones reserved atomically; on conflict nothing changes. */
export function rescheduleBooking(db: DB, id: ID, checkIn: ISODate, checkOut: ISODate) {
  const b = getBooking(db, id);
  if (!["PENDING", "CONFIRMED"].includes(b.status)) {
    throw new ApiError(409, "INVALID_STATUS_TRANSITION", "Перенести можно только активную бронь");
  }
  if (checkOut <= checkIn) throw badRequest("INVALID_DATES", "Дата выезда должна быть позже даты заезда");
  assertAvailable(db, b.propertyId, checkIn, checkOut, b.id);
  const old = `${b.checkIn} → ${b.checkOut}`;
  b.checkIn = checkIn;
  b.checkOut = checkOut;
  b.rescheduleRequest = undefined;
  b.updatedAt = new Date().toISOString();
  audit(db, "ADMIN_RESCHEDULED_BOOKING", b.id, `${b.code}: ${old} ⇒ ${checkIn} → ${checkOut}`);
  notify(db, "BOOKING_RESCHEDULED", b);
  return b;
}

export function requestReschedule(db: DB, id: ID, checkIn: ISODate, checkOut: ISODate) {
  const b = getBooking(db, id);
  if (!["PENDING", "CONFIRMED"].includes(b.status)) {
    throw new ApiError(409, "INVALID_STATUS_TRANSITION", "Перенос недоступен для этой брони");
  }
  validateStayDates(checkIn, checkOut, db.settings.minNights);
  assertAvailable(db, b.propertyId, checkIn, checkOut, b.id);
  b.rescheduleRequest = { checkIn, checkOut, requestedAt: new Date().toISOString() };
  b.updatedAt = b.rescheduleRequest.requestedAt;
  notify(db, "RESCHEDULE_REQUESTED", b);
  return b;
}

export function toPublicBooking(db: DB, b: Booking): PublicBooking {
  const property = db.properties.find((p) => p.id === b.propertyId);
  const client = db.clients.find((c) => c.id === b.clientId);
  return {
    code: b.code,
    token: b.token,
    propertyId: b.propertyId,
    propertyName: property?.name ?? "",
    propertySlug: property?.slug ?? "",
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: nightsBetween(b.checkIn, b.checkOut),
    guestsCount: b.guestsCount,
    status: b.status,
    paymentStatus: b.paymentStatus,
    comment: b.comment,
    clientName: client?.name ?? "",
    telegramLinked: !!client?.telegram,
    rescheduleRequest: b.rescheduleRequest,
    createdAt: b.createdAt,
  };
}
