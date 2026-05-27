import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { OtpForm } from "@/components/auth/OtpForm";

export const metadata = { title: "Verify your email · Saree Store" };

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  if (!email) redirect("/auth/signup");
  return (
    <AuthCard title="Verify your email" description="Enter the 6-digit code we just sent you.">
      <OtpForm email={email} />
    </AuthCard>
  );
}
