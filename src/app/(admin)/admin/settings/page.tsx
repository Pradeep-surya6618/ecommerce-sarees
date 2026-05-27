import {
  AlertCircle,
  Building2,
  CreditCard,
  Key,
  MapPin,
  Megaphone,
  Percent,
  Plug,
  Receipt,
  Share2,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { AnnouncementBarEditor } from "@/components/admin/AnnouncementBarEditor";
import { ShippingEditor } from "@/components/admin/ShippingEditor";
import { SocialLinksEditor } from "@/components/admin/SocialLinksEditor";
import { StoreProfileEditor } from "@/components/admin/StoreProfileEditor";
import { VisitEditor } from "@/components/admin/VisitEditor";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Settings · Admin" };

const TAX = {
  gstRate: "5%",
  appliesTo: "All sarees and ethnic wear (HSN 5407, 5408, 5208)",
};

const KEYS: { label: string; value: string; status: "demo" | "missing" }[] = [
  { label: "Razorpay key id", value: "rzp_test_•••••••••• (demo)", status: "demo" },
  { label: "Razorpay webhook secret", value: "•••••••••• (demo)", status: "demo" },
  { label: "Shiprocket API token", value: "Not connected", status: "missing" },
  { label: "SES SMTP credentials", value: "Not connected", status: "missing" },
];

interface SectionProps {
  title: string;
  hint?: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

function Section({ title, hint, icon: Icon, children }: SectionProps) {
  return (
    <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
      />
      <header className="mb-4 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
            {title}
          </span>
          {hint && <p className="text-[11px] leading-tight text-ink-500 sm:text-xs">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

interface InfoFieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}

function InfoField({ icon: Icon, label, value, mono }: InfoFieldProps) {
  return (
    <div className="flex items-start gap-3 overflow-hidden rounded-xl border border-ink-500/10 bg-bg-base/60 p-3 transition hover:border-ink-500/20 hover:bg-bg-base sm:p-3.5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.05] text-ink-700 sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink-500 sm:text-[10px]">
          {label}
        </span>
        <span
          className={
            "min-w-0 break-words text-[12px] leading-snug text-ink-900 sm:text-sm " +
            (mono ? "font-mono" : "")
          }
        >
          {value}
        </span>
      </div>
    </div>
  );
}
// InfoField is still used by the (read-only) Tax / Shipping / Integrations
// sections below — keep it around even though Store Profile no longer needs it.

export default async function AdminSettingsPage() {
  const settings = await siteSettingsRepo.get();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl text-ink-900 sm:text-3xl">Settings</h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          Store profile, tax, shipping, and integration keys. Editable in a later backend phase.
        </p>
      </header>

      <Section
        title="Announcement bar"
        hint="The headline strip at the very top of every storefront page."
        icon={Megaphone}
      >
        <AnnouncementBarEditor initial={settings.announcement} />
      </Section>

      <Section
        title="Social links"
        hint="Icons shown in the footer. Empty fields are hidden — clear them all to remove the row."
        icon={Share2}
      >
        <SocialLinksEditor initial={settings.social} />
      </Section>

      <Section
        title="Visit"
        hint="The address + hours block shown in the footer “Visit” column."
        icon={MapPin}
      >
        <VisitEditor initial={settings.visit} />
      </Section>

      <Section
        title="Store profile"
        hint="Legal identifiers and contact details shown on /contact and invoices."
        icon={Building2}
      >
        <StoreProfileEditor initial={settings.storeProfile} />
      </Section>

      <Section title="Tax" hint="GST applied at checkout." icon={Percent}>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          <InfoField icon={Percent} label="GST rate" value={TAX.gstRate} />
          <InfoField icon={Receipt} label="Applies to" value={TAX.appliesTo} />
        </div>
      </Section>

      <Section title="Shipping" hint="Rates and thresholds applied at checkout." icon={Truck}>
        <ShippingEditor initial={settings.shipping} />
      </Section>

      <Section
        title="Integrations"
        hint="Third-party services wired in a later backend phase."
        icon={Plug}
      >
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {KEYS.map((k) => (
            <div
              key={k.label}
              className="flex items-start gap-3 overflow-hidden rounded-xl border border-ink-500/10 bg-bg-base/60 p-3 sm:p-3.5"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.05] text-ink-700 sm:h-10 sm:w-10">
                {k.status === "demo" ? (
                  <CreditCard className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                ) : (
                  <Key className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink-500 sm:text-[10px]">
                  {k.label}
                </span>
                <span className="min-w-0 break-all font-mono text-[11px] leading-snug text-ink-900 sm:text-xs">
                  {k.value}
                </span>
              </div>
              <Badge
                tone={k.status === "demo" ? "gold" : "danger"}
                className="!px-1.5 !py-0.5 !text-[9px] !tracking-wider sm:!px-2 sm:!text-[10px]"
              >
                {k.status === "demo" ? "Demo" : "Missing"}
              </Badge>
            </div>
          ))}
        </div>
      </Section>

      <p className="flex items-start gap-2 rounded-xl border border-accent-gold/30 bg-accent-gold/[0.06] px-3 py-2 text-[10px] text-ink-700 sm:px-4 sm:py-3 sm:text-xs">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-gold" />
        <span>
          Editing settings, key rotation, and webhook configuration arrive when the backend phase
          wires real Razorpay, Shiprocket, and SES.
        </span>
      </p>
    </div>
  );
}
