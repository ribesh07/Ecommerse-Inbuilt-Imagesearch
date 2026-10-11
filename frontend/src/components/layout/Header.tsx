import Link from "next/link";
import { getNavCategories, type NavCategory } from "@/lib/api/nav";
import { SearchBar } from "@/components/search/SearchBar";
import { CartButton } from "./CartButton";
import { WishlistButton } from "./WishlistButton";
import { CountrySelector } from "./CountrySelector";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { CategoryMegaMenu } from "./CategoryMegaMenu";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "./Logo";
import { UserIcon, HeadsetIcon, TruckIcon, StoreIcon, SparkleIcon, ChevronRightIcon } from "@/components/ui/icons";

/**
 * Global site header. Server component: it fetches the (reduced) category tree
 * once and hands it to the interactive client pieces (search, menus, selectors).
 * The header never blocks rendering if the API is unavailable.
 */
export async function Header() {
  let categories: NavCategory[] = [];
  try {
    categories = await getNavCategories(8);
  } catch {
    categories = [];
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
      {/* Top utility bar (desktop) */}
      <div className="hidden border-b border-ink-100 bg-ink-50 lg:block">
        <div className="container-page flex h-10 items-center justify-between text-xs text-ink-500">
          <div className="flex items-center gap-1">
            <CountrySelector compact />
            <span className="text-ink-300">|</span>
            <CurrencySelector compact />
            <span className="text-ink-300">|</span>
            <LanguageSelector compact />
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <TruckIcon className="h-4 w-4" /> Free delivery over threshold
            </span>
            <Link href="/vendors" className="focus-ring flex items-center gap-1.5 rounded hover:text-ink-800">
              <StoreIcon className="h-4 w-4" /> Sell on Sukilo
            </Link>
            <Link href="/help" className="focus-ring flex items-center gap-1.5 rounded hover:text-ink-800">
              <HeadsetIcon className="h-4 w-4" /> Help center
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container-page flex h-16 items-center gap-3">
        <MobileMenu categories={categories} />
        <Logo className="shrink-0" />

        <div className="ml-2 hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/account"
            className="focus-ring hidden h-10 items-center gap-2 rounded-lg px-2 text-sm text-ink-700 hover:bg-ink-100 sm:flex"
          >
            <UserIcon className="h-5 w-5" />
            <span className="hidden xl:inline">Sign in</span>
          </Link>
          <WishlistButton />
          <CartButton />
        </div>
      </div>

      {/* Mobile search row */}
      <div className="container-page pb-3 md:hidden">
        <SearchBar variant="md" />
      </div>

      {/* Category / nav row (desktop) */}
      <div className="hidden border-t border-ink-100 lg:block">
        <div className="container-page flex h-11 items-center gap-1">
          <CategoryMegaMenu categories={categories} />
          <nav aria-label="Primary" className="ml-2 flex items-center gap-1 text-sm">
            <HeaderLink href="/product?sort=newest">New arrivals</HeaderLink>
            <HeaderLink href="/product?sort=price_asc">Best value</HeaderLink>
            <HeaderLink href="/product?sort=rating">Top rated</HeaderLink>
            <HeaderLink href="/vendors">Stores</HeaderLink>
          </nav>
          <Link
            href="/product?sort=popularity"
            className="focus-ring ml-auto flex items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <SparkleIcon className="h-4 w-4" />
            Today&apos;s deals
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring rounded-lg px-3 py-1.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
    >
      {children}
    </Link>
  );
}
