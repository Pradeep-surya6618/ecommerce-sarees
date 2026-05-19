import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { AboutPageEditor } from "@/components/admin/AboutPageEditor";

export const metadata = { title: "About page · Admin" };

export default async function AdminAboutPage() {
  const settings = await siteSettingsRepo.get();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl text-ink-900">About page</h1>
        <p className="text-sm text-ink-700">
          Edit the content shown on <span className="font-mono text-xs">/about</span>.
        </p>
      </header>
      <AboutPageEditor initial={settings.about} />
    </div>
  );
}
