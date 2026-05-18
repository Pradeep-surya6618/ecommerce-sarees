import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  ensureDemoAdminSeeded,
} from "@/lib/auth/admin-seed";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = { title: "Admin sign in · Saree Store" };

export default async function AdminLoginPage() {
  await ensureDemoAdminSeeded();
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 p-6">
      <div className="w-full max-w-md rounded-md bg-bg-elevated p-8">
        <header className="flex flex-col gap-2 pb-6">
          <span className="text-xs uppercase tracking-[0.25em] text-accent-gold">Admin</span>
          <h1 className="font-display text-3xl text-ink-900">Sign in to manage your store</h1>
        </header>
        <div className="mb-6 rounded-sm border border-accent-gold/40 bg-accent-gold/10 p-3 text-xs text-ink-700">
          Demo credentials —
          <br />
          <span className="font-mono text-ink-900">{DEMO_ADMIN_EMAIL}</span>
          <br />
          <span className="font-mono text-ink-900">{DEMO_ADMIN_PASSWORD}</span>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
