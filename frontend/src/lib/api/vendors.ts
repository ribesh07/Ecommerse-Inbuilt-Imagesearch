import { request, requestPaginated, type RequestOptions } from "./client";
import type { Paginated, ProductListItem, Vendor } from "./types";

/** GET /api/v1/vendors */
export function listVendors(
  { page = 1, limit = 24, q }: { page?: number; limit?: number; q?: string } = {},
  options: RequestOptions = {},
): Promise<Paginated<Vendor>> {
  return requestPaginated<Vendor>("/vendors", { page, limit, q }, options);
}

/** GET /api/v1/vendors/search */
export function searchVendors(
  q: string,
  { page = 1, limit = 24 }: { page?: number; limit?: number } = {},
  options: RequestOptions = {},
): Promise<Paginated<Vendor>> {
  return requestPaginated<Vendor>("/vendors/search", { q, page, limit }, options);
}

/** GET /api/v1/vendors/{id} */
export function getVendor(id: number, options: RequestOptions = {}): Promise<Vendor> {
  return request<Vendor>(`/vendors/${id}`, options);
}

/** GET /api/v1/vendors/{id}/products */
export function getVendorProducts(
  id: number,
  { page = 1, limit = 24 }: { page?: number; limit?: number } = {},
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return requestPaginated<ProductListItem>(
    `/vendors/${id}/products`,
    { page, limit },
    options,
  );
}
