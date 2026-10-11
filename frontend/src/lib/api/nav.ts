import { getCategoryTree } from "./categories";
import type { CategoryTree } from "./types";

/**
 * Lean navigation model for the header mega-menu and footer.
 *
 * `/categories/tree` returns all 5,000 nodes (~800KB), which must never be
 * shipped to the browser. We fetch it on the server and reduce it to a small,
 * serialisable shape: the top-level categories plus a capped sample of children.
 */

export interface NavCategory {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  children: Array<{ id: number; name: string; slug: string }>;
}

export async function getNavCategories(childLimit = 8): Promise<NavCategory[]> {
  const tree = await getCategoryTree({ next: { revalidate: 3600 } });
  return reduceTree(tree, childLimit);
}

export function reduceTree(tree: CategoryTree[], childLimit: number): NavCategory[] {
  return tree.map((root) => ({
    id: root.id,
    name: root.name,
    slug: root.slug ?? String(root.id),
    image_url: root.image_url ?? null,
    children: (root.children ?? []).slice(0, childLimit).map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug ?? String(child.id),
    })),
  }));
}
