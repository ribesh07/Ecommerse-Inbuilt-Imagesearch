import { request, requestPaginated, type RequestOptions } from "./client";
import type { Brand, Paginated, ProductListItem } from "./types";

/** GET /api/v1/brands */
export function listBrands(
  { page = 1, limit = 24, q }: { page?: number; limit?: number; q?: string } = {},
  options: RequestOptions = {},
): Promise<Paginated<Brand>> {
  return requestPaginated<Brand>("/brands", { page, limit, q }, options);
}

/** GET /api/v1/brands/search */
export function searchBrands(
  q: string,
  { page = 1, limit = 24 }: { page?: number; limit?: number } = {},
  options: RequestOptions = {},
): Promise<Paginated<Brand>> {
  return requestPaginated<Brand>("/brands/search", { q, page, limit }, options);
}

/** GET /api/v1/brands/{id} */
export function getBrand(id: number, options: RequestOptions = {}): Promise<Brand> {
  return request<Brand>(`/brands/${id}`, options);
}

/** GET /api/v1/brands/{id}/products */
export function getBrandProducts(
  id: number,
  { page = 1, limit = 24 }: { page?: number; limit?: number } = {},
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return requestPaginated<ProductListItem>(
    `/brands/${id}/products`,
    { page, limit },
    options,
  );
}
