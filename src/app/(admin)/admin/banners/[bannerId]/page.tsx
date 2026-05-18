import { notFound } from "next/navigation";
import { bannersRepo } from "@/lib/db/repos/banners";
import { BannerForm } from "@/components/admin/BannerForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ bannerId: string }>;
}

export default async function EditBannerPage({ params }: PageProps) {
  const { bannerId } = await params;
  const banner = await bannersRepo.getById(bannerId);
  if (!banner) notFound();

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
        <h1 className="font-display text-3xl text-ink-900">Edit · {banner.title}</h1>
      </header>
      <BannerForm editId={banner.id} defaultBanner={banner} />
    </div>
  );
}
