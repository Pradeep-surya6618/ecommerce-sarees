import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { AnnouncementBarEditor } from "@/components/admin/AnnouncementBarEditor";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Settings · Admin" };

const STORE = {
  legalName: "Saree Store Private Limited",
  tradeName: "Saree Store",
  gstNumber: "29ABCDE1234F1Z5",
  pan: "ABCDE1234F",
  contactEmail: "hello@sareestore.example",
  phone: "+91 80 4567 8901",
  addressLine: "27 Lavelle Road, Bengaluru 560001, KA",
};

const TAX = {
  gstRate: "5%",
  appliesTo: "All sarees and ethnic wear (HSN 5407, 5408, 5208)",
};

const SHIPPING = {
  freeShippingThreshold: "₹2,000",
  standardRate: "₹80",
  expressRate: "₹200",
};

const KEYS = [
  { label: "Razorpay key id", value: "rzp_test_•••••••••• (demo)", status: "demo" },
  { label: "Razorpay webhook secret", value: "•••••••••• (demo)", status: "demo" },
  { label: "Shiprocket API token", value: "Not connected", status: "missing" },
  { label: "SES SMTP credentials", value: "Not connected", status: "missing" },
];

export default async function AdminSettingsPage() {
  const settings = await siteSettingsRepo.get();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Settings</h1>
        <p className="text-sm text-ink-700">
          Store profile, tax, shipping, and integration keys. Editable in a later backend phase.
        </p>
      </header>

      <Section title="Announcement bar">
        <AnnouncementBarEditor initial={settings.announcement} />
      </Section>

      <Section title="Store profile">
        <Field label="Legal name" value={STORE.legalName} />
        <Field label="Trade name" value={STORE.tradeName} />
        <Field label="GST number" value={STORE.gstNumber} mono />
        <Field label="PAN" value={STORE.pan} mono />
        <Field label="Contact email" value={STORE.contactEmail} />
        <Field label="Phone" value={STORE.phone} />
        <Field label="Address" value={STORE.addressLine} />
      </Section>

      <Section title="Tax">
        <Field label="GST rate" value={TAX.gstRate} />
        <Field label="Applies to" value={TAX.appliesTo} />
      </Section>

      <Section title="Shipping">
        <Field label="Free shipping threshold" value={SHIPPING.freeShippingThreshold} />
        <Field label="Standard rate" value={SHIPPING.standardRate} />
        <Field label="Express rate" value={SHIPPING.expressRate} />
      </Section>

      <Section title="Integrations">
        {KEYS.map((k) => (
          <div
            key={k.label}
            className="flex items-center justify-between border-b border-ink-500/10 py-3 last:border-b-0"
          >
            <span className="text-xs uppercase tracking-wide text-ink-500">{k.label}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-ink-900">{k.value}</span>
              <Badge tone={k.status === "demo" ? "gold" : "danger"}>
                {k.status === "demo" ? "Demo" : "Missing"}
              </Badge>
            </div>
          </div>
        ))}
      </Section>

      <p className="rounded-sm border border-accent-gold/40 bg-accent-gold/10 p-3 text-xs text-ink-700">
        Editing settings, key rotation, and webhook configuration arrive when the backend phase
        wires real Razorpay, Shiprocket, and SES.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
      <h2 className="mb-4 font-display text-xl text-ink-900">{title}</h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-500/10 py-3 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
      <span className={mono ? "font-mono text-sm text-ink-900" : "text-sm text-ink-900"}>
        {value}
      </span>
    </div>
  );
}
