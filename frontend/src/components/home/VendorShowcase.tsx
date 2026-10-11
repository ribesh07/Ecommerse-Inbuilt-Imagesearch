import { SectionHeading } from "./SectionHeading";
import { VendorCard } from "@/components/vendors/VendorCard";
import type { Vendor } from "@/lib/api/types";

/** Featured stores/vendors section. */
export function VendorShowcase({ vendors }: { vendors: Vendor[] }) {
  if (vendors.length === 0) return null;

  return (
    <section aria-labelledby="vendors-heading">
      <SectionHeading
        title="Featured stores"
        subtitle="Verified sellers from around the world"
        href="/vendors"
        linkLabel="All stores"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.slice(0, 6).map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}
