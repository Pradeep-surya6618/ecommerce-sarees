import { redirect } from "next/navigation";
import { BANNER_LIMITS, countByPlacement } from "@/lib/admin/banner-limits";
import { bannersRepo } from "@/lib/db/repos/banners";
import { BannerForm } from "@/components/admin/BannerForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import type { Banner } from "@/types/domain";

export const metadata = { title: "New banner · Admin" };

export default async function NewBannerPage() {
  const existing = await bannersRepo.listAll();
  const counts = countByPlacement(existing);
  const placements = Object.keys(BANNER_LIMITS) as Banner["placement"][];
  const allFull = placements.every((p) => counts[p] >= BANNER_LIMITS[p]);
  if (allFull) {
    redirect("/admin/banners");
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Banners", href: "/admin/banners" },
          { label: "New" },
        ]}
      />
      <header>
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">New banner</h1>
      </header>
      <BannerForm placementCounts={counts} />
    </div>
  );
}
