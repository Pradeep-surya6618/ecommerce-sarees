import { regionsRepo } from "@/lib/db/repos/regions";
import { RegionsListClient } from "@/components/admin/RegionsListClient";

export const metadata = { title: "Regions · Admin" };

export default async function AdminRegionsPage() {
  const regions = await regionsRepo.listAll();
  return <RegionsListClient regions={regions} />;
}
