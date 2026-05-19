import { siteSettingsRepo } from "@/lib/db/repos/site-settings";

export async function AnnouncementBar() {
  const settings = await siteSettingsRepo.get();
  const { message, enabled } = settings.announcement;
  if (!enabled || !message.trim()) return null;
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-ink-900 via-[#1a1410] to-ink-900 text-bg-base">
      {/* Mobile: auto-scrolling marquee so the full message is readable */}
      <div className="sm:hidden">
        <div className="announcement-marquee flex h-9 w-max items-center whitespace-nowrap">
          <span className="px-8 text-[10px] font-medium uppercase tracking-[0.18em]">
            {message}
          </span>
          <span aria-hidden className="text-accent-gold/60">
            ✦
          </span>
          <span aria-hidden className="px-8 text-[10px] font-medium uppercase tracking-[0.18em]">
            {message}
          </span>
          <span aria-hidden className="text-accent-gold/60">
            ✦
          </span>
        </div>
      </div>

      {/* Desktop: static centered with ornament hairlines */}
      <div className="mx-auto hidden h-9 max-w-7xl items-center justify-center gap-4 px-6 sm:flex">
        <span aria-hidden className="h-px w-8 bg-bg-base/30" />
        <span className="text-[11px] font-medium uppercase tracking-[0.24em]" title={message}>
          {message}
        </span>
        <span aria-hidden className="h-px w-8 bg-bg-base/30" />
      </div>

      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent"
      />
    </div>
  );
}
