"use client";

import { useLocale } from "@/context/LocaleContext";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { GlobeIcon, CheckIcon } from "@/components/ui/icons";

/** Language selector. Languages shown depend on the active country. */
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, languageConfig, setLanguage, availableLanguages } = useLocale();

  return (
    <Dropdown
      ariaLabel="Select language"
      icon={<GlobeIcon className="h-4 w-4 text-ink-400" />}
      label={<span className={compact ? "hidden sm:inline" : ""}>{languageConfig.label}</span>}
    >
      {(close) => (
        <div>
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Language
          </p>
          {availableLanguages.map((item) => (
            <DropdownItem
              key={item.code}
              selected={item.code === language}
              onClick={() => {
                setLanguage(item.code);
                close();
              }}
            >
              <span className="flex-1">
                {item.label}
                <span className="ml-1 text-xs text-ink-400">{item.englishLabel}</span>
              </span>
              {item.code === language ? <CheckIcon className="h-4 w-4" /> : null}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
