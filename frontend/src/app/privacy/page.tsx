import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Privacy policy"
      description="Our full legal policy is being finalised."
    />
  );
}
