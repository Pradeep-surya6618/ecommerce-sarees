import { couponsRepo } from "@/lib/db/repos/coupons";
import { CouponsListClient } from "@/components/admin/CouponsListClient";

export const metadata = { title: "Coupons · Admin" };

export default async function AdminCouponsPage() {
  const coupons = await couponsRepo.listAll();
  return <CouponsListClient coupons={coupons} />;
}
