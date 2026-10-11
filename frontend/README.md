# Sukilo — Multi-vendor ecommerce frontend

A production-oriented ecommerce storefront built with **Next.js 16 (App Router)**,
**React 19** and **TypeScript**, consuming the existing FastAPI backend.

It is designed around a multi-country / multi-currency / multi-vendor /
multi-language architecture, with a premium, calm commercial UI and full
loading / error / empty states.

---

## Getting started

```bash
# 1. Ensure the FastAPI backend is running on http://127.0.0.1:8000
# 2. Configure the environment
cp .env.example .env.local        # already present by default

# 3. Install & run
npm install
npm run dev                       # http://localhost:3000
```

Production:

```bash
npm run lint
npm run build
npm start
```

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend (default `http://127.0.0.1:8000`). Never hardcoded in components — read through `src/lib/api/client.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used for canonical/OpenGraph metadata and sitemap. |

---

## Architecture

```
src/
├─ app/                     # App Router pages (mostly Server Components)
│  ├─ layout.tsx            # Root shell: providers, header, footer, SEO metadata
│  ├─ page.tsx              # Home page (streamed, sectioned)
│  ├─ product/
│  │  ├─ page.tsx           # Product listing / search (URL-driven)
│  │  └─ [id]/page.tsx      # Product detail
│  ├─ vendors, cart, wishlist, account, help, about, … 
│  ├─ sitemap.ts, robots.ts, not-found.tsx, error.tsx
├─ components/
│  ├─ layout/               # Header, Footer, selectors, mobile menu, mega menu
│  ├─ home/                 # Hero, categories, brands, deals, vendors, …
│  ├─ search/               # SearchBar + image/voice/barcode dialogs
│  ├─ products/             # ProductCard, gallery, purchase panel, reviews
│  ├─ filters/              # Filter panel, toolbar, pagination, results view
│  ├─ vendors/              # VendorCard
│  └─ ui/                   # Button, Badge, Rating, Modal, Dropdown, icons, …
├─ context/                 # Country / Currency / Locale / Cart / Wishlist
├─ hooks/                   # useDebounce, useVoiceSearch, useBarcodeScanner, …
├─ config/locales.ts        # Single source of truth for markets & currencies
└─ lib/
   ├─ api/                  # client.ts + products/categories/brands/vendors/search
   ├─ format.ts             # Intl-based money/number/date formatting
   ├─ product.ts            # Country price resolution & localisation helpers
   ├─ search-params.ts      # URL ⇄ typed ProductQuery mapping
   ├─ persistent-store.ts   # useSyncExternalStore localStorage utility
   └─ recently-viewed.ts    # Client-only recently-viewed store
```

### Key principles

- **Backend access is isolated.** Every network call goes through
  `src/lib/api/*`; UI components never call `fetch` or read the API URL.
- **The URL is the source of truth** for the listing page. Filters, sorting,
  pagination and search are encoded in query params, so results are shareable
  and server-renderable.
- **Server-first rendering.** Home/listing/detail pages fetch on the server with
  revalidation. Client components are used only where interaction requires them.
- **Country drives everything.** `CountryProvider` → `CurrencyProvider` +
  `LocaleProvider`. Adding a market means editing `src/config/locales.ts`, not
  touching components.

---

## Backend integration

Connected endpoints (all verified against `http://127.0.0.1:8000/docs`):

| Feature | Endpoint(s) |
| --- | --- |
| Product list + filters/sort/pagination | `GET /api/v1/products` |
| Product search | `GET /api/v1/products/search` |
| Featured / latest | `GET /api/v1/products/featured`, `/latest` |
| Filters & facets | `GET /api/v1/products/filters` |
| Product detail / related / variants / vendors / images | `GET /api/v1/products/{id}`, `/related`, `/variants`, `/vendors`, `/images` |
| Reviews | `GET /api/v1/products/{id}/reviews`, `/reviews/summary` |
| Categories | `GET /api/v1/categories`, `/tree`, `/{id}/children`, `/{id}/breadcrumb` |
| Brands | `GET /api/v1/brands`, `/search` |
| Vendors | `GET /api/v1/vendors`, `/search` |

The response envelope `{ success, data, message }` and pagination
`{ page, limit, total, has_next }` are unwrapped centrally in
`src/lib/api/client.ts`.

### Pricing

Product **detail** returns country-specific prices (`prices[]` — NP/NPR, BD/BDT,
CN/CNY). The UI always prefers the backend price for the active country. Only
when no matching country price exists does it fall back to a **display-only** FX
conversion using static rates in `src/config/locales.ts` (clearly flagged in the
UI as approximate).

---

## Features & status

### Fully functional
- Premium home page with all 17 sections
- Product listing with category / brand / store / price / rating / availability /
  attribute filters, 8 sort options, grid & list views, pagination
- Text search with debounced autocomplete (products + categories + brands),
  recent & popular searches
- Product detail: gallery, country pricing, variants, vendor offers,
  specifications, reviews, related products
- Store listings, cart, wishlist (persisted client-side)
- Country / currency / language selectors driving formatting and content
- Loading skeletons, error states and empty states everywhere
- SEO metadata, OpenGraph, sitemap, robots

### Front-end complete, awaiting backend support
- **Image search** — full UI (pick / preview / remove / submit) + `searchByImage()`
  service abstraction. The API exposes no visual-search endpoint yet; the dialog
  reports this honestly instead of faking results. TODO marked in
  `src/lib/api/search.ts`.
- **Barcode search** — live camera scanning via `@zxing/browser` plus manual
  entry. No dedicated barcode endpoint exists, so lookups bridge through product
  search. TODO marked for `GET /products/barcode/{code}`.
- **Voice search** — fully working via the browser Web Speech API (client-side
  STT, no paid service); the transcript feeds the normal search endpoint.
- **Country-scoped catalogs** — sending `country_code` to the list endpoint is
  not yet honoured by the backend; price/localisation already work per-country.
- **Cart checkout, auth, newsletter, support** — front-end abstractions ready,
  no backend endpoints exist yet.

---

## Notes

- Next.js is configured with `images.remotePatterns` for `picsum.photos` and the
  local backend, so product imagery is optimised without layout shift.
- The category tree endpoint returns ~5,000 nodes (~800 KB); it is reduced
  server-side (`src/lib/api/nav.ts`) to a small navigable shape before it ever
  reaches the client.
