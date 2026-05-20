import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export interface ProsePageProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  children: ReactNode;
}

export function ProsePage({ title, description, breadcrumb, children }: ProsePageProps) {
  return (
    <Container size="md" className="py-12">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <header className="mt-5 flex flex-col gap-2 pb-6 sm:mt-6 sm:pb-8">
        <h1 className="font-display text-2xl text-ink-900 sm:text-3xl md:text-5xl">{title}</h1>
        {description && <p className="text-sm text-ink-700 sm:text-base">{description}</p>}
      </header>
      <div className="prose-like flex flex-col gap-4 text-sm text-ink-700 sm:gap-5 sm:text-base [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-ink-900 [&_h2]:mt-5 sm:[&_h2]:text-2xl sm:[&_h2]:mt-6 [&_p]:leading-relaxed">
        {children}
      </div>
    </Container>
  );
}
