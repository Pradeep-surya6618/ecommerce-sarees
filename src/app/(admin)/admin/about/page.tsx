import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { AboutPageEditor } from "@/components/admin/AboutPageEditor";

export const metadata = { title: "About page · Admin" };

export default async function AdminAboutPage() {
  const settings = await siteSettingsRepo.get();
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl text-ink-900 sm:text-3xl">About page</h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">
          Edit the content shown on <span className="font-mono text-[10px] sm:text-xs">/about</span>
          .
        </p>
      </header>
      <AboutPageEditor initial={settings.about} />
    </div>
  );
}
