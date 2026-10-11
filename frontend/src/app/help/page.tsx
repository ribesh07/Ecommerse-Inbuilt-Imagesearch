import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Help center",
  description: "Get help with orders, delivery, returns and your Sukilo account.",
};

export default function HelpPage() {
  return (
    <ComingSoon
      title="Help center"
      description="Support articles and live chat are not connected yet. The backend exposes no support/ticketing endpoints at this time."
    />
  );
}
