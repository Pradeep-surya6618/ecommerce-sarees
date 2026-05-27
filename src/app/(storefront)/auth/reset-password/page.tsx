import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export const metadata = { title: "Set a new password · Saree Store" };

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  if (!email) redirect("/auth/forgot-password");
  return (
    <AuthCard title="Choose a new password">
      <PasswordResetForm email={email} />
    </AuthCard>
  );
}
