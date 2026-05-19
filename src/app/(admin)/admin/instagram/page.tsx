import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { InstagramEditor } from "@/components/admin/InstagramEditor";

export const metadata = { title: "Instagram · Admin" };

export default async function AdminInstagramPage() {
  const settings = await siteSettingsRepo.get();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Instagram</h1>
        <p className="text-sm text-ink-700">
          Edit the &ldquo;From the gram&rdquo; section &mdash; handle, follow link, and the grid
          tiles on the home page.
        </p>
      </header>
      <InstagramEditor initial={settings.instagram} />
    </div>
  );
}
