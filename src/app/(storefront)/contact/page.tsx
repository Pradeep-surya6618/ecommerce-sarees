import Link from "next/link";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Contact us · Saree Store",
  description: "Reach our team — email, phone, walk-in address and trade enquiries.",
};

interface Row {
  label: string;
  value: string;
  href?: string;
}

export default async function ContactPage() {
  const settings = await siteSettingsRepo.get();
  const { storeProfile, visit } = settings;

  // Walk-in is the footer Visit address — falls back to the legal address on
  // the Store Profile if the admin only filled one of the two.
  const walkInParts = [visit.addressLine1, visit.addressLine2].filter(Boolean);
  const walkInAddress = walkInParts.join(", ") || storeProfile.address;

  const rows: Row[] = [];
  if (storeProfile.email) {
    rows.push({
      label: "Email",
      value: storeProfile.email,
      href: `mailto:${storeProfile.email}`,
    });
  }
  if (storeProfile.phone) {
    rows.push({
      label: "Phone / WhatsApp",
      value: storeProfile.phone,
      // Strip everything except + and digits so tel: URIs work everywhere.
      href: `tel:${storeProfile.phone.replace(/[^\d+]/g, "")}`,
    });
  }
  if (walkInAddress) {
    rows.push({ label: "Walk-in", value: walkInAddress });
  }
  if (visit.hours) {
    rows.push({ label: "Hours", value: visit.hours });
  }

  return (
    <Container size="md" className="py-10 sm:py-14">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact us" }]} />

      <header className="mt-5 flex flex-col gap-2 sm:mt-6 sm:gap-3">
        <h1 className="font-display text-2xl text-ink-900 sm:text-3xl md:text-5xl">Contact us</h1>
        <p className="text-sm leading-relaxed text-ink-700 sm:text-base">
          We respond within one working day. Often the same hour.
        </p>
      </header>

      <section className="mt-10 flex flex-col gap-4 sm:mt-12 sm:gap-5">
        <h2 className="font-display text-xl text-ink-900 sm:text-2xl md:text-3xl">Reach us</h2>
        {rows.length === 0 ? (
          // Settings unset yet — keep the page from going totally blank.
          <p className="text-sm text-ink-500">Contact details coming soon.</p>
        ) : (
          <ul className="flex flex-col gap-2 sm:gap-3">
            {rows.map((row) => (
              <li
                key={row.label}
                className="flex flex-col gap-0.5 text-sm leading-relaxed text-ink-700 sm:flex-row sm:items-center sm:gap-2 sm:text-base"
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden className="h-1 w-1 rounded-full bg-accent-gold" />
                  <span className="font-semibold text-ink-900">{row.label}</span>
                  <span className="text-ink-500">—</span>
                </span>
                {row.href ? (
                  <a href={row.href} className="text-accent-primary transition hover:underline">
                    {row.value}
                  </a>
                ) : (
                  <span>{row.value}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {storeProfile.wholesaleEmail && (
        <section className="mt-10 flex flex-col gap-3 sm:mt-12 sm:gap-4">
          <h2 className="font-display text-xl text-ink-900 sm:text-2xl md:text-3xl">
            Wholesale &amp; press
          </h2>
          <p className="text-sm leading-relaxed text-ink-700 sm:text-base">
            For trade enquiries, write to{" "}
            <Link
              href={`mailto:${storeProfile.wholesaleEmail}`}
              className="font-semibold text-accent-primary transition hover:underline"
            >
              {storeProfile.wholesaleEmail}
            </Link>{" "}
            with your business details and we will get back to you with the catalogue and pricing.
          </p>
        </section>
      )}
    </Container>
  );
}
