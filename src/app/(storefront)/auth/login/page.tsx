import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthErrorToast } from "@/components/auth/OAuthErrorToast";

export const metadata = { title: "Sign in · Saree Store" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Saree Store account."
      footerPrompt="New here?"
      footerHref="/auth/signup"
      footerLabel="Create an account"
    >
      {/* useSearchParams requires a Suspense boundary. */}
      <Suspense fallback={null}>
        <OAuthErrorToast />
      </Suspense>
      <LoginForm />
    </AuthCard>
  );
}
