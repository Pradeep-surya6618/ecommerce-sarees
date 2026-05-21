import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  ensureDemoAdminSeeded,
} from "@/lib/auth/admin-seed";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminLoginIllustration } from "@/components/admin/AdminLoginIllustration";

export const metadata = { title: "Admin sign in · Saree Store" };

export default async function AdminLoginPage() {
  await ensureDemoAdminSeeded();
  return (
    <main className="grid h-screen grid-cols-1 bg-[#1a1530] md:grid-cols-[1.05fr_0.95fr]">
      <div className="flex h-screen flex-col justify-center overflow-y-auto px-5 py-6 sm:px-12 sm:py-8 md:h-full md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md">
          <header className="flex flex-col gap-1.5 pb-5 sm:gap-2 sm:pb-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-gold">Admin</span>
            <h1 className="flex items-center gap-2 font-display text-2xl text-white sm:text-3xl">
              <span>Manage your store</span>
              <span className="text-xl sm:text-2xl" aria-hidden>
                ✨
              </span>
            </h1>
          </header>
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] leading-relaxed text-white/55 sm:mb-5 sm:text-[11px]">
            <span className="text-white/35">Demo —</span>{" "}
            <span className="font-mono text-white/80">{DEMO_ADMIN_EMAIL}</span>{" "}
            <span className="text-white/30">·</span>{" "}
            <span className="font-mono text-white/80">{DEMO_ADMIN_PASSWORD}</span>
          </div>
          <AdminLoginForm />
        </div>
      </div>

      <div className="hidden h-full overflow-hidden md:block">
        <AdminLoginIllustration />
      </div>
    </main>
  );
}
