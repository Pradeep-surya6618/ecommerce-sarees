import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Returns · Saree Store" };

export default function ReturnsPolicyPage() {
  return (
    <ProsePage
      title="Returns"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Returns" },
      ]}
    >
      <p>
        Seven days from delivery for unworn pieces with tags intact. Pre-stitched and made-to-order
        items are non-returnable.
      </p>
      <h2>How to start a return</h2>
      <p>
        Email returns@sareestore.example with your order id and a photo of the piece. We&apos;ll
        arrange reverse pickup at no charge. Refund lands within 5 business days of receipt.
      </p>
      <h2>Damaged or wrong piece</h2>
      <p>
        If a piece arrives damaged or different from what you ordered, photograph it before
        unfolding and write to us within 48 hours. We&apos;ll cover everything, no questions.
      </p>
    </ProsePage>
  );
}
