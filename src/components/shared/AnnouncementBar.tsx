import { siteSettingsRepo } from "@/lib/db/repos/site-settings";

export async function AnnouncementBar() {
  const settings = await siteSettingsRepo.get();
  const { message, enabled } = settings.announcement;
  if (!enabled || !message.trim()) return null;
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-ink-900 via-[#1a1410] to-ink-900 text-bg-base">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-3 px-4 sm:gap-4 sm:px-6">
        <span aria-hidden className="hidden h-px w-8 bg-bg-base/30 sm:inline-block" />
        <span
          className="truncate text-center text-[10px] font-medium uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.24em]"
          title={message}
        >
          {message}
        </span>
        <span aria-hidden className="hidden h-px w-8 bg-bg-base/30 sm:inline-block" />
      </div>
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent"
      />
    </div>
  );
}
