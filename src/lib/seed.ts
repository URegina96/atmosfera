import { shiftISO, todayISO } from "./dates";
import type { Booking, BookingStatus, DB, PaymentStatus } from "./types";

export const DB_VERSION = 3;

/** Demo admin: login `admin`, password `atmosfera2026` (salted SHA-256, see auth.ts). */
const DEMO_ADMIN_HASH = "7146abbd36c64310042da967bb6a250f813241b7ba6f54c480c605f479392a6a";

export function createSeed(): DB {
  const now = new Date().toISOString();
  const t = todayISO();
  const d = (n: number) => shiftISO(t, n);

  const amenities = [
    { id: "am-tub", name: "Чан", icon: "tub" },
    { id: "am-terrace", name: "Терраса", icon: "terrace" },
    { id: "am-grill", name: "Мангал", icon: "grill" },
    { id: "am-parking", name: "Парковка", icon: "parking" },
    { id: "am-wifi", name: "Wi‑Fi", icon: "wifi" },
    { id: "am-kitchen", name: "Кухня", icon: "kitchen" },
    { id: "am-linen", name: "Постельное бельё", icon: "linen" },
    { id: "am-towels", name: "Полотенца", icon: "towels" },
    { id: "am-tv", name: "Телевизор", icon: "tv" },
    { id: "am-ac", name: "Кондиционер", icon: "ac" },
  ];

  const properties = [
    {
      id: "prop-1",
      name: "Дом №1",
      slug: "dom-1",
      tagline: "Барнхаус с панорамным фасадом",
      description:
        "Тёплый деревянный дом с высоким потолком и панорамным остеклением во всю торцевую стену. Утро начинается с вида на лес, вечер — на террасе у горячего чана. Спокойный интерьер в натуральных оттенках, кухня-гостиная и две отдельные спальни.",
      capacity: 4,
      bedrooms: 2,
      bathrooms: 1,
      area: 72,
      amenityIds: ["am-tub", "am-terrace", "am-grill", "am-parking", "am-wifi", "am-kitchen", "am-linen", "am-towels", "am-tv"],
      images: [
        { id: "img-1a", src: "render:a-dusk", alt: "Дом №1 вечером", isCover: true },
        { id: "img-1b", src: "render:a-tub", alt: "Чан на террасе Дома №1", isCover: false },
        { id: "img-1c", src: "render:a-interior", alt: "Гостиная Дома №1", isCover: false },
        { id: "img-1d", src: "render:a-winter", alt: "Дом №1 зимой", isCover: false },
      ],
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prop-2",
      name: "Дом №2",
      slug: "dom-2",
      tagline: "Современный дом с плоской кровлей",
      description:
        "Низкий горизонтальный силуэт, деревянные ламели и раздвижная панорамная дверь, которая открывает гостиную прямо на террасу. Чан стоит в нескольких шагах — между домом и соснами. Пространство для тихих вечеров вдвоём или небольшой компанией.",
      capacity: 4,
      bedrooms: 2,
      bathrooms: 1,
      area: 64,
      amenityIds: ["am-tub", "am-terrace", "am-grill", "am-parking", "am-wifi", "am-kitchen", "am-linen", "am-towels", "am-ac"],
      images: [
        { id: "img-2a", src: "render:b-dusk", alt: "Дом №2 вечером", isCover: true },
        { id: "img-2b", src: "render:b-night", alt: "Дом №2 ночью", isCover: false },
        { id: "img-2c", src: "render:b-interior", alt: "Гостиная Дома №2", isCover: false },
        { id: "img-2d", src: "render:b-tub", alt: "Чан у Дома №2", isCover: false },
      ],
      isActive: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const clients = [
    { id: "cl-1", name: "Анна Иванова", phone: "+79000000000", telegramUsername: "anna_iv", telegram: { telegramUserId: 50011, username: "anna_iv", linkedAt: now }, createdAt: shiftISO(t, -40) + "T10:00:00.000Z" },
    { id: "cl-2", name: "Дмитрий Соколов", phone: "+79171234567", telegramUsername: "dsokolov", telegram: { telegramUserId: 50012, username: "dsokolov", linkedAt: now }, createdAt: shiftISO(t, -21) + "T10:00:00.000Z" },
    { id: "cl-3", name: "Екатерина Лаврова", phone: "+79279876543", telegramUsername: "katya_l", createdAt: shiftISO(t, -3) + "T10:00:00.000Z" },
    { id: "cl-4", name: "Руслан Галиев", phone: "+79874561230", telegramUsername: "rgaliev", telegram: { telegramUserId: 50014, username: "rgaliev", linkedAt: now }, createdAt: shiftISO(t, -1) + "T10:00:00.000Z", privateNote: "Постоянный гость, просил дрова заранее" },
    { id: "cl-5", name: "Марина Ахметова", phone: "+79063332211", telegramUsername: "marina_a", createdAt: shiftISO(t, -60) + "T10:00:00.000Z" },
  ];

  let seq = 1040;
  const b = (
    propertyId: string,
    clientId: string,
    checkIn: string,
    checkOut: string,
    guestsCount: number,
    status: BookingStatus,
    extra: Partial<Booking> = {},
  ): Booking => {
    seq += 1;
    const paymentStatus: PaymentStatus =
      status === "CONFIRMED" ? "PARTIALLY_PAID" : status === "COMPLETED" ? "PAID" : status === "CANCELLED" ? "NOT_REQUIRED" : "PENDING";
    return {
      id: `bk-${seq}`,
      code: `ATM-${seq}`,
      token: `tk${seq}${Math.random().toString(36).slice(2, 10)}`,
      propertyId,
      clientId,
      checkIn,
      checkOut,
      guestsCount,
      status,
      paymentStatus,
      source: "WEBSITE",
      createdAt: now,
      updatedAt: now,
      confirmedAt: status === "CONFIRMED" || status === "COMPLETED" ? now : undefined,
      ...extra,
    };
  };

  const bookings: Booking[] = [
    b("prop-1", "cl-1", d(0), d(2), 4, "CONFIRMED", { comment: "Хотим приехать с детьми." }),
    b("prop-2", "cl-2", d(-2), d(0), 2, "CONFIRMED", { source: "TELEGRAM" }),
    b("prop-2", "cl-4", d(0), d(3), 3, "CONFIRMED", { source: "TELEGRAM", adminNote: "Подготовить дрова для чана" }),
    b("prop-1", "cl-3", d(5), d(7), 2, "PENDING", { comment: "Можно ли заехать пораньше?" }),
    b("prop-2", "cl-5", d(6), d(8), 4, "PENDING"),
    b("prop-1", "cl-2", d(10), d(12), 3, "CONFIRMED"),
    b("prop-1", "cl-5", d(-12), d(-10), 2, "COMPLETED"),
    b("prop-2", "cl-1", d(-9), d(-7), 4, "COMPLETED"),
    b("prop-1", "cl-4", d(3), d(4), 2, "CANCELLED", { cancelledAt: now, cancelledBy: "CLIENT" }),
  ];
  // Stable demo credentials for the client cabinet.
  bookings[0].code = "ATM-1042";
  bookings[0].token = "demo-anna";

  return {
    version: DB_VERSION,
    amenities,
    properties,
    clients,
    bookings,
    blockedPeriods: [
      { id: "bl-1", propertyId: "prop-2", from: d(14), to: d(17), reason: "REPAIR", note: "Замена настила террасы", createdAt: now },
      { id: "bl-2", propertyId: "prop-1", from: d(20), to: d(21), reason: "PERSONAL", createdAt: now },
    ],
    priceRules: [
      { id: "pr-1", propertyId: "prop-1", kind: "BASE", amount: 12000 },
      { id: "pr-2", propertyId: "prop-1", kind: "WEEKEND", amount: 15000 },
      { id: "pr-3", propertyId: "prop-2", kind: "BASE", amount: 11000 },
      { id: "pr-4", propertyId: "prop-2", kind: "WEEKEND", amount: 14000 },
      { id: "pr-5", propertyId: "prop-1", kind: "HOLIDAY", amount: 20000, from: `${t.slice(0, 4)}-12-30`, to: `${Number(t.slice(0, 4)) + 1}-01-08`, name: "Новогодние праздники" },
      { id: "pr-6", propertyId: "prop-2", kind: "HOLIDAY", amount: 19000, from: `${t.slice(0, 4)}-12-30`, to: `${Number(t.slice(0, 4)) + 1}-01-08`, name: "Новогодние праздники" },
    ],
    notifications: [],
    audit: [],
    rules: [
      { id: "r-1", title: "Заезд", text: "Время заезда указано в подтверждении бронирования. Ранний заезд — по договорённости." },
      { id: "r-2", title: "Выезд", text: "Время выезда указано в подтверждении. Поздний выезд возможен, если дом свободен." },
      { id: "r-3", title: "Количество гостей", text: "Количество гостей не должно превышать вместимость выбранного дома." },
      { id: "r-4", title: "Дети", text: "Гостям с детьми рекомендуем заранее сообщить об этом в комментарии к заявке." },
      { id: "r-5", title: "Животные", text: "Возможность проживания с питомцами согласовывается с владельцем заранее." },
      { id: "r-6", title: "Курение", text: "Правила курения уточняются при подтверждении бронирования." },
      { id: "r-7", title: "Тишина", text: "Просим уважать покой соседнего дома и природы вокруг." },
      { id: "r-8", title: "Мангал", text: "Пользуйтесь мангалом только в отведённой зоне." },
      { id: "r-9", title: "Чан", text: "Чан подготавливается к вашему приезду. Порядок использования расскажем при заселении." },
    ],
    settings: {
      brandName: "Загородный дом «Атмосфера»",
      locationLine: "Уфа · 20 км от города",
      phone: "+7 900 000-00-00",
      email: "hello@atmosfera.example",
      telegramBotUsername: "atmosfera_demo_bot",
      showExactAddress: false,
      address: "Республика Башкортостан, Уфимский район",
      directions: "Точный адрес и схему проезда мы отправим после подтверждения бронирования.",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      minNights: 1,
      reminder3h: true,
    },
    users: [{ id: "u-1", login: "admin", passwordHash: DEMO_ADMIN_HASH, role: "ADMIN", name: "Регина" }],
  };
}
