import NextImage from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownContentProps {
  source: string;
}

function isInternalHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#");
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Renders user-authored markdown with the storefront's editorial typography.
 * Headings get the display serif; links route through next/link when they
 * point inside the site; images use next/image when they're absolute URLs.
 */
export function MarkdownContent({ source }: MarkdownContentProps) {
  return (
    <div className="flex flex-col gap-4 text-sm leading-relaxed text-ink-700 sm:gap-5 sm:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-5 font-display text-xl text-ink-900 first:mt-0 sm:mt-6 sm:text-3xl md:text-4xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 font-display text-lg text-ink-900 first:mt-0 sm:mt-8 sm:text-2xl md:text-3xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 font-display text-base text-ink-900 first:mt-0 sm:mt-6 sm:text-xl md:text-2xl">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 font-display text-sm text-ink-900 first:mt-0 sm:mt-5 sm:text-lg">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-ink-700 sm:text-base">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="ml-5 flex list-disc flex-col gap-1.5 text-sm text-ink-700 marker:text-accent-gold sm:text-base">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-5 flex list-decimal flex-col gap-1.5 text-sm text-ink-700 marker:text-accent-gold sm:text-base">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent-gold pl-3 font-display text-base italic text-ink-900 sm:pl-4 sm:text-lg">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            const target = typeof href === "string" ? href : "#";
            if (isInternalHref(target)) {
              return (
                <Link
                  href={target}
                  className="text-accent-primary underline-offset-4 transition hover:underline"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={target}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent-primary underline-offset-4 transition hover:underline"
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const url = typeof src === "string" ? src : "";
            if (!url) return null;
            if (isHttpUrl(url) || url.startsWith("/")) {
              return (
                <span className="relative my-2 block aspect-[3/2] w-full overflow-hidden rounded-sm">
                  <NextImage
                    src={url}
                    alt={alt ?? ""}
                    fill
                    sizes="(min-width: 768px) 720px, 100vw"
                    className="object-cover"
                  />
                </span>
              );
            }
            // Fallback for non-URL strings (shouldn't happen, but safe).
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={url} alt={alt ?? ""} className="rounded-sm" />;
          },
          hr: () => <hr className="my-4 border-t border-ink-500/20" />,
          code: ({ children }) => (
            <code className="rounded-sm bg-ink-500/10 px-1.5 py-0.5 font-mono text-xs text-ink-900">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-ink-500/30 px-3 py-2 text-left font-semibold text-ink-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-ink-500/10 px-3 py-2 text-ink-700">{children}</td>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
