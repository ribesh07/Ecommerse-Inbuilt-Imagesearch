/**
 * Central platform configuration.
 *
 * Everything country/currency/language related lives here so new markets can
 * be added by editing data, never by touching components. Components consume
 * these through the `CountryProvider` context and the pure helpers in
 * `src/lib/format.ts`.
 */

export interface CountryConfig {
  /** ISO 3166-1 alpha-2, matches `country_code` in the API. */
  code: string;
  name: string;
  flag: string;
  currency: string;
  /** Languages offered in this market, in preference order. */
  languages: string[];
  defaultLanguage: string;
  /** Fallback FX rate relative to USD (1 USD = rate * local). */
  usdRate: number;
  /** Not surfaced by the API; used only for display copy. */
  freeShippingThreshold: number;
  deliveryEstimate: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface LanguageConfig {
  code: string;
  label: string;
  englishLabel: string;
  dir: "ltr" | "rtl";
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: "NP",
    name: "Nepal",
    flag: "🇳🇵",
    currency: "NPR",
    languages: ["en", "ne"],
    defaultLanguage: "ne",
    usdRate: 133.5,
    freeShippingThreshold: 5000,
    deliveryEstimate: "1–3 business days",
  },
  {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    currency: "BDT",
    languages: ["en", "bn"],
    defaultLanguage: "bn",
    usdRate: 110.5,
    freeShippingThreshold: 3000,
    deliveryEstimate: "1–4 business days",
  },
  {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    currency: "CNY",
    languages: ["en", "zh"],
    defaultLanguage: "zh",
    usdRate: 7.25,
    freeShippingThreshold: 300,
    deliveryEstimate: "2–5 business days",
  },
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    currency: "INR",
    languages: ["en", "hi"],
    defaultLanguage: "en",
    usdRate: 83.3,
    freeShippingThreshold: 2000,
    deliveryEstimate: "1–4 business days",
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    languages: ["en"],
    defaultLanguage: "en",
    usdRate: 1,
    freeShippingThreshold: 50,
    deliveryEstimate: "2–6 business days",
  },
];

export const DEFAULT_COUNTRY_CODE = "NP";

export const CURRENCIES: Record<string, CurrencyConfig> = {
  NPR: { code: "NPR", symbol: "Rs", name: "Nepalese Rupee", decimals: 0 },
  BDT: { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", decimals: 0 },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", decimals: 2 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", decimals: 0 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
};

export const LANGUAGES: Record<string, LanguageConfig> = {
  en: { code: "en", label: "English", englishLabel: "English", dir: "ltr" },
  ne: { code: "ne", label: "नेपाली", englishLabel: "Nepali", dir: "ltr" },
  bn: { code: "bn", label: "বাংলা", englishLabel: "Bangla", dir: "ltr" },
  zh: { code: "zh", label: "中文", englishLabel: "Chinese", dir: "ltr" },
  hi: { code: "hi", label: "हिन्दी", englishLabel: "Hindi", dir: "ltr" },
};

export function getCountry(code: string): CountryConfig {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function getCurrency(code: string): CurrencyConfig {
  return CURRENCIES[code] ?? CURRENCIES.USD;
}

export function getLanguage(code: string): LanguageConfig {
  return LANGUAGES[code] ?? LANGUAGES.en;
}

export function isSupportedLanguage(code: string): boolean {
  return code in LANGUAGES;
}

export function isSupportedCountry(code: string): boolean {
  return COUNTRIES.some((c) => c.code === code);
}
