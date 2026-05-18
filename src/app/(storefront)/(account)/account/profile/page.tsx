import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata = { title: "Profile · Saree Store" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/profile");
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-ink-900">Profile</h1>
        <p className="text-sm text-ink-700">Update your name and password.</p>
      </header>
      <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">Personal</h2>
        <ProfileForm defaultFullName={user.fullName} email={user.email} />
      </section>
      <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-4 font-display text-2xl text-ink-900">Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
