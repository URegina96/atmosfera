export type ID = string;
export type ISODate = string; // yyyy-MM-dd

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
/** Statuses that occupy dates in the calendar. */
export const ACTIVE_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED"];

export const PAYMENT_STATUSES = ["NOT_REQUIRED", "PENDING", "PARTIALLY_PAID", "PAID"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type BookingSource = "WEBSITE" | "TELEGRAM" | "ADMIN";
export type DayStatus = "AVAILABLE" | "BOOKED" | "BLOCKED" | "PAST";

export interface PropertyImage {
  id: ID;
  /** `render:<scene>` for built-in visualisations or a data/http URL for uploaded photos. */
  src: string;
  alt: string;
  isCover: boolean;
}

export interface Amenity {
  id: ID;
  name: string;
  icon: string;
}

export interface Property {
  id: ID;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenityIds: ID[];
  images: PropertyImage[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramAccount {
  telegramUserId: number;
  username?: string;
  linkedAt: string;
}

export interface Client {
  id: ID;
  name: string;
  phone: string;
  telegramUsername?: string;
  telegram?: TelegramAccount;
  privateNote?: string;
  createdAt: string;
}

export interface RescheduleRequest {
  checkIn: ISODate;
  checkOut: ISODate;
  requestedAt: string;
}

export interface Booking {
  id: ID;
  code: string;
  token: string;
  propertyId: ID;
  clientId: ID;
  checkIn: ISODate;
  checkOut: ISODate;
  guestsCount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: BookingSource;
  comment?: string;
  adminNote?: string;
  idempotencyKey?: string;
  rescheduleRequest?: RescheduleRequest;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelledBy?: "CLIENT" | "ADMIN";
}

export const BLOCK_REASONS = ["PERSONAL", "REPAIR", "MAINTENANCE", "OTHER"] as const;
export type BlockReason = (typeof BLOCK_REASONS)[number];

export interface BlockedPeriod {
  id: ID;
  propertyId: ID;
  /** Inclusive range of blocked nights. */
  from: ISODate;
  to: ISODate;
  reason: BlockReason;
  note?: string;
  createdAt: string;
}

export type PriceRuleKind = "BASE" | "WEEKDAY" | "WEEKEND" | "HOLIDAY" | "SEASONAL" | "SPECIAL";

export interface PriceRule {
  id: ID;
  propertyId: ID;
  kind: PriceRuleKind;
  amount: number;
  /** For HOLIDAY / SEASONAL / SPECIAL: inclusive date range. */
  from?: ISODate;
  to?: ISODate;
  name?: string;
}

export type NotificationEvent =
  | "NEW_BOOKING"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_RESCHEDULED"
  | "RESCHEDULE_REQUESTED"
  | "BOOKING_REMINDER";

export type NotificationStatus = "READY" | "SKIPPED";

export interface NotificationRecord {
  id: ID;
  event: NotificationEvent;
  recipient: "CLIENT" | "ADMIN";
  channel: "TELEGRAM";
  bookingId: ID;
  text: string;
  buttons?: { label: string; action: "CONFIRM" | "REJECT" }[];
  status: NotificationStatus;
  reason?: string;
  /** Idempotency key: the same key is never delivered twice. */
  dedupeKey: string;
  createdAt: string;
}

export type AuditAction =
  | "ADMIN_CREATED_BOOKING"
  | "ADMIN_CONFIRMED_BOOKING"
  | "ADMIN_CANCELLED_BOOKING"
  | "ADMIN_RESCHEDULED_BOOKING"
  | "ADMIN_COMPLETED_BOOKING"
  | "ADMIN_MARKED_NO_SHOW"
  | "ADMIN_UPDATED_BOOKING"
  | "ADMIN_BLOCKED_DATES"
  | "ADMIN_UNBLOCKED_DATES"
  | "ADMIN_CHANGED_PRICE"
  | "ADMIN_CHANGED_PROPERTY"
  | "ADMIN_CHANGED_SETTINGS"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGIN_FAILED";

export interface AuditEntry {
  id: ID;
  action: AuditAction;
  entityId?: ID;
  details: string;
  actor: string;
  at: string;
}

export interface HouseRule {
  id: ID;
  title: string;
  text: string;
}

export interface Settings {
  brandName: string;
  locationLine: string;
  phone: string;
  email: string;
  telegramBotUsername: string;
  showExactAddress: boolean;
  address: string;
  directions: string;
  checkInTime: string;
  checkOutTime: string;
  minNights: number;
  reminder3h: boolean;
}

export interface AdminUser {
  id: ID;
  login: string;
  passwordHash: string;
  role: "ADMIN" | "MANAGER";
  name: string;
}

export interface DB {
  version: number;
  properties: Property[];
  amenities: Amenity[];
  clients: Client[];
  bookings: Booking[];
  blockedPeriods: BlockedPeriod[];
  priceRules: PriceRule[];
  notifications: NotificationRecord[];
  audit: AuditEntry[];
  rules: HouseRule[];
  settings: Settings;
  users: AdminUser[];
}

/** Public projections — never include private notes or other clients' data. */
export interface PublicBooking {
  code: string;
  token: string;
  propertyId: ID;
  propertyName: string;
  propertySlug: string;
  checkIn: ISODate;
  checkOut: ISODate;
  nights: number;
  guestsCount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  comment?: string;
  clientName: string;
  telegramLinked: boolean;
  rescheduleRequest?: RescheduleRequest;
  createdAt: string;
}

export interface AvailabilityDay {
  date: ISODate;
  status: DayStatus;
}
