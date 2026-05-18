import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Terms · Saree Store" };

export default function TermsPolicyPage() {
  return (
    <ProsePage
      title="Terms of service"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Terms" },
      ]}
    >
      <p>
        These are the working terms for using Saree Store. We try to keep them short. If anything is
        unclear, write to hello@sareestore.example and we&apos;ll explain.
      </p>
      <h2>Orders</h2>
      <p>
        An order is confirmed only when you receive an email confirmation. If a piece sells out
        between you adding it to cart and us processing, we&apos;ll refund or offer an alternative.
      </p>
      <h2>Pricing &amp; taxes</h2>
      <p>
        All prices are in INR and inclusive of 5% GST for sarees. Shipping is charged separately and
        shown at checkout.
      </p>
      <h2>Account use</h2>
      <p>
        Don&apos;t share your account credentials. We&apos;ll never ask for them. If you suspect
        unauthorised access, change your password immediately and write to us.
      </p>
    </ProsePage>
  );
}
