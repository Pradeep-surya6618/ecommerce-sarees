import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export interface AuthCardProps {
  title: string;
  eyebrow?: string;
  description?: string;
  footerPrompt?: string;
  footerHref?: string;
  footerLabel?: string;
  children: ReactNode;
}

/**
 * Editorial auth shell: a deep ink-purple card sits on a soft saree-photo
 * backdrop. Brand wordmark, brass hairline, and a centred title give it a
 * premium feel. Mobile gets tighter padding and smaller type.
 */
export function AuthCard({
  title,
  eyebrow = "Saree Store",
  description,
  footerPrompt,
  footerHref,
  footerLabel,
  children,
}: AuthCardProps) {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden md:min-h-[calc(100vh-5rem)]">
      {/* Backdrop: muted saree photo + purple wash + radial vignette */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/Images/Saree-4.png"
          alt=""
          fill
          sizes="100vw"
          priority={false}
          className="scale-125 object-contain object-center opacity-60 sm:scale-150"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-base/80 via-bg-base/60 to-bg-base/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#251f3e_120%)] opacity-25" />
      </div>

      <Container
        size="sm"
        className="relative flex min-h-[calc(100vh-3.5rem)] items-center py-8 sm:py-12 md:min-h-[calc(100vh-5rem)] md:py-16"
      >
        <div className="mx-auto flex w-full max-w-md flex-col">
          {/* ── Card ── */}
          <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-5 py-7 text-bg-base shadow-[0_24px_60px_rgba(37,31,62,0.25)] sm:px-7 sm:py-9 md:px-9 md:py-10">
            {/* Top brass hairline */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/70 to-transparent"
            />

            {/* Brand wordmark */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="font-display text-xl leading-none tracking-wide text-bg-base sm:text-2xl md:text-[26px]"
              >
                {eyebrow}
              </Link>
              <span
                aria-hidden
                className="h-px w-8 bg-gradient-to-r from-transparent via-accent-gold to-transparent sm:w-12"
              />
            </div>

            {/* Title */}
            <div className="mt-4 flex flex-col items-center gap-1.5 sm:mt-6 sm:gap-2">
              <h1 className="text-center font-display text-lg leading-tight text-bg-base sm:text-xl md:text-2xl">
                {title}
              </h1>
              {description && (
                <p className="text-center text-[11px] text-bg-base/65 sm:text-xs md:text-sm">
                  {description}
                </p>
              )}
            </div>

            {/* Form slot */}
            <div className="mt-6 sm:mt-8">{children}</div>
          </div>

          {/* Footer prompt outside the card */}
          {footerPrompt && footerHref && footerLabel && (
            <p className="mt-5 text-center text-xs text-ink-700 sm:mt-6 sm:text-sm">
              {footerPrompt}{" "}
              <Link
                href={footerHref}
                className="font-semibold text-accent-primary underline-offset-4 transition hover:underline"
              >
                {footerLabel}
              </Link>
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}
