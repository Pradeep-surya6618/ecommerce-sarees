import { notFound } from "next/navigation";
import { regionsRepo } from "@/lib/db/repos/regions";
import { RegionForm } from "@/components/admin/RegionForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ regionId: string }>;
}

export default async function EditRegionPage({ params }: PageProps) {
  const { regionId } = await params;
  const region = await regionsRepo.getById(regionId);
  if (!region) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Regions", href: "/admin/regions" },
          { label: region.state },
        ]}
      />
      <header>
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">
          Edit · {region.state}
        </h1>
      </header>
      <RegionForm editId={region.id} defaultRegion={region} />
    </div>
  );
}
