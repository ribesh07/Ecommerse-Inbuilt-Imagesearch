import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "./SectionHeading";
import type { Brand } from "@/lib/api/types";

/** Popular brands strip. Renders only when brand data is available. */
export function PopularBrands({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="brands-heading">
      <SectionHeading title="Popular brands" subtitle="Top sellers across the marketplace" href="/product" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {brands.slice(0, 12).map((brand) => (
          <Link
            key={brand.id}
            href={`/product?brand=${brand.id}`}
            className="focus-ring flex flex-col items-center gap-2 rounded-xl border border-ink-200 bg-white p-3 transition-shadow hover:shadow-md"
          >
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-ink-50">
              {brand.logo_url ? (
                <Image
                  src={brand.logo_url}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <p className="line-clamp-1 w-full text-center text-xs font-medium text-ink-700">
              {brand.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
