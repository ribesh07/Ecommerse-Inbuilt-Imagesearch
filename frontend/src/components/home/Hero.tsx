import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, TruckIcon, ShieldCheckIcon, StarIcon } from "@/components/ui/icons";
import type { ProductListItem } from "@/lib/api/types";

/**
 * Home hero. Calm, editorial layout: value proposition on the left, a small
 * product mosaic on the right. The mosaic uses real featured products so it
 * never looks like a stock template.
 */
export function Hero({ products }: { products: ProductListItem[] }) {
  const mosaic = products.filter((p) => p.thumbnail).slice(0, 4);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-ink-50 to-white">
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <StarIcon className="h-3.5 w-3.5" filled />
            Trusted by shoppers in 5 countries
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
            Everything you need, from sellers you can trust
          </h1>
          <p className="mt-4 max-w-lg text-base text-ink-600">
            Shop across thousands of verified vendors in your local currency, with fast delivery and
            buyer protection on every order.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/product" size="lg">
              Start shopping
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/product?sort=popularity" size="lg" variant="outline">
              Explore top deals
            </ButtonLink>
          </div>

          <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-ink-200 pt-6">
            <Stat icon={<TruckIcon className="h-4 w-4" />} label="Fast delivery" />
            <Stat icon={<ShieldCheckIcon className="h-4 w-4" />} label="Secure checkout" />
            <Stat icon={<StarIcon className="h-4 w-4" filled />} label="Top rated" />
          </dl>
        </div>

        {mosaic.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden>
            {mosaic.map((product, index) => (
              <div
                key={product.id}
                className={`relative overflow-hidden rounded-xl border border-ink-200 bg-white ${
                  index % 2 === 1 ? "mt-4 sm:mt-6" : ""
                }`}
              >
                <div className="relative aspect-square">
                  <Image
                    src={product.thumbnail as string}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 40vw, 240px"
                    className="object-cover"
                    priority={index < 2}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3">
                  <p className="line-clamp-1 text-xs font-medium text-white">{product.name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
    </div>
  );
}
