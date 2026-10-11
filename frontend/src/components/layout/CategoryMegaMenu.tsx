"use client";

import Link from "next/link";
import { Dropdown } from "@/components/ui/Dropdown";
import { ChevronRightIcon, GridIcon } from "@/components/ui/icons";
import { useLocale } from "@/context/LocaleContext";
import type { NavCategory } from "@/lib/api/nav";

/**
 * Desktop category mega-menu. Uses the shared accessible Dropdown so outside
 * click / Escape handling is consistent with the other header menus.
 */
export function CategoryMegaMenu({ categories }: { categories: NavCategory[] }) {
  const { t } = useLocale();

  return (
    <Dropdown
      ariaLabel={t("all_categories")}
      icon={<GridIcon className="h-4 w-4" />}
      label={t("all_categories")}
      triggerClassName="bg-brand-600 text-white hover:bg-brand-700 hover:text-white"
      panelClassName="w-[min(64rem,90vw)] p-4"
    >
      {() => (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
        {categories.map((category) => (
          <div key={category.id}>
            <Link
              href={`/product?category=${category.id}`}
              className="focus-ring mb-1.5 flex items-center justify-between rounded-md px-1 text-sm font-semibold text-ink-900 hover:text-brand-700"
            >
              {category.name}
              <ChevronRightIcon className="h-3.5 w-3.5 text-ink-300" />
            </Link>
            <ul className="space-y-0.5">
              {category.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/product?category=${child.id}`}
                    className="focus-ring block truncate rounded-md px-1 py-1 text-sm text-ink-500 hover:bg-ink-50 hover:text-ink-800"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        </div>
      )}
    </Dropdown>
  );
}
