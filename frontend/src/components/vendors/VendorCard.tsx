import Image from "next/image";
import Link from "next/link";
import { StoreIcon } from "@/components/ui/icons";
import { formatNumber } from "@/lib/format";
import type { Vendor } from "@/lib/api/types";

/** Vendor/store card used on the home showcase and store listings. */
export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      href={`/product?vendor_id=${vendor.id}`}
      className="focus-ring group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 transition-shadow hover:shadow-md"
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ink-50">
        {vendor.logo_url ? (
          <Image src={vendor.logo_url} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-400">
            <StoreIcon className="h-6 w-6" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
          {vendor.name}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
          {vendor.country_code ? <span>{vendor.country_code}</span> : null}
          {typeof vendor.product_count === "number" ? (
            <span>{formatNumber(vendor.product_count)} products</span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
