import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export interface AuthCardProps {
  title: string;
  description?: string;
  footerPrompt?: string;
  footerHref?: string;
  footerLabel?: string;
  children: ReactNode;
}

export function AuthCard({
  title,
  description,
  footerPrompt,
  footerHref,
  footerLabel,
  children,
}: AuthCardProps) {
  return (
    <Container size="sm" className="py-16">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col gap-2 pb-8">
          <Link href="/" className="font-display text-3xl text-ink-900">
            Saree Store
          </Link>
          <h1 className="font-display text-2xl text-ink-900">{title}</h1>
          {description && <p className="text-sm text-ink-700">{description}</p>}
        </div>
        <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6 md:p-8">
          {children}
        </div>
        {footerPrompt && footerHref && footerLabel && (
          <p className="mt-6 text-center text-sm text-ink-700">
            {footerPrompt}{" "}
            <Link href={footerHref} className="font-medium text-accent-primary hover:underline">
              {footerLabel}
            </Link>
          </p>
        )}
      </div>
    </Container>
  );
}
