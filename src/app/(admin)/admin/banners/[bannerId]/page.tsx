import { notFound } from "next/navigation";
import { countByPlacement } from "@/lib/admin/banner-limits";
import { bannersRepo } from "@/lib/db/repos/banners";
import { BannerForm } from "@/components/admin/BannerForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ bannerId: string }>;
}

export default async function EditBannerPage({ params }: PageProps) {
  const { bannerId } = await params;
  const [banner, allBanners] = await Promise.all([
    bannersRepo.getById(bannerId),
    bannersRepo.listAll(),
  ]);
  if (!banner) notFound();
  const counts = countByPlacement(allBanners);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Banners", href: "/admin/banners" },
          { label: banner.title },
        ]}
      />
      <header>
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">
          Edit · {banner.title}
        </h1>
      </header>
      <BannerForm editId={banner.id} defaultBanner={banner} placementCounts={counts} />
    </div>
  );
}
