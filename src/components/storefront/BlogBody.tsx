import { MarkdownContent } from "@/components/storefront/MarkdownContent";

// Thin wrapper around MarkdownContent — kept as a separate name so the blog
// detail page can swap rendering strategies in the future without rippling
// the prop type out to its caller.
export function BlogBody({ body }: { body: string }) {
  return <MarkdownContent source={body} />;
}
