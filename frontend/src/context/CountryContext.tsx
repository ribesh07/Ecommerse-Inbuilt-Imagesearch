"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  getCountry,
  isSupportedCountry,
  type CountryConfig,
} from "@/config/locales";
import {
  createPersistentStore,
  parseNullableString,
  usePersistentStore,
} from "@/lib/persistent-store";

interface CountryContextValue {
  country: CountryConfig;
  countryCode: string;
  currencyCode: string;
  setCountry: (code: string) => void;
  countries: CountryConfig[];
  /** False during SSR / first paint, true once persisted state is available. */
  ready: boolean;
}

const CountryContext = createContext<CountryContextValue | null>(null);

const STORAGE_KEY = "sukilo.country";

/** Persisted country selection; validated against the supported list. */
const countryStore = createPersistentStore<string | null>(
  STORAGE_KEY,
  null,
  (raw) => (raw && isSupportedCountry(raw) ? parseNullableString(raw) : null),
);

export function CountryProvider({
  children,
  initialCountry = DEFAULT_COUNTRY_CODE,
}: {
  children: ReactNode;
  initialCountry?: string;
}) {
  const stored = usePersistentStore(countryStore);
  const countryCode = stored ?? initialCountry;
  const country = useMemo(() => getCountry(countryCode), [countryCode]);

  const setCountry = useCallback((code: string) => {
    if (!isSupportedCountry(code)) return;
    countryStore.set(code);
    try {
      document.cookie = `${STORAGE_KEY}=${code}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* ignore cookie failures */
    }
  }, []);

  const value = useMemo<CountryContextValue>(
    () => ({
      country,
      countryCode,
      currencyCode: country.currency,
      setCountry,
      countries: COUNTRIES,
      ready: stored !== null,
    }),
    [country, countryCode, setCountry, stored],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within a CountryProvider");
  return ctx;
}
