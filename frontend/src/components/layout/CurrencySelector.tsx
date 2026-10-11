"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { CheckIcon } from "@/components/ui/icons";

/** Currency selector. The active currency defaults to the country's currency. */
export function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currency, currencyCode, setCurrency, currencies, isOverridden } = useCurrency();

  return (
    <Dropdown
      ariaLabel="Select currency"
      label={
        <span className="flex items-center gap-1.5">
          <span aria-hidden>{currency.symbol}</span>
          <span className={compact ? "hidden sm:inline" : ""}>{currency.code}</span>
        </span>
      }
    >
      {(close) => (
        <div>
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Currency
          </p>
          {currencies.map((item) => (
            <DropdownItem
              key={item.code}
              selected={item.code === currencyCode}
              onClick={() => {
                setCurrency(item.code);
                close();
              }}
            >
              <span className="w-6 text-ink-500">{item.symbol}</span>
              <span className="flex-1">
                {item.code}
                <span className="ml-1 text-xs text-ink-400">{item.name}</span>
              </span>
              {item.code === currencyCode ? <CheckIcon className="h-4 w-4" /> : null}
            </DropdownItem>
          ))}
          {isOverridden ? (
            <p className="px-3 py-2 text-xs text-amber-600">
              Prices shown in your chosen currency. Country pricing applies at checkout.
            </p>
          ) : null}
        </div>
      )}
    </Dropdown>
  );
}
