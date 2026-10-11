import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your Sukilo account.",
};

export default function AccountPage() {
  return (
    <ComingSoon
      title="Your account"
      description="Authentication is not available yet — the API does not expose sign-in or account endpoints. Your cart and wishlist are saved locally on this device in the meantime."
    />
  );
}
