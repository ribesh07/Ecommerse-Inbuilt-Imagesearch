import type { ApiEnvelope, Paginated } from "./types";

/**
 * The single point where the backend base URL is resolved. Components must
 * never read `process.env.NEXT_PUBLIC_API_URL` directly — they go through the
 * service layer, which uses this constant.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const API_PREFIX = "/api/v1";

/** Root-relative path for the versioned API. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path}`;
}

/** Resolves backend-relative asset paths (`/uploads/...`) to absolute URLs. */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Error thrown for any non-2xx response or transport failure. Carries the HTTP
 * status so callers/UI can distinguish "not found" from "server error".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serialisable request body. */
  body?: unknown;
  /** Next.js fetch cache/revalidate options. */
  next?: RequestInit["next"];
  signal?: AbortSignal;
}

type QueryValue = string | number | boolean | undefined | null | Array<string | number>;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(","));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Low-level fetch wrapper. Supports both Server Components (pass `next` cache
 * options) and Client Components (aborts via `signal`). It normalises errors
 * into {@link ApiError} and unwraps nothing — callers decide the shape.
 */
export async function request<T>(
  path: string,
  options: RequestOptions & { query?: Record<string, QueryValue> } = {},
): Promise<T> {
  const { body, query, headers, next, ...init } = options;
  const url = `${apiUrl(path)}${buildQuery(query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method: init.method ?? (body ? "POST" : "GET"),
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      next,
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

  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if (isEnvelope<T>(payload)) {
    if (!payload.success) {
      throw new ApiError(payload.message ?? "The request was not successful.", response.status, payload);
    }
    return payload.data;
  }
  return payload as T;
}

/** Convenience helper for paginated list endpoints. */
export function requestPaginated<T>(
  path: string,
  query?: Record<string, QueryValue>,
  options: RequestOptions = {},
): Promise<Paginated<T>> {
  return request<Paginated<T>>(path, { ...options, query });
}

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value
  );
}

function extractErrorMessage(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") {
    return typeof detail === "string" ? detail : null;
  }
  const record = detail as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (Array.isArray(record.detail) && record.detail.length > 0) {
    const first = record.detail[0] as Record<string, unknown> | undefined;
    if (first && typeof first.msg === "string") return first.msg;
  }
  if (typeof record.message === "string") return record.message;
  return null;
}
