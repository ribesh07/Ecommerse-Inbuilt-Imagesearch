"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MailIcon, CheckIcon } from "@/components/ui/icons";

/**
 * Newsletter signup. The API exposes no subscription endpoint yet, so this is a
 * front-end-only form: it validates the email and confirms locally.
 *
 * TODO(backend): POST the address to a subscriptions endpoint when available.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setDone(true);
    setEmail("");
  };

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm text-white">
        <CheckIcon className="h-4 w-4" />
        You&apos;re subscribed. Watch your inbox for offers.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className="focus-ring h-11 w-full rounded-lg border border-transparent bg-white pl-9 pr-3 text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
        </div>
        <Button type="submit" variant="secondary" className="h-11 bg-ink-900 hover:bg-ink-800">
          Subscribe
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
