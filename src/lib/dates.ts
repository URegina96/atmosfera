import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import type { ISODate } from "./types";

export const toISO = (d: Date): ISODate => format(d, "yyyy-MM-dd");
export const fromISO = (s: ISODate): Date => parseISO(s);
export const todayISO = (): ISODate => toISO(new Date());
export const shiftISO = (s: ISODate, days: number): ISODate => toISO(addDays(fromISO(s), days));

/** Nights are the half-open interval [checkIn, checkOut): the check-out day stays free for the next guest. */
export const nightsBetween = (checkIn: ISODate, checkOut: ISODate) =>
  differenceInCalendarDays(fromISO(checkOut), fromISO(checkIn));

export function eachNight(checkIn: ISODate, checkOut: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = checkIn; d < checkOut; d = shiftISO(d, 1)) out.push(d);
  return out;
}

export function eachDayInclusive(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = shiftISO(d, 1)) out.push(d);
  return out;
}

/** Half-open overlap test for [aStart, aEnd) and [bStart, bEnd). */
export const overlaps = (aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate) =>
  aStart < bEnd && bStart < aEnd;

/** Friday and Saturday nights are priced as weekend nights. */
export const isWeekendNight = (s: ISODate) => {
  const day = fromISO(s).getDay();
  return day === 5 || day === 6;
};

export const fmt = (s: ISODate, pattern: string) => format(fromISO(s), pattern, { locale: ru });
export const fmtDay = (s: ISODate) => fmt(s, "d MMMM");
export const fmtDayShort = (s: ISODate) => fmt(s, "d MMM");
export const fmtDateTime = (iso: string) => format(new Date(iso), "d MMM, HH:mm", { locale: ru });

export function fmtRange(a: ISODate, b: ISODate) {
  const A = fromISO(a);
  const B = fromISO(b);
  if (A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear()) {
    return `${format(A, "d", { locale: ru })} → ${format(B, "d MMMM", { locale: ru })}`;
  }
  return `${format(A, "d MMMM", { locale: ru })} → ${format(B, "d MMMM", { locale: ru })}`;
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const nightsLabel = (n: number) => `${n} ${plural(n, "ночь", "ночи", "ночей")}`;
export const guestsLabel = (n: number) => `${n} ${plural(n, "гость", "гостя", "гостей")}`;
