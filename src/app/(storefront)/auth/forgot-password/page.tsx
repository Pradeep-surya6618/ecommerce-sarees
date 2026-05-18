import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export const metadata = { title: "Reset password · Saree Store" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send a 6-digit code."
      footerPrompt="Remembered it?"
      footerHref="/auth/login"
      footerLabel="Back to sign in"
    >
      <PasswordResetRequestForm />
    </AuthCard>
  );
}
