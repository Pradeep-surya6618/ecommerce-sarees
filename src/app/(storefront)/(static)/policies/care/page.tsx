import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Saree care · Saree Store" };

export default function CarePolicyPage() {
  return (
    <ProsePage
      title="Saree care"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Saree care" },
      ]}
    >
      <p>Each fibre has its rules. The short version:</p>
      <h2>Silk</h2>
      <p>
        Dry clean for the first wash. After that, only spot-clean. Iron reverse-side, low
        temperature, with a thin cotton between the iron and the saree. Store folded in unbleached
        cotton. Refold along a different line every six months.
      </p>
      <h2>Cotton</h2>
      <p>
        Cold-water hand-wash with a mild detergent. Don&apos;t wring. Air-dry in the shade. Iron
        while slightly damp for the best crease.
      </p>
      <h2>Linen</h2>
      <p>Gentle machine wash on cold. Linen wrinkles by design; lean into it.</p>
      <h2>Designer pieces with embellishments</h2>
      <p>
        Always dry clean. Never spray perfume or hairspray directly onto sequins, beads, or zardosi.
      </p>
    </ProsePage>
  );
}
