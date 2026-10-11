import { listBrands } from "./brands";
import { listCategories } from "./categories";
import { listVendors } from "./vendors";
import type { ParsedProductParams } from "@/lib/search-params";

/**
 * Best-effort resolution of readable slugs to API ids.
 *
 * The API keys products by numeric ids and exposes no get-by-slug endpoint, so
 * friendly URLs like `/product?category=electronics` are resolved by searching
 * the corresponding list endpoint and matching slug or name exactly. Id-based
 * params need no resolution. Unresolved slugs are dropped (never guessed).
 */
export interface ResolvedFilterIds {
  categoryIds: number[];
  brandIds: number[];
  vendorId?: number;
}

export async function resolveFilterIds(
  parsed: ParsedProductParams,
): Promise<ResolvedFilterIds> {
  const categoryIds = new Set<number>(parsed.categoryIds);
  const brandIds = new Set<number>(parsed.brandIds);
  let vendorId = parsed.vendorId;

  const categorySlugs = new Set(parsed.categorySlugs);
  if (parsed.categorySlug) categorySlugs.add(parsed.categorySlug);
  const brandSlugs = new Set(parsed.brandSlugs);
  if (parsed.brandSlug) brandSlugs.add(parsed.brandSlug);
  const vendorSlug = parsed.vendorSlug;

  await Promise.all([
    ...Array.from(categorySlugs).map(async (slug) => {
      const id = await resolveCategoryId(slug);
      if (id) categoryIds.add(id);
    }),
    ...Array.from(brandSlugs).map(async (slug) => {
      const id = await resolveBrandId(slug);
      if (id) brandIds.add(id);
    }),
    (async () => {
      if (!vendorId && vendorSlug) {
        vendorId = await resolveVendorId(vendorSlug);
      }
    })(),
  ]);

  return {
    categoryIds: Array.from(categoryIds),
    brandIds: Array.from(brandIds),
    vendorId,
  };
}

async function resolveCategoryId(slug: string): Promise<number | null> {
  if (/^\d+$/.test(slug)) return Number.parseInt(slug, 10);
  try {
    const { items } = await listCategories({ q: slug, limit: 20 }, { next: { revalidate: 3600 } });
    const match = items.find((c) => c.slug === slug) ?? items.find((c) => c.name.toLowerCase() === slug.toLowerCase());
    return match?.id ?? null;
  } catch {
    return null;
  }
}

async function resolveBrandId(slug: string): Promise<number | null> {
  if (/^\d+$/.test(slug)) return Number.parseInt(slug, 10);
  try {
    const { items } = await listBrands({ q: slug, limit: 20 }, { next: { revalidate: 3600 } });
    const match = items.find((b) => b.slug === slug) ?? items.find((b) => b.name.toLowerCase() === slug.toLowerCase());
    return match?.id ?? null;
  } catch {
    return null;
  }
}

async function resolveVendorId(slug: string): Promise<number | undefined> {
  if (/^\d+$/.test(slug)) return Number.parseInt(slug, 10);
  try {
    const { items } = await listVendors({ q: slug, limit: 20 }, { next: { revalidate: 3600 } });
    const match = items.find((v) => v.slug === slug) ?? items.find((v) => v.name.toLowerCase() === slug.toLowerCase());
    return match?.id;
  } catch {
    return undefined;
  }
}
