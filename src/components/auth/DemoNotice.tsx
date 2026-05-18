import { Sparkles } from "lucide-react";

export function DemoNotice() {
  return (
    <div className="mb-6 flex items-start gap-2 rounded-sm border border-accent-gold/40 bg-accent-gold/10 p-3 text-xs text-ink-700">
      <Sparkles aria-hidden className="mt-0.5 h-4 w-4 text-accent-gold" />
      <span>
        Demo mode: the verification code is{" "}
        <span className="font-semibold text-ink-900">123456</span>. Google sign-in shows demo
        accounts. Real bcrypt, email delivery, and Google OAuth wire up in a later phase.
      </span>
    </div>
  );
}
