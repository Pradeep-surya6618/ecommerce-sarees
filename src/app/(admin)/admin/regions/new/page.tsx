import { RegionForm } from "@/components/admin/RegionForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = { title: "New region · Admin" };

export default function NewRegionPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Regions", href: "/admin/regions" },
          { label: "New" },
        ]}
      />
      <header>
        <h1 className="font-display text-lg text-ink-900 sm:text-xl md:text-2xl">New region</h1>
      </header>
      <RegionForm />
    </div>
  );
}
