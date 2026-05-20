import { Sparkles } from "lucide-react";

export function DemoNotice() {
  return (
    <div className="mb-5 flex items-start gap-2 rounded-md border border-accent-gold/40 bg-accent-gold/10 p-3 text-[11px] leading-relaxed text-bg-base/85 sm:mb-6 sm:p-3.5 sm:text-xs">
      <Sparkles aria-hidden className="mt-0.5 h-3.5 w-3.5 text-accent-gold sm:h-4 sm:w-4" />
      <span>
        Demo mode: the verification code is{" "}
        <span className="font-semibold text-bg-base">123456</span>. Google sign-in shows demo
        accounts. Real bcrypt, email delivery, and Google OAuth wire up in a later phase.
      </span>
    </div>
  );
}
