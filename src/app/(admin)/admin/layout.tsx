import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/auth/current-user";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");
  return (
    <AdminShell userName={user.fullName} userEmail={user.email}>
      {children}
    </AdminShell>
  );
}
