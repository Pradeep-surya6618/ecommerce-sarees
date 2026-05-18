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
      <header className="mt-6 flex flex-col gap-2 pb-8">
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{title}</h1>
        {description && <p className="text-ink-700">{description}</p>}
      </header>
      <div className="prose-like flex flex-col gap-5 text-ink-700 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink-900 [&_h2]:mt-6 [&_p]:leading-relaxed">
        {children}
      </div>
    </Container>
  );
}
