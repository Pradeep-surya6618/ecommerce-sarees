import { MAX_NAV_ITEMS } from "@/lib/admin/nav-limits";
import { navMenuRepo } from "@/lib/db/repos/nav-menu";
import { NavigationListClient } from "@/components/admin/NavigationListClient";

export const metadata = { title: "Navigation · Admin" };

export default async function AdminNavigationPage() {
  const [tree, all] = await Promise.all([navMenuRepo.listTree(false), navMenuRepo.list()]);
  // Only top-level items count toward the cap. Children sit in a parent's
  // dropdown and don't take up header real estate.
  const topLevelCount = all.filter((i) => i.parentId === null).length;
  return (
    <NavigationListClient
      tree={tree}
      totalCount={all.length}
      topLevelCount={topLevelCount}
      maxItems={MAX_NAV_ITEMS}
    />
  );
}
