import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import { NavigationListClient } from "@/components/admin/NavigationListClient";

export const metadata = { title: "Navigation · Admin" };

export default async function AdminNavigationPage() {
  const [tree, all] = await Promise.all([navMenuRepo.listTree(false), navMenuRepo.list()]);
  return <NavigationListClient tree={tree} totalCount={all.length} />;
}
