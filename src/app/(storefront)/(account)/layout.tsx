import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AccountShell } from "@/components/account/AccountShell";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");
  return (
    <AccountShell userName={user.fullName} userEmail={user.email}>
      {children}
    </AccountShell>
  );
}
