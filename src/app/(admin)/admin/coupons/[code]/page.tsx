import { notFound } from "next/navigation";
import { couponsRepo } from "@/lib/db/repos/coupons";
import { CouponForm } from "@/components/admin/CouponForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function EditCouponPage({ params }: PageProps) {
  const { code } = await params;
  const coupon = await couponsRepo.getByCode(decodeURIComponent(code));
  if (!coupon) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Coupons", href: "/admin/coupons" },
          { label: coupon.code },
        ]}
      />
      <header>
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">
          Edit · {coupon.code}
        </h1>
      </header>
      <CouponForm editCode={coupon.code} defaultCoupon={coupon} />
    </div>
  );
}
