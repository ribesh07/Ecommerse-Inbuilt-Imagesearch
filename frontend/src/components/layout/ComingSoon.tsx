import { ButtonLink } from "@/components/ui/Button";
import { SparkleIcon } from "@/components/ui/icons";

/**
 * Honest placeholder for routes that are linked from the UI but have no
 * backend/feature yet. It states clearly that the page is not built instead of
 * pretending to be functional.
 */
export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <SparkleIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">{description}</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/" variant="outline" size="sm">
            Back to home
          </ButtonLink>
          <ButtonLink href="/product" size="sm">
            Shop products
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
