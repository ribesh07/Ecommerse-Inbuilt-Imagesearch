import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "About Sukilo",
  description: "Learn about Sukilo, a multi-country, multi-vendor marketplace.",
};

export default function AboutPage() {
  return (
    <ComingSoon
      title="About Sukilo"
      description="Our story page is on the way. Sukilo is a multi-country, multi-vendor marketplace built to connect trusted sellers with customers worldwide."
    />
  );
}
