import Link from "next/link";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatNumber } from "@/lib/format";
import type { Review, ReviewSummary } from "@/lib/api/types";

/** Review summary histogram plus the paginated review list. */
export function ProductReviews({
  summary,
  reviews,
  language,
}: {
  summary: ReviewSummary | null;
  reviews: Review[];
  language: string;
}) {
  if (!summary && reviews.length === 0) {
    return (
      <p className="text-sm text-ink-500">No reviews yet. Be the first to review this product.</p>
    );
  }

  const distribution = summary?.distribution ?? {};
  const total = summary?.total_reviews ?? reviews.length;

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      {summary ? (
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink-900">
              {summary.average_rating.toFixed(1)}
            </span>
            <span className="text-sm text-ink-400">/ 5</span>
          </div>
          <Rating value={summary.average_rating} className="mt-1" />
          <p className="mt-1 text-xs text-ink-500">
            {formatNumber(total, language)} verified reviews
          </p>

          <ul className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[String(star)] ?? 0;
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <li key={star} className="flex items-center gap-2 text-xs text-ink-500">
                  <span className="w-3 text-right">{star}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-8 text-right">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-4">
        {reviews.length === 0 ? (
          <li className="text-sm text-ink-500">No written reviews yet.</li>
        ) : (
          reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-ink-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <Rating value={review.rating} />
                <span className="text-xs text-ink-400">{formatDate(review.created_at, language)}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-ink-900">{review.title}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{review.review}</p>
              {review.is_verified_purchase ? (
                <div className="mt-2">
                  <Badge tone="success">Verified purchase</Badge>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/** Vendor offers for this product, when competing sellers exist. */
export function ProductVendors({
  vendors,
  language,
}: {
  vendors: Array<{ id: number; name: string; slug?: string; price: string; stock: number }>;
  language: string;
}) {
  if (vendors.length === 0) return null;

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink-900">Available from these sellers</h2>
      <ul className="divide-y divide-ink-100">
        {vendors.map((vendor) => (
          <li key={vendor.id} className="flex items-center justify-between gap-4 py-2.5">
            <Link
              href={`/product?vendor_id=${vendor.id}`}
              className="focus-ring rounded text-sm font-medium text-ink-800 hover:text-brand-700"
            >
              {vendor.name}
            </Link>
            <div className="text-right">
              <p className="text-sm font-semibold text-ink-900">
                {formatNumber(Number.parseFloat(vendor.price), language, {
                  style: "decimal",
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-ink-400">{vendor.stock > 0 ? `${vendor.stock} in stock` : "Unavailable"}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
