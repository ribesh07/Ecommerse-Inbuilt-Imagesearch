import { request, requestPaginated, type RequestOptions } from "./client";
import type { Category, CategoryTree, Paginated, ProductFilters } from "./types";

/** GET /api/v1/categories */
export function listCategories(
  {
    page = 1,
    limit = 50,
    parent_id,
    q,
  }: { page?: number; limit?: number; parent_id?: number; q?: string } = {},
  options: RequestOptions = {},
): Promise<Paginated<Category>> {
  return requestPaginated<Category>(
    "/categories",
    { page, limit, parent_id, q },
    options,
  );
}

/** GET /api/v1/categories/tree — full nested tree (top-level roots). */
export function getCategoryTree(options: RequestOptions = {}): Promise<CategoryTree[]> {
  return request<CategoryTree[]>("/categories/tree", options);
}

/** GET /api/v1/categories/{id} */
export function getCategory(
  id: number,
  options: RequestOptions = {},
): Promise<Category> {
  return request<Category>(`/categories/${id}`, options);
}

/** GET /api/v1/categories/{id}/children */
export function getCategoryChildren(
  id: number,
  options: RequestOptions = {},
): Promise<Category[]> {
  return request<Category[]>(`/categories/${id}/children`, options);
}

/** GET /api/v1/categories/{id}/breadcrumb */
export function getCategoryBreadcrumb(
  id: number,
  options: RequestOptions = {},
): Promise<Category[]> {
  return request<Category[]>(`/categories/${id}/breadcrumb`, options);
}

/** GET /api/v1/products/filters — available facets for a product query. */
export function getProductFilters(
  params: {
    category_id?: number;
    brand_id?: number;
    min_price?: number;
    max_price?: number;
    q?: string;
  } = {},
  options: RequestOptions = {},
): Promise<ProductFilters> {
  return request<ProductFilters>("/products/filters", { ...options, query: params });
}
