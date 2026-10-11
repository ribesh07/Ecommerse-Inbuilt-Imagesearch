"use client";

import { useCountry } from "@/context/CountryContext";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { MapPinIcon, CheckIcon } from "@/components/ui/icons";

/** Country/location selector. Drives currency, language and product pricing. */
export function CountrySelector({ compact = false }: { compact?: boolean }) {
  const { country, countryCode, setCountry, countries } = useCountry();

  return (
    <Dropdown
      ariaLabel="Select country"
      icon={<MapPinIcon className="h-4 w-4 text-ink-400" />}
      label={
        <span className="flex items-center gap-1.5">
          <span aria-hidden>{country.flag}</span>
          <span className={compact ? "hidden sm:inline" : ""}>{country.name}</span>
        </span>
      }
    >
      {(close) => (
        <div>
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Deliver to
          </p>
          {countries.map((item) => (
            <DropdownItem
              key={item.code}
              selected={item.code === countryCode}
              onClick={() => {
                setCountry(item.code);
                close();
              }}
            >
              <span aria-hidden>{item.flag}</span>
              <span className="flex-1">{item.name}</span>
              <span className="text-xs text-ink-400">{item.currency}</span>
              {item.code === countryCode ? <CheckIcon className="h-4 w-4" /> : null}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
