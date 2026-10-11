"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogPanel, DialogBackdrop, CloseButton } from "@headlessui/react";
import { CloseIcon, MenuIcon, ChevronDownIcon, HomeIcon, StoreIcon, SparkleIcon } from "@/components/ui/icons";
import { useLocale } from "@/context/LocaleContext";
import type { NavCategory } from "@/lib/api/nav";
import { cn } from "@/lib/cn";
import { CountrySelector } from "./CountrySelector";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";

/**
 * Mobile slide-over navigation with collapsible category groups. Built on
 * Headless UI's Dialog for correct focus trapping and scroll locking.
 */
export function MobileMenu({ categories }: { categories: NavCategory[] }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <Dialog open={open} onClose={setOpen} className="relative z-[90]">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-ink-900/50 duration-200 data-[closed]:opacity-0"
        />
        <DialogPanel
          transition
          className="fixed inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-xl duration-200 data-[closed]:-translate-x-4 data-[closed]:opacity-0"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <span className="text-lg font-bold text-ink-900">
              Sukilo<span className="text-brand-600">.</span>
            </span>
            <CloseButton
              aria-label="Close menu"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
            >
              <CloseIcon className="h-5 w-5" />
            </CloseButton>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            <nav aria-label="Mobile" className="space-y-1">
              <MobileLink href="/" icon={<HomeIcon className="h-5 w-5" />}>
                {t("home")}
              </MobileLink>
              <MobileLink href="/product" icon={<SparkleIcon className="h-5 w-5" />}>
                {t("deals")}
              </MobileLink>
              <MobileLink href="/vendors" icon={<StoreIcon className="h-5 w-5" />}>
                {t("shops")}
              </MobileLink>
            </nav>

            <div className="my-3 border-t border-ink-100" />

            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              {t("all_categories")}
            </p>
            <ul className="space-y-0.5">
              {categories.map((category) => (
                <MobileCategory key={category.id} category={category} />
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-1 border-t border-ink-100 px-3 py-3">
            <CountrySelector />
            <CurrencySelector />
            <LanguageSelector />
          </div>
        </DialogPanel>
      </Dialog>
    </>
  );
}

function MobileLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <CloseButton
      as={Link}
      href={href}
      className="focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-100"
    >
      <span className="text-ink-400">{icon}</span>
      {children}
    </CloseButton>
  );
}

function MobileCategory({ category }: { category: NavCategory }) {
  const [open, setOpen] = useState(false);
  const hasChildren = category.children.length > 0;

  return (
    <li>
      <div className="flex items-center">
        <CloseButton
          as={Link}
          href={`/product?category=${category.id}`}
          className="focus-ring flex-1 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
        >
          {category.name}
        </CloseButton>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? `Collapse ${category.name}` : `Expand ${category.name}`}
            aria-expanded={open}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100"
          >
            <ChevronDownIcon className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        ) : null}
      </div>
      {open && hasChildren ? (
        <ul className="ml-3 border-l border-ink-100 pl-2">
          {category.children.map((child) => (
            <li key={child.id}>
              <CloseButton
                as={Link}
                href={`/product?category=${child.id}`}
                className="focus-ring block rounded-lg px-3 py-1.5 text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-800"
              >
                {child.name}
              </CloseButton>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
