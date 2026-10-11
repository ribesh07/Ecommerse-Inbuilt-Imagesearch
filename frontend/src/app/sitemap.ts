import type { MetadataRoute } from "next";
import { getNavCategories } from "@/lib/api/nav";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Dynamic sitemap. The catalogue is huge (200k+ products), so we include the
 * static routes plus top-level category landing pages rather than every product.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = ["", "/product", "/vendors"].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getNavCategories(0);
    categoryRoutes = categories.map((category) => ({
      url: `${SITE}/product?category=${category.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    categoryRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes];
}
