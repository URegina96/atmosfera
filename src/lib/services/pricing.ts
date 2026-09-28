import { eachNight, isWeekendNight } from "../dates";
import type { DB, ID, ISODate, PriceRule, PriceRuleKind } from "../types";

/**
 * PriceCalculationService. Priority per night:
 * SPECIAL date → HOLIDAY → SEASONAL → WEEKEND / WEEKDAY → BASE.
 * Prices are not shown on the public site yet; the admin sees the estimate.
 */
export interface NightPrice {
  date: ISODate;
  amount: number;
  kind: PriceRuleKind;
  ruleName?: string;
}

export interface PriceQuote {
  nights: NightPrice[];
  total: number;
  hasGaps: boolean;
}

const inRange = (r: PriceRule, date: ISODate) => !!r.from && !!r.to && date >= r.from && date <= r.to;

function priceForNight(rules: PriceRule[], date: ISODate): NightPrice | null {
  const find = (kind: PriceRuleKind, ranged: boolean) =>
    rules.find((r) => r.kind === kind && (!ranged || inRange(r, date)));
  const pick =
    find("SPECIAL", true) ??
    find("HOLIDAY", true) ??
    find("SEASONAL", true) ??
    (isWeekendNight(date) ? find("WEEKEND", false) : find("WEEKDAY", false)) ??
    find("BASE", false);
  return pick ? { date, amount: pick.amount, kind: pick.kind, ruleName: pick.name } : null;
}

export function calculatePrice(db: DB, propertyId: ID, checkIn: ISODate, checkOut: ISODate): PriceQuote {
  const rules = db.priceRules.filter((r) => r.propertyId === propertyId);
  const nights: NightPrice[] = [];
  let hasGaps = false;
  for (const date of eachNight(checkIn, checkOut)) {
    const p = priceForNight(rules, date);
    if (p) nights.push(p);
    else hasGaps = true;
  }
  return { nights, total: nights.reduce((s, n) => s + n.amount, 0), hasGaps };
}

export const formatRub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;
