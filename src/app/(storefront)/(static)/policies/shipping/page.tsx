import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Shipping · Saree Store" };

export default function ShippingPolicyPage() {
  return (
    <ProsePage
      title="Shipping"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Shipping" },
      ]}
    >
      <p>
        Free shipping pan-India on orders over ₹2,000. Below that, standard delivery is ₹80 and
        express is ₹200.
      </p>
      <h2>How long it takes</h2>
      <p>
        Standard delivery lands in 5 business days. Express in 2. The pincode checker on each
        product page gives the canonical estimate for your address.
      </p>
      <h2>Cash on delivery</h2>
      <p>
        COD is available across most Indian pincodes. Selected remote pincodes are prepaid only;
        we&apos;ll flag this at checkout if it applies.
      </p>
      <h2>International shipping</h2>
      <p>
        Not currently. Please email us if you&apos;d like an international quote; we can arrange
        ad-hoc shipping for orders above ₹50,000 with import duties handled at destination.
      </p>
    </ProsePage>
  );
}
