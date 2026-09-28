import { eachDayInclusive, eachNight, overlaps, shiftISO, todayISO } from "../dates";
import { ACTIVE_STATUSES, type AvailabilityDay, type DB, type ID, type ISODate } from "../types";
import { badRequest, conflict } from "./errors";

/** AvailabilityService — the single place that decides whether nights are free. */

export function occupyingBookings(db: DB, propertyId: ID, excludeBookingId?: ID) {
  return db.bookings.filter(
    (b) => b.propertyId === propertyId && ACTIVE_STATUSES.includes(b.status) && b.id !== excludeBookingId,
  );
}

export function getAvailability(db: DB, propertyId: ID, from: ISODate, to: ISODate): AvailabilityDay[] {
  const today = todayISO();
  const bookings = occupyingBookings(db, propertyId);
  const blocks = db.blockedPeriods.filter((p) => p.propertyId === propertyId);
  return eachDayInclusive(from, to).map((date) => {
    if (date < today) return { date, status: "PAST" as const };
    if (blocks.some((p) => date >= p.from && date <= p.to)) return { date, status: "BLOCKED" as const };
    if (bookings.some((b) => date >= b.checkIn && date < b.checkOut)) return { date, status: "BOOKED" as const };
    return { date, status: "AVAILABLE" as const };
  });
}

export function validateStayDates(checkIn: ISODate, checkOut: ISODate, minNights: number) {
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    throw badRequest("INVALID_DATES", "Дата выезда должна быть позже даты заезда");
  }
  if (checkIn < todayISO()) throw badRequest("INVALID_DATES", "Нельзя забронировать прошедшие даты");
  if (eachNight(checkIn, checkOut).length < minNights) {
    throw badRequest("INVALID_DATES", `Минимальный срок — ${minNights} ноч.`);
  }
}

/** Throws BOOKING_CONFLICT if any night in [checkIn, checkOut) is taken or blocked. */
export function assertAvailable(db: DB, propertyId: ID, checkIn: ISODate, checkOut: ISODate, excludeBookingId?: ID) {
  const clash = occupyingBookings(db, propertyId, excludeBookingId).some((b) =>
    overlaps(checkIn, checkOut, b.checkIn, b.checkOut),
  );
  if (clash) throw conflict();
  const blocked = db.blockedPeriods.some(
    (p) => p.propertyId === propertyId && overlaps(checkIn, checkOut, p.from, shiftISO(p.to, 1)),
  );
  if (blocked) throw conflict("Выбранные даты недоступны для бронирования");
}
