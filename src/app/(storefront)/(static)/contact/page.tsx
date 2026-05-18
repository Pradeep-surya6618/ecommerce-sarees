import { Mail, MapPin, Phone } from "lucide-react";
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Contact us · Saree Store" };

export default function ContactPage() {
  return (
    <ProsePage
      title="Get in touch"
      description="Questions about a piece, a custom request, an order — we read every message."
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact" }]}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Mail className="h-5 w-5 text-accent-gold" />
          <p className="text-sm text-ink-700">hello@sareestore.example</p>
          <p className="text-xs text-ink-500">Replies within one business day.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Phone className="h-5 w-5 text-accent-gold" />
          <p className="text-sm text-ink-700">+91 80 4567 8901</p>
          <p className="text-xs text-ink-500">Mon–Sat, 10:00–18:00 IST.</p>
        </div>
        <div className="flex flex-col gap-2">
          <MapPin className="h-5 w-5 text-accent-gold" />
          <p className="text-sm text-ink-700">
            Saree Store, 27 Lavelle Road,
            <br />
            Bengaluru 560001, KA, India.
          </p>
        </div>
      </div>
      <h2>Wholesale &amp; press</h2>
      <p>
        For bulk corporate gifting, wholesale enquiries, or press requests, write to
        partnerships@sareestore.example. Include your country, brand, and any timeline.
      </p>
    </ProsePage>
  );
}
