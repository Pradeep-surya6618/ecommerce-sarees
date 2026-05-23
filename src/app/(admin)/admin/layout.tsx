import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin" && user.role !== "staff") {
    redirect("/admin/login?error=forbidden");
  }
  return (
    <AdminShell userName={user.fullName} userEmail={user.email}>
      {children}
    </AdminShell>
  );
}
