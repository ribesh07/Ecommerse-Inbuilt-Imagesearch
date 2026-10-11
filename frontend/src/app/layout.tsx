import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sukilo — Multi-vendor marketplace for every country",
    template: "%s | Sukilo",
  },
  description:
    "Sukilo is a multi-country, multi-vendor marketplace. Shop thousands of products from trusted sellers in your local currency, with fast delivery and buyer protection.",
  keywords: [
    "marketplace",
    "online shopping",
    "multi-vendor",
    "electronics",
    "fashion",
    "Nepal",
    "Bangladesh",
    "China",
  ],
  applicationName: "Sukilo",
  openGraph: {
    type: "website",
    siteName: "Sukilo",
    title: "Sukilo — Multi-vendor marketplace for every country",
    description:
      "Shop thousands of products from trusted sellers in your local currency, with fast delivery and buyer protection.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Sukilo — Multi-vendor marketplace",
    description:
      "Shop thousands of products from trusted sellers in your local currency.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">
        <AppProviders>
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
