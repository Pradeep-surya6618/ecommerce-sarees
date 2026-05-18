import { BannerForm } from "@/components/admin/BannerForm";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata = { title: "New banner · Admin" };

export default function NewBannerPage() {
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
        <h1 className="font-display text-3xl text-ink-900">New banner</h1>
      </header>
      <BannerForm />
    </div>
  );
}
