import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { getNavCategories, type NavCategory } from "@/lib/api/nav";
import {
  TruckIcon,
  ShieldCheckIcon,
  RefreshIcon,
  HeadsetIcon,
  MapPinIcon,
} from "@/components/ui/icons";

const TRUST = [
  { icon: TruckIcon, title: "Fast, tracked delivery", text: "Across all supported countries" },
  { icon: ShieldCheckIcon, title: "Secure payments", text: "Buyer protection on every order" },
  { icon: RefreshIcon, title: "Easy returns", text: "7-day return window" },
  { icon: HeadsetIcon, title: "24/7 support", text: "We're here to help, always" },
];

const HELP_LINKS = [
  { href: "/help", label: "Help center" },
  { href: "/product", label: "Track order" },
  { href: "/product", label: "Shipping & delivery" },
  { href: "/product", label: "Returns & refunds" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About Sukilo" },
  { href: "/vendors", label: "Become a seller" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact us" },
];

/** Global footer: trust strip, link columns, newsletter and legal bar. */
export async function Footer() {
  let categories: NavCategory[] = [];
  try {
    categories = (await getNavCategories(0)).slice(0, 8);
  } catch {
    categories = [];
  }

  return (
    <footer className="mt-16 border-t border-ink-200 bg-white">
      {/* Trust strip */}
      <div className="border-b border-ink-100">
        <div className="container-page grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <p className="text-xs text-ink-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-ink-900">
        <div className="container-page flex flex-col items-start gap-4 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-white">Get the best deals first</h2>
            <p className="mt-1 text-sm text-ink-300">
              Join our newsletter for new arrivals, exclusive offers and market updates.
            </p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="container-page grid grid-cols-2 gap-8 py-10 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-500">
            A multi-country, multi-vendor marketplace bringing trusted sellers and products to
            customers worldwide.
          </p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
            <MapPinIcon className="h-4 w-4" />
            Serving Nepal, Bangladesh, China, India & the US
          </p>
        </div>

        <FooterColumn title="Shop by category">
          {categories.map((category) => (
            <FooterLink key={category.id} href={`/product?category=${category.id}`}>
              {category.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Customer service">
          {HELP_LINKS.map((link) => (
            <FooterLink key={link.label} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Company">
          {COMPANY_LINKS.map((link) => (
            <FooterLink key={link.label} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Sell with us">
          <FooterLink href="/vendors">Browse stores</FooterLink>
          <FooterLink href="/vendors">Vendor dashboard</FooterLink>
          <FooterLink href="/product?sort=popularity">Best sellers</FooterLink>
          <FooterLink href="/product?sort=newest">New arrivals</FooterLink>
        </FooterColumn>
      </div>

      {/* Legal bar */}
      <div className="border-t border-ink-100">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Sukilo Marketplace. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="focus-ring rounded hover:text-ink-600">
              Privacy policy
            </Link>
            <Link href="/terms" className="focus-ring rounded hover:text-ink-600">
              Terms of service
            </Link>
            <Link href="/cookies" className="focus-ring rounded hover:text-ink-600">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="focus-ring rounded text-sm text-ink-500 hover:text-brand-700">
        {children}
      </Link>
    </li>
  );
}
