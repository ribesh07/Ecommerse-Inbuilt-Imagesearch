import { listBrands } from "./brands";
import { listCategories } from "./categories";
import {
  API_BASE_URL,
  API_PREFIX,
  ApiError,
  extractErrorMessage,
  isEnvelope,
  request,
  type RequestOptions,
} from "./client";
import { searchProducts } from "./products";
import type { ApiEnvelope, Brand, Category, Paginated, ProductListItem } from "./types";

/**
 * Raised when a search mode has a complete front-end experience but no
 * corresponding backend endpoint yet. The UI uses `feature` to render a
 * helpful, honest message instead of faking results.
 */
export class FeatureUnavailableError extends Error {
  readonly feature: string;
  constructor(feature: string, message: string) {
    super(message);
    this.name = "FeatureUnavailableError";
    this.feature = feature;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Text search + autocomplete                     */
/* -------------------------------------------------------------------------- */

export interface SearchSuggestions {
  products: ProductListItem[];
  categories: Category[];
  brands: Brand[];
}

/**
 * Aggregated autocomplete. The API has no dedicated suggestion endpoint, so we
 * fan out to the existing list/search endpoints with a small page size. The
 * caller (see `useSearchSuggestions`) debounces input before calling this.
 */
export async function getSearchSuggestions(
  q: string,
  options: RequestOptions = {},
): Promise<SearchSuggestions> {
  const term = q.trim();
  if (!term) return { products: [], categories: [], brands: [] };

  const [products, categories, brands] = await Promise.all([
    searchProducts(term, { limit: 5 }, options),
    listCategories({ q: term, limit: 5 }, options),
    listBrands({ q: term, limit: 5 }, options),
  ]);

  return {
    products: products.items,
    categories: categories.items,
    brands: brands.items,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Image search                              */
/* -------------------------------------------------------------------------- */

/**
 * Visual product search.
 *
 * Posts the uploaded image to the backend `POST /api/v1/products/search/image`
 * endpoint using `multipart/form-data`. The browser generates the boundary,
 * so we must NOT set `Content-Type` manually.
 */
export async function searchByImage(
  file: File,
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  const form = new FormData();
  form.append("file", file);

  const url = `${API_BASE_URL}${API_PREFIX}/products/search/image`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: form,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      "Unable to reach the server. Please check your connection and try again.",
      0,
      error,
    );
  }

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => undefined);
    }
    throw new ApiError(
      extractErrorMessage(detail) ?? `Request failed with status ${response.status}`,
      response.status,
      detail,
    );
  }

  const payload = (await response.json()) as ApiEnvelope<Paginated<ProductListItem>>;
  if (isEnvelope(payload)) {
    if (!payload.success) {
      throw new ApiError(payload.message ?? "The request was not successful.", response.status, payload);
    }
    return payload.data;
  }
  return payload as Paginated<ProductListItem>;
}

/* -------------------------------------------------------------------------- */
/*                                  Voice search                              */
/* -------------------------------------------------------------------------- */

/**
 * Voice search itself happens in the browser (Web Speech API — see
 * `src/hooks/useVoiceSearch.ts`). Once speech is transcribed to text we use the
 * standard product search endpoint, so no backend changes are required.
 */
export function searchByVoice(
  transcript: string,
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  return searchProducts(transcript.trim(), { limit: 24 }, options);
}

/* -------------------------------------------------------------------------- */
/*                                 Barcode search                             */
/* -------------------------------------------------------------------------- */

/**
 * Barcode lookup.
 *
 * TODO(backend): There is no dedicated barcode endpoint. Barcodes are exposed
 * on product detail (`barcode`) and variants, and the general search does not
 * index them. As a best-effort bridge we query the search endpoint; when a real
 * endpoint exists (e.g. `GET /api/v1/products/barcode/{code}`) swap it in here.
 */
export function searchByBarcode(
  code: string,
  options: RequestOptions = {},
): Promise<Paginated<ProductListItem>> {
  const normalized = code.trim();
  if (!normalized) {
    return Promise.resolve({
      items: [],
      pagination: { limit: 0, page: 1, total: 0, has_next: false },
    });
  }
  return searchProducts(normalized, { limit: 24 }, options);
}

/* -------------------------------------------------------------------------- */
/*                         Popular searches (placeholder)                     */
/* -------------------------------------------------------------------------- */

/**
 * Popular searches are a front-end placeholder: the API exposes no trending
 * endpoint. Kept in one place so it can be replaced by a real endpoint later.
 */
export const POPULAR_SEARCHES: string[] = [
  "backpack",
  "bluetooth speaker",
  "wireless headphones",
  "smart watch",
  "running shoes",
  "laptop",
];

/** Thin re-export so callers can hit raw product search without extra imports. */
export { searchProducts };

/** Explicit re-export for advanced callers that need the base request helper. */
export { request };
