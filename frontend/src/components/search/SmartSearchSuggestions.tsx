"use client";

import Image from "next/image";
import Link from "next/link";
import type { SearchSuggestions } from "@/lib/api/search";
import { useCurrency } from "@/context/CurrencyContext";
import { useLocale } from "@/context/LocaleContext";
import { SpinnerIcon, SearchIcon, StoreIcon, PackageIcon, TrashIcon } from "@/components/ui/icons";

interface Props {
  query: string;
  loading: boolean;
  suggestions: SearchSuggestions | null;
  recent: string[];
  popular: string[];
  onPick: (term: string) => void;
  onClearRecent: () => void;
}

/** Dropdown content for the search bar: suggestions + recent/popular terms. */
export function SmartSearchSuggestions({
  query,
  loading,
  suggestions,
  recent,
  popular,
  onPick,
  onClearRecent,
}: Props) {
  const { format } = useCurrency();
  const { t } = useLocale();

  const hasQuery = query.trim().length >= 2;
  const hasSuggestions =
    !!suggestions &&
    (suggestions.products.length > 0 ||
      suggestions.categories.length > 0 ||
      suggestions.brands.length > 0);

  return (
    <div className="max-h-[70vh] overflow-y-auto p-2">
      {hasQuery ? (
        loading && !hasSuggestions ? (
          <div className="flex items-center gap-2 px-3 py-4 text-sm text-ink-500">
            <SpinnerIcon className="h-4 w-4" /> Searching…
          </div>
        ) : hasSuggestions ? (
          <div className="space-y-1">
            {suggestions!.products.length > 0 ? (
              <section>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Products
                </p>
                {suggestions!.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="focus-ring flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink-50"
                  >
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-ink-100">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm text-ink-800">{product.name}</span>
                      <span className="text-xs text-ink-400">{product.brand?.name}</span>
                    </span>
                    <span className="text-sm font-semibold text-ink-900">
                      {format(product.price.amount, product.price.currency)}
                    </span>
                  </Link>
                ))}
              </section>
            ) : null}

            {suggestions!.categories.length > 0 ? (
              <section>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Categories
                </p>
                {suggestions!.categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onPick(category.name)}
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <PackageIcon className="h-4 w-4 text-ink-400" />
                    {category.name}
                  </button>
                ))}
              </section>
            ) : null}

            {suggestions!.brands.length > 0 ? (
              <section>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Brands
                </p>
                {suggestions!.brands.map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => onPick(brand.name)}
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <StoreIcon className="h-4 w-4 text-ink-400" />
                    {brand.name}
                  </button>
                ))}
              </section>
            ) : null}

            <button
              type="button"
              onClick={() => onPick(query)}
              className="focus-ring mt-1 flex w-full items-center gap-2 rounded-lg border-t border-ink-100 px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              <SearchIcon className="h-4 w-4" />
              {t("search")} “{query.trim()}”
            </button>
          </div>
        ) : (
          <div className="px-3 py-4 text-sm text-ink-500">No suggestions. Press Enter to search.</div>
        )
      ) : (
        <div className="space-y-3 p-1">
          {recent.length > 0 ? (
            <section>
              <div className="flex items-center justify-between px-3 py-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Recent searches
                </p>
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="focus-ring flex items-center gap-1 rounded px-1 text-xs text-ink-400 hover:text-rose-600"
                >
                  <TrashIcon className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2 px-3">
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => onPick(term)}
                    className="focus-ring rounded-full border border-ink-200 px-3 py-1 text-sm text-ink-600 hover:border-brand-300 hover:text-brand-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {popular.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onPick(term)}
                  className="focus-ring rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-700 hover:bg-ink-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
