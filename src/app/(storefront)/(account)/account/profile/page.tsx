import { redirect } from "next/navigation";
import { KeyRound, Sparkles, UserCog } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata = { title: "Profile · Saree Store" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/profile");

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8 md:gap-10">
      {/* ── Header ── */}
      <header className="flex min-w-0 flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent-gold sm:text-xs">
          <Sparkles className="h-3 w-3" />
          Your space
        </span>
        <h1 className="font-display text-lg leading-tight text-ink-900 sm:text-2xl md:text-3xl">
          Profile
        </h1>
        <p className="text-[11px] text-ink-700 sm:text-sm">Update your name and password.</p>
      </header>

      {/* ── Personal ── */}
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <header className="mb-5 flex items-center gap-3 sm:mb-7">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
            <UserCog className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
              Personal
            </span>
            <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl md:text-2xl">
              Your details
            </h2>
          </div>
        </header>
        <ProfileForm defaultFullName={user.fullName} email={user.email} />
      </section>

      {/* ── Password ── */}
      <section className="relative rounded-2xl border border-ink-500/10 bg-bg-elevated p-4 sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
        />
        <header className="mb-5 flex items-center gap-3 sm:mb-7">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary sm:h-10 sm:w-10">
            <KeyRound className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold sm:text-[10px]">
              Security
            </span>
            <h2 className="font-display text-base leading-tight text-ink-900 sm:text-xl md:text-2xl">
              Change password
            </h2>
          </div>
        </header>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
