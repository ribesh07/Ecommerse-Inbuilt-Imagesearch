import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at Sukilo.",
};

export default function CareersPage() {
  return (
    <ComingSoon
      title="Careers at Sukilo"
      description="We're not listing open roles here yet. Check back soon."
    />
  );
}
