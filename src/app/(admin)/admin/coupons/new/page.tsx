import { CouponForm } from "@/components/admin/CouponForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = { title: "New coupon · Admin" };

export default function NewCouponPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Coupons", href: "/admin/coupons" },
          { label: "New" },
        ]}
      />
      <header>
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">New coupon</h1>
      </header>
      <CouponForm />
    </div>
  );
}
