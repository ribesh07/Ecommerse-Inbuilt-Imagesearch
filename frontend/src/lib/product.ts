import { getCountry } from "@/config/locales";
import { toNumber } from "./format";
import type {
  ProductDescription,
  ProductDetail,
  ProductListItem,
  ProductPrice,
} from "./api/types";

/**
 * Price resolution for a market.
 *
 * The API exposes country-specific prices on product detail (`prices[]`). We
 * always prefer the backend price for the active country. When a product has no
 * row for that country we fall back to:
 *   1. the price the list endpoint returned, if it is already in the market currency;
 *   2. otherwise a display-only FX conversion using the configured static rates.
 *
 * Frontend conversion is a presentation fallback only — it is never used when
 * the backend provides a matching country price.
 */
export interface ResolvedPrice {
  amount: number;
  currency: string;
  comparePrice: number | null;
  /** True when the amount was FX-converted rather than supplied by the API. */
  converted: boolean;
}

function findCountryPrice(
  prices: ProductPrice[] | undefined,
  countryCode: string,
): ProductPrice | undefined {
  return prices?.find((p) => p.country_code === countryCode && p.is_active);
}

interface ResolveArgs {
  /** Country-specific prices (detail endpoint only). */
  prices?: ProductPrice[];
  /** List price + compare price. */
  price?: string | number | { amount: string; currency: string } | null;
  comparePrice?: string | number | null;
  countryCode: string;
}

export function resolvePrice(args: ResolveArgs): ResolvedPrice | null {
  const country = getCountry(args.countryCode);
  const targetCurrency = country.currency;

  const countryPrice = findCountryPrice(args.prices, country.code);
  if (countryPrice) {
    return {
      amount: toNumber(countryPrice.price) ?? 0,
      currency: countryPrice.currency_code,
      comparePrice: toNumber(countryPrice.compare_price),
      converted: false,
    };
  }

  const listAmount =
    typeof args.price === "object" && args.price !== null
      ? toNumber(args.price.amount)
      : toNumber(args.price ?? null);
  if (listAmount === null) return null;

  const listCurrency =
    typeof args.price === "object" && args.price !== null ? args.price.currency : targetCurrency;

  if (listCurrency === targetCurrency) {
    return {
      amount: listAmount,
      currency: listCurrency,
      comparePrice: toNumber(args.comparePrice ?? null),
      converted: false,
    };
  }

  const converted = convertCurrency(listAmount, listCurrency, targetCurrency);
  const compare = toNumber(args.comparePrice ?? null);
  return {
    amount: converted ?? listAmount,
    currency: converted === null ? listCurrency : targetCurrency,
    comparePrice: compare === null ? null : convertCurrency(compare, listCurrency, targetCurrency),
    converted: converted !== null,
  };
}

/** Static FX conversion via the config table (USD base). Presentation only. */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
): number | null {
  if (from === to) return amount;
  const fromRate = rateFor(from);
  const toRate = rateFor(to);
  if (fromRate === null || toRate === null) return null;
  return (amount / fromRate) * toRate;
}

function rateFor(currency: string): number | null {
  switch (currency) {
    case "USD":
      return 1;
    case "NPR":
      return getCountry("NP").usdRate;
    case "BDT":
      return getCountry("BD").usdRate;
    case "CNY":
      return getCountry("CN").usdRate;
    case "INR":
      return getCountry("IN").usdRate;
    default:
      return null;
  }
}

export function resolveListPrice(
  product: ProductListItem,
  countryCode: string,
): ResolvedPrice | null {
  return resolvePrice({
    price: product.price,
    comparePrice: product.compare_price,
    countryCode,
  });
}

export function resolveDetailPrice(
  product: ProductDetail,
  countryCode: string,
): ResolvedPrice | null {
  return resolvePrice({
    prices: product.prices,
    price: product.price,
    comparePrice: product.compare_price,
    countryCode,
  });
}

/** Picks the description block matching the active language, with fallbacks. */
export function localizedDescription(
  descriptions: ProductDescription[] | undefined,
  language: string,
): ProductDescription | null {
  if (!descriptions || descriptions.length === 0) return null;
  return (
    descriptions.find((d) => d.language_code === language) ??
    descriptions.find((d) => d.language_code === "en") ??
    descriptions[0]
  );
}

/** Product display name, respecting localised titles where available. */
export function productName(
  product: { name: string; descriptions?: ProductDescription[] },
  language: string,
): string {
  return localizedDescription(product.descriptions, language)?.title ?? product.name;
}

export function productShortDescription(
  product: { short_description?: string | null; descriptions?: ProductDescription[] },
  language: string,
): string | null {
  return (
    localizedDescription(product.descriptions, language)?.short_description ??
    product.short_description ??
    null
  );
}

export interface ProductAvailability {
  inStock: boolean;
  lowStock: boolean;
  stock: number;
}

export function availability(stock: number | null | undefined): ProductAvailability {
  const value = stock ?? 0;
  return { inStock: value > 0, lowStock: value > 0 && value <= 10, stock: value };
}
