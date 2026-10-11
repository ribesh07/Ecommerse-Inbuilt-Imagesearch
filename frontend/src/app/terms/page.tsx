import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms of service"
      description="Our full terms are being finalised."
    />
  );
}
