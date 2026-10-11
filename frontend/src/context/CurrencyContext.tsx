"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { CURRENCIES, getCountry, getCurrency, type CurrencyConfig } from "@/config/locales";
import { formatMoney } from "@/lib/format";
import {
  createPersistentStore,
  parseNullableString,
  usePersistentStore,
} from "@/lib/persistent-store";
import { useCountry } from "./CountryContext";

interface CurrencyContextValue {
  currency: CurrencyConfig;
  currencyCode: string;
  currencies: CurrencyConfig[];
  format: (amount: string | number | null | undefined, currencyCode?: string) => string;
  formatCompact: (amount: string | number | null | undefined, currencyCode?: string) => string;
  isOverridden: boolean;
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "sukilo.currency";

const currencyStore = createPersistentStore<string | null>(
  STORAGE_KEY,
  null,
  (raw) => (raw && raw in CURRENCIES ? parseNullableString(raw) : null),
);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { country, countryCode } = useCountry();
  const override = usePersistentStore(currencyStore);
  const currencyCode = override ?? country.currency;

  const setCurrency = useCallback(
    (code: string) => {
      if (!(code in CURRENCIES)) return;
      // Choosing the country default clears the override.
      currencyStore.set(code === getCountry(countryCode).currency ? null : code);
    },
    [countryCode],
  );

  const value = useMemo<CurrencyContextValue>(() => {
    const currency = getCurrency(currencyCode);
    return {
      currency,
      currencyCode,
      currencies: Object.values(CURRENCIES),
      isOverridden: override !== null,
      setCurrency,
      format: (amount, code) =>
        formatMoney(amount, { currency: code ?? currencyCode, language: country.defaultLanguage }),
      formatCompact: (amount, code) =>
        formatMoney(amount, {
          currency: code ?? currencyCode,
          language: country.defaultLanguage,
          compact: true,
        }),
    };
  }, [currencyCode, override, setCurrency, country.defaultLanguage]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
