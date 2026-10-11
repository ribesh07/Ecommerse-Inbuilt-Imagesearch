import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <ComingSoon
      title="Cookie policy"
      description="Details about how we use cookies are coming soon."
    />
  );
}
