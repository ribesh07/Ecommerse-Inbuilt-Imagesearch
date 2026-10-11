import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "./SectionHeading";
import type { NavCategory } from "@/lib/api/nav";

/** Featured categories grid. Uses the reduced category tree (real data). */
export function FeaturedCategories({ categories }: { categories: NavCategory[] }) {
  if (categories.length === 0) return null;
  const shown = categories.slice(0, 10);

  return (
    <section aria-labelledby="categories-heading">
      <SectionHeading
        title="Shop by category"
        subtitle="Browse our most popular departments"
        href="/product"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((category) => (
          <Link
            key={category.id}
            href={`/product?category=${category.id}`}
            className="focus-ring group overflow-hidden rounded-xl border border-ink-200 bg-white transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-ink-50">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
            </div>
            <div className="p-2.5">
              <p className="line-clamp-1 text-sm font-semibold text-ink-900">{category.name}</p>
              <p className="text-xs text-ink-400">
                {category.children.length > 0
                  ? `${category.children.length}+ subcategories`
                  : "Explore products"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
