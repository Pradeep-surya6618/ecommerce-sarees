import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Privacy · Saree Store" };

export default function PrivacyPolicyPage() {
  return (
    <ProsePage
      title="Privacy"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Policies", href: "/policies/shipping" },
        { label: "Privacy" },
      ]}
    >
      <p>
        We collect only what we need to ship your sarees and respond to your messages: name, email,
        phone, and delivery address. We store this in our database and don&apos;t sell or share it
        with third parties.
      </p>
      <h2>Payments</h2>
      <p>
        Card numbers and UPI handles are never seen by our servers. Razorpay processes payments
        directly; we only store the order&apos;s transaction reference.
      </p>
      <h2>Email</h2>
      <p>
        We send transactional email about your orders. You can opt in to occasional product updates
        separately; you can unsubscribe any time.
      </p>
      <h2>Your rights</h2>
      <p>
        Email privacy@sareestore.example to request a copy or deletion of your account data. We
        respond within 30 days.
      </p>
    </ProsePage>
  );
}
