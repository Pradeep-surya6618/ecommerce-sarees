import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create account · Saree Store" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Save your wishlist, track your orders, and check out faster."
      footerPrompt="Already have an account?"
      footerHref="/auth/login"
      footerLabel="Sign in"
    >
      <SignupForm />
    </AuthCard>
  );
}
