import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-ink-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/" variant="outline">
          Go home
        </ButtonLink>
        <ButtonLink href="/product">Browse products</ButtonLink>
      </div>
      <Link href="/help" className="focus-ring mt-4 rounded text-sm text-brand-700 hover:underline">
        Need help?
      </Link>
    </div>
  );
}
