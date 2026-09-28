import { getClientSession, requireAdmin } from "./auth";
import { read, transaction, uid } from "./db";
import { nightsBetween, todayISO } from "./dates";
import { getAvailability } from "./services/availability";
import * as bookings from "./services/bookings";
import { ApiError, notFound } from "./services/errors";
import { runReminders } from "./services/notifications";
import { calculatePrice } from "./services/pricing";
import type {
  Amenity,
  BlockedPeriod,
  Booking,
  BookingStatus,
  HouseRule,
  ID,
  ISODate,
  PaymentStatus,
  PriceRule,
  Property,
  Settings,
} from "./types";

/**
 * Client-side facade shaped like the REST API (/api/v1/...). Every call is async and returns
 * DTOs, so replacing the body of each function with `fetch()` is the only change needed when
 * the Spring Boot backend is deployed.
 */
const latency = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 120));

async function call<T>(fn: () => T): Promise<T> {
  await latency();
  return fn();
}

/* ---------- public: /api/v1/properties, /availability, /bookings ---------- */

export type PublicSettings = Omit<Settings, "address"> & { address?: string };

export const publicApi = {
  properties: () =>
    call(() =>
      read()
        .properties.filter((p) => p.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    ),
  property: (slug: string) =>
    call(() => {
      const p = read().properties.find((x) => x.slug === slug && x.isActive);
      if (!p) throw notFound("Дом");
      return p;
    }),
  amenities: () => call(() => read().amenities),
  rules: () => call(() => read().rules),
  settings: () =>
    call((): PublicSettings => {
      const s = read().settings;
      // The exact address is private until the owner chooses to publish it.
      return s.showExactAddress ? s : { ...s, address: undefined };
    }),
  availability: (propertyId: ID, from: ISODate, to: ISODate) =>
    call(() => ({ propertyId, days: getAvailability(read(), propertyId, from, to) })),
  createBooking: (input: bookings.CreateBookingInput) =>
    call(() => transaction((db) => bookings.toPublicBooking(db, bookings.createBooking(db, input, "WEBSITE")))),
  bookingByToken: (token: string) =>
    call(() => {
      const db = read();
      const b = db.bookings.find((x) => x.token === token);
      if (!b) throw notFound("Бронирование");
      return bookings.toPublicBooking(db, b);
    }),
  cancelByToken: (token: string) =>
    call(() => {
      const b = read().bookings.find((x) => x.token === token);
      if (!b) throw notFound("Бронирование");
      return transaction((db) => bookings.toPublicBooking(db, bookings.cancelBooking(db, b.id, "CLIENT", "client")));
    }),
  requestReschedule: (token: string, checkIn: ISODate, checkOut: ISODate) =>
    call(() => {
      const b = read().bookings.find((x) => x.token === token);
      if (!b) throw notFound("Бронирование");
      return transaction((db) => bookings.toPublicBooking(db, bookings.requestReschedule(db, b.id, checkIn, checkOut)));
    }),
  /**
   * Stand-in for the bot's /start {bookingToken} handler: binds telegramUserId → client.
   * Available until the real bot is connected.
   */
  linkTelegramDemo: (token: string) =>
    call(() =>
      transaction((db) => {
        const b = db.bookings.find((x) => x.token === token);
        if (!b) throw notFound("Бронирование");
        const client = db.clients.find((c) => c.id === b.clientId)!;
        if (!client.telegram) {
          client.telegram = {
            telegramUserId: 100000 + Math.floor(Math.random() * 900000),
            username: client.telegramUsername,
            linkedAt: new Date().toISOString(),
          };
        }
        // Re-deliver the "request received" message that was skipped before linking.
        db.notifications
          .filter((n) => n.bookingId === b.id && n.recipient === "CLIENT" && n.status === "SKIPPED")
          .forEach((n) => {
            n.status = "READY";
            n.reason = undefined;
          });
        return bookings.toPublicBooking(db, b);
      }),
    ),
};

/* ---------- client cabinet ---------- */

export const clientApi = {
  myBookings: () =>
    call(() => {
      const session = getClientSession();
      if (!session) throw new ApiError(401, "UNAUTHORIZED", "Войдите в личный кабинет");
      const db = read();
      // Ownership is enforced here: only this client's bookings are returned.
      return db.bookings
        .filter((b) => b.clientId === session.clientId)
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
        .map((b) => bookings.toPublicBooking(db, b));
    }),
};

/* ---------- admin: /api/v1/admin/... (requires ADMIN session) ---------- */

async function admin<T>(fn: () => T): Promise<T> {
  await latency();
  requireAdmin();
  return fn();
}

export interface BookingRow extends Booking {
  propertyName: string;
  clientName: string;
  clientPhone: string;
  clientTelegram?: string;
  telegramLinked: boolean;
  nights: number;
}

function toRow(b: Booking): BookingRow {
  const db = read();
  const p = db.properties.find((x) => x.id === b.propertyId);
  const c = db.clients.find((x) => x.id === b.clientId);
  return {
    ...b,
    propertyName: p?.name ?? "—",
    clientName: c?.name ?? "—",
    clientPhone: c?.phone ?? "",
    clientTelegram: c?.telegramUsername,
    telegramLinked: !!c?.telegram,
    nights: nightsBetween(b.checkIn, b.checkOut),
  };
}

export const adminApi = {
  dashboard: () =>
    admin(() => {
      const db = read();
      const t = todayISO();
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const active = db.bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status));
      const occupied = db.bookings.filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.status));
      const weekEnd = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      const props = db.properties.filter((p) => p.isActive);
      const occupancy = props.map((p) => {
        let nights = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(Date.now() + i * 864e5).toISOString().slice(0, 10);
          if (occupied.concat(active).some((b) => b.propertyId === p.id && d >= b.checkIn && d < b.checkOut)) nights++;
        }
        return { propertyId: p.id, name: p.name, percent: Math.round((nights / 7) * 100) };
      });
      const upcoming = active.filter((b) => b.checkIn >= t).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
      const upcomingOut = active.filter((b) => b.checkOut >= t).sort((a, b) => a.checkOut.localeCompare(b.checkOut));
      return {
        checkInsToday: active.filter((b) => b.checkIn === t).map(toRow),
        checkOutsToday: db.bookings.filter((b) => b.checkOut === t && ["CONFIRMED", "COMPLETED"].includes(b.status)).map(toRow),
        guestsNow: db.bookings
          .filter((b) => b.status === "CONFIRMED" && b.checkIn <= t && b.checkOut > t)
          .reduce((s, b) => s + b.guestsCount, 0),
        pending: db.bookings.filter((b) => b.status === "PENDING").map(toRow),
        nextCheckIn: upcoming[0] ? toRow(upcoming[0]) : null,
        nextCheckOut: upcomingOut[0] ? toRow(upcomingOut[0]) : null,
        week: {
          bookings: db.bookings.filter((b) => b.createdAt >= weekAgo).length,
          cancellations: db.bookings.filter((b) => b.cancelledAt && b.cancelledAt >= weekAgo).length,
          newClients: db.clients.filter((c) => c.createdAt >= weekAgo).length,
          upcomingThisWeek: active.filter((b) => b.checkIn >= t && b.checkIn <= weekEnd).length,
        },
        occupancy,
      };
    }),

  bookings: (filter: { status?: BookingStatus | "ALL"; propertyId?: ID; q?: string } = {}) =>
    admin(() => {
      const q = filter.q?.trim().toLowerCase();
      return read()
        .bookings.map(toRow)
        .filter((b) => !filter.status || filter.status === "ALL" || b.status === filter.status)
        .filter((b) => !filter.propertyId || b.propertyId === filter.propertyId)
        .filter((b) => !q || [b.code, b.clientName, b.clientPhone, b.clientTelegram ?? ""].some((v) => v.toLowerCase().includes(q)))
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    }),
  booking: (id: ID) =>
    admin(() => {
      const db = read();
      const b = bookings.getBooking(db, id);
      return { ...toRow(b), quote: calculatePrice(db, b.propertyId, b.checkIn, b.checkOut) };
    }),
  createBooking: (input: bookings.CreateBookingInput) =>
    admin(() => toRow(transaction((db) => bookings.createBooking(db, input, "ADMIN")))),
  confirm: (id: ID) => admin(() => toRow(transaction((db) => bookings.confirmBooking(db, id)))),
  cancel: (id: ID) => admin(() => toRow(transaction((db) => bookings.cancelBooking(db, id, "ADMIN")))),
  complete: (id: ID) => admin(() => toRow(transaction((db) => bookings.completeBooking(db, id)))),
  noShow: (id: ID) => admin(() => toRow(transaction((db) => bookings.markNoShow(db, id)))),
  reschedule: (id: ID, checkIn: ISODate, checkOut: ISODate) =>
    admin(() => toRow(transaction((db) => bookings.rescheduleBooking(db, id, checkIn, checkOut)))),
  declineRescheduleRequest: (id: ID) =>
    admin(() =>
      transaction((db) => {
        const b = bookings.getBooking(db, id);
        b.rescheduleRequest = undefined;
        b.updatedAt = new Date().toISOString();
        bookings.writeAudit(db, "ADMIN_UPDATED_BOOKING", b.id, `${b.code}: запрос на перенос отклонён`);
      }),
    ),
  updateBooking: (id: ID, patch: { adminNote?: string; paymentStatus?: PaymentStatus; guestsCount?: number }) =>
    admin(() =>
      transaction((db) => {
        const b = bookings.getBooking(db, id);
        Object.assign(b, patch, { updatedAt: new Date().toISOString() });
        bookings.writeAudit(db, "ADMIN_UPDATED_BOOKING", b.id, `${b.code}: ${Object.keys(patch).join(", ")}`);
      }),
    ),
  availabilityFor: (propertyId: ID, from: ISODate, to: ISODate) => admin(() => getAvailability(read(), propertyId, from, to)),
  calendar: (from: ISODate, to: ISODate) =>
    admin(() => {
      const db = read();
      return {
        properties: [...db.properties].sort((a, b) => a.sortOrder - b.sortOrder),
        bookings: db.bookings.filter((b) => b.checkIn <= to && b.checkOut >= from).map(toRow),
        blocks: db.blockedPeriods.filter((p) => p.from <= to && p.to >= from),
      };
    }),
  quote: (propertyId: ID, checkIn: ISODate, checkOut: ISODate) => admin(() => calculatePrice(read(), propertyId, checkIn, checkOut)),

  /* properties */
  properties: () => admin(() => [...read().properties].sort((a, b) => a.sortOrder - b.sortOrder)),
  property: (id: ID) =>
    admin(() => {
      const p = read().properties.find((x) => x.id === id);
      if (!p) throw notFound("Дом");
      return p;
    }),
  saveProperty: (input: Omit<Property, "createdAt" | "updatedAt" | "sortOrder"> & { sortOrder?: number }) =>
    admin(() =>
      transaction((db) => {
        const clash = db.properties.find((p) => p.slug === input.slug && p.id !== input.id);
        if (clash) throw new ApiError(400, "VALIDATION_ERROR", "Такой адрес страницы (slug) уже используется");
        const now = new Date().toISOString();
        const existing = db.properties.find((p) => p.id === input.id);
        if (existing) Object.assign(existing, input, { updatedAt: now });
        else db.properties.push({ ...input, sortOrder: db.properties.length + 1, createdAt: now, updatedAt: now });
        bookings.writeAudit(db, "ADMIN_CHANGED_PROPERTY", input.id, `${existing ? "Изменён" : "Создан"}: ${input.name}`);
        return input.id;
      }),
    ),
  newPropertyId: () => uid("prop"),
  newImageId: () => uid("img"),

  amenities: () => admin(() => read().amenities),
  saveAmenity: (a: Amenity) =>
    admin(() =>
      transaction((db) => {
        const i = db.amenities.findIndex((x) => x.id === a.id);
        if (i >= 0) db.amenities[i] = a;
        else db.amenities.push(a);
      }),
    ),
  deleteAmenity: (id: ID) =>
    admin(() =>
      transaction((db) => {
        db.amenities = db.amenities.filter((a) => a.id !== id);
        db.properties.forEach((p) => (p.amenityIds = p.amenityIds.filter((x) => x !== id)));
      }),
    ),
  newAmenityId: () => uid("am"),

  /* clients */
  clients: (q?: string) =>
    admin(() => {
      const db = read();
      const s = q?.trim().toLowerCase();
      return db.clients
        .filter((c) => !s || [c.name, c.phone, c.telegramUsername ?? ""].some((v) => v.toLowerCase().includes(s)))
        .map((c) => ({ ...c, bookingsCount: db.bookings.filter((b) => b.clientId === c.id).length }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }),
  client: (id: ID) =>
    admin(() => {
      const db = read();
      const c = db.clients.find((x) => x.id === id);
      if (!c) throw notFound("Клиент");
      return { ...c, history: db.bookings.filter((b) => b.clientId === id).map(toRow).sort((a, b) => b.checkIn.localeCompare(a.checkIn)) };
    }),
  updateClientNote: (id: ID, privateNote: string) =>
    admin(() => transaction((db) => void (db.clients.find((c) => c.id === id)!.privateNote = privateNote || undefined))),

  /* prices */
  priceRules: (propertyId: ID) => admin(() => read().priceRules.filter((r) => r.propertyId === propertyId)),
  savePriceRule: (rule: PriceRule) =>
    admin(() =>
      transaction((db) => {
        const i = db.priceRules.findIndex((r) => r.id === rule.id);
        if (i >= 0) db.priceRules[i] = rule;
        else db.priceRules.push(rule);
        bookings.writeAudit(db, "ADMIN_CHANGED_PRICE", rule.propertyId, `${rule.kind}: ${rule.amount} ₽${rule.from ? ` (${rule.from} – ${rule.to})` : ""}`);
      }),
    ),
  deletePriceRule: (id: ID) =>
    admin(() =>
      transaction((db) => {
        const r = db.priceRules.find((x) => x.id === id);
        db.priceRules = db.priceRules.filter((x) => x.id !== id);
        if (r) bookings.writeAudit(db, "ADMIN_CHANGED_PRICE", r.propertyId, `Удалено правило ${r.kind}`);
      }),
    ),
  newPriceRuleId: () => uid("pr"),

  /* blocked dates */
  blocks: () => admin(() => [...read().blockedPeriods].sort((a, b) => a.from.localeCompare(b.from))),
  createBlock: (input: Omit<BlockedPeriod, "id" | "createdAt">) =>
    admin(() =>
      transaction((db) => {
        if (input.to < input.from) throw new ApiError(400, "INVALID_DATES", "Дата окончания раньше даты начала");
        const clash = db.bookings.find(
          (b) => b.propertyId === input.propertyId && ["PENDING", "CONFIRMED"].includes(b.status) && b.checkIn <= input.to && b.checkOut > input.from,
        );
        if (clash) throw new ApiError(409, "BOOKING_CONFLICT", `На эти даты есть бронь ${clash.code}. Сначала отмените или перенесите её.`);
        const block: BlockedPeriod = { ...input, id: uid("bl"), createdAt: new Date().toISOString() };
        db.blockedPeriods.push(block);
        const p = db.properties.find((x) => x.id === input.propertyId);
        bookings.writeAudit(db, "ADMIN_BLOCKED_DATES", block.id, `${p?.name}: ${input.from} – ${input.to}`);
        return block;
      }),
    ),
  deleteBlock: (id: ID) =>
    admin(() =>
      transaction((db) => {
        const b = db.blockedPeriods.find((x) => x.id === id);
        db.blockedPeriods = db.blockedPeriods.filter((x) => x.id !== id);
        if (b) bookings.writeAudit(db, "ADMIN_UNBLOCKED_DATES", id, `${b.from} – ${b.to}`);
      }),
    ),

  /* notifications, audit */
  notifications: () => admin(() => read().notifications.map((n) => ({ ...n, bookingCode: read().bookings.find((b) => b.id === n.bookingId)?.code }))),
  audit: () => admin(() => read().audit.slice(0, 200)),

  /* settings & rules */
  settings: () => admin(() => read().settings),
  saveSettings: (s: Settings) =>
    admin(() =>
      transaction((db) => {
        db.settings = s;
        bookings.writeAudit(db, "ADMIN_CHANGED_SETTINGS", undefined, "Обновлены настройки");
      }),
    ),
  saveRules: (rules: HouseRule[]) =>
    admin(() =>
      transaction((db) => {
        db.rules = rules;
        bookings.writeAudit(db, "ADMIN_CHANGED_SETTINGS", undefined, "Обновлены правила проживания");
      }),
    ),
  newRuleId: () => uid("r"),
};

/** Scheduler tick — idempotent, safe to run as often as needed. */
export function schedulerTick() {
  // Dry run first so an idle tick does not trigger a write.
  if (runReminders(structuredClone(read())) > 0) transaction((db) => runReminders(db));
}

