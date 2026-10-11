import {
  TruckIcon,
  ShieldCheckIcon,
  RefreshIcon,
  HeadsetIcon,
} from "@/components/ui/icons";

const BENEFITS = [
  {
    icon: TruckIcon,
    title: "Fast, tracked delivery",
    text: "Reliable shipping with real-time tracking in every market we serve.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure payments",
    text: "Your transactions are encrypted and protected end to end.",
  },
  {
    icon: RefreshIcon,
    title: "Easy 7-day returns",
    text: "Changed your mind? Return eligible items within seven days.",
  },
  {
    icon: HeadsetIcon,
    title: "Dedicated support",
    text: "Our team is available around the clock to help with any order.",
  },
];

/** Trust/service benefits band. */
export function TrustBenefits() {
  return (
    <section aria-label="Why shop with us" className="rounded-2xl border border-ink-200 bg-white p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <benefit.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink-900">{benefit.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{benefit.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
