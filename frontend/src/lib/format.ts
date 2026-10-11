import { getCurrency, getLanguage } from "@/config/locales";

/**
 * Currency-aware formatting. We never string-replace symbols: `Intl.NumberFormat`
 * handles grouping, decimals and symbol placement using the market locale.
 */

const LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: "en-US",
  ne: "ne-NP",
  bn: "bn-BD",
  zh: "zh-CN",
  hi: "hi-IN",
};

export function localeForLanguage(language: string): string {
  return LOCALE_BY_LANGUAGE[language] ?? "en-US";
}

/** Parses an API numeric string (or number) into a number, tolerating nulls. */
export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

interface FormatMoneyOptions {
  currency: string;
  language?: string;
  /** Locale override, e.g. "en-US". */
  locale?: string;
  compact?: boolean;
  /** Force showing decimals for whole amounts (useful for USD/CNY). */
  forceDecimals?: boolean;
}

/**
 * Formats a monetary amount in a given currency. `amount` may be a string from
 * the API. When the currency is unknown (no table entry) we fall back to the
 * provided code and 2 decimals.
 */
export function formatMoney(
  amount: string | number | null | undefined,
  options: FormatMoneyOptions,
): string {
  const value = toNumber(amount);
  if (value === null) return "";

  const { currency, language = "en", locale, compact, forceDecimals } = options;
  const config = getCurrency(currency);
  const resolvedLocale = locale ?? localeForLanguage(language);
  const currencyDisplay = compact ? "narrowSymbol" : "symbol";

  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: config.code,
    currencyDisplay,
    minimumFractionDigits: forceDecimals ? config.decimals : undefined,
    maximumFractionDigits: config.decimals,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

/** Discount percentage between a compare price and a current price. */
export function discountPercent(
  price: string | number | null | undefined,
  comparePrice: string | number | null | undefined,
): number | null {
  const value = toNumber(price);
  const compare = toNumber(comparePrice);
  if (value === null || compare === null || compare <= value) return null;
  return Math.round(((compare - value) / compare) * 100);
}

/** Formats a plain number (ratings, counts) using the market locale. */
export function formatNumber(
  value: number,
  language = "en",
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(localeForLanguage(language), options).format(value);
}

/** Rating rendered as a fixed 1-decimal string; returns null when unavailable. */
export function formatRating(rating: string | number | null | undefined): string | null {
  const value = toNumber(rating);
  if (value === null || value === 0) return null;
  return value.toFixed(1);
}

export function formatDate(
  input: string | number | Date,
  language = "en",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeForLanguage(language), options).format(date);
}

/** Returns the display symbol for a currency (used sparingly, e.g. inputs). */
export function currencySymbol(currency: string): string {
  return getCurrency(currency).symbol;
}

/** Language label helper re-exported for convenience. */
export { getLanguage };
