"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { adminLoginAction } from "@/server/actions/admin-auth";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type Values = z.infer<typeof schema>;

export function AdminLoginForm() {
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  function onSubmit(values: Values) {
    startTransition(async () => {
      try {
        await adminLoginAction(values);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        const message =
          err instanceof Error ? err.message : "Couldn't sign you in. Please try again.";
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:gap-4">
      <div>
        <div
          className={`flex h-11 items-center gap-3 rounded-full border bg-white/5 px-4 transition focus-within:border-accent-primary focus-within:bg-white/10 sm:h-12 sm:px-5 ${
            errors.email ? "border-danger/70" : "border-white/15"
          }`}
        >
          <Mail className="h-4 w-4 text-white/50" aria-hidden />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            aria-invalid={errors.email ? "true" : undefined}
            {...register("email")}
            className="autofill-on-dark h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
        </div>
        {errors.email ? (
          <p className="mt-1.5 pl-5 text-xs text-danger" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <div
          className={`flex h-11 items-center gap-3 rounded-full border bg-white/5 px-4 transition focus-within:border-accent-primary focus-within:bg-white/10 sm:h-12 sm:px-5 ${
            errors.password ? "border-danger/70" : "border-white/15"
          }`}
        >
          <Lock className="h-4 w-4 text-white/50" aria-hidden />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            aria-invalid={errors.password ? "true" : undefined}
            {...register("password")}
            className="autofill-on-dark h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="cursor-pointer text-white/50 transition hover:text-white"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? (
          <p className="mt-1.5 pl-5 text-xs text-danger" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group mt-3 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent-primary px-6 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(91,58,138,0.7)] transition hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:h-12"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          <>
            Log in
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
