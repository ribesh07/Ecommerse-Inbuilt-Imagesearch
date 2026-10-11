/** Tiny className combiner (keeps JSX readable without a dependency). */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
