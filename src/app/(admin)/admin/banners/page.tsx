import { bannersRepo } from "@/lib/db/repos/banners";
import { BannersListClient } from "@/components/admin/BannersListClient";

export const metadata = { title: "Banners · Admin" };

export default async function AdminBannersPage() {
  const banners = await bannersRepo.listAll();
  return <BannersListClient banners={banners} />;
}
