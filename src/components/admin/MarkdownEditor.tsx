"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bold,
  Code2,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pencil,
  Quote,
} from "lucide-react";
import remarkGfm from "remark-gfm";
import { clsx } from "@/lib/utils/clsx";

export interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  rows?: number;
  placeholder?: string;
}

type Mode = "write" | "preview";

interface ToolbarAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  apply: (selection: string) => { before: string; after: string; placeholder: string };
}

const TOOLBAR: ToolbarAction[] = [
  {
    label: "Heading 2",
    icon: Heading2,
    apply: () => ({ before: "## ", after: "", placeholder: "Heading" }),
  },
  {
    label: "Heading 3",
    icon: Heading3,
    apply: () => ({ before: "### ", after: "", placeholder: "Subheading" }),
  },
  {
    label: "Bold",
    icon: Bold,
    apply: () => ({ before: "**", after: "**", placeholder: "bold text" }),
  },
  {
    label: "Italic",
    icon: Italic,
    apply: () => ({ before: "_", after: "_", placeholder: "italic text" }),
  },
  {
    label: "Link",
    icon: LinkIcon,
    apply: (sel) => ({
      before: "[",
      after: "](https://example.com)",
      placeholder: sel || "link text",
    }),
  },
  {
    label: "Image",
    icon: ImageIcon,
    apply: () => ({
      before: "![",
      after: "](https://example.com/image.jpg)",
      placeholder: "alt text",
    }),
  },
  {
    label: "Bulleted list",
    icon: List,
    apply: () => ({ before: "- ", after: "", placeholder: "item" }),
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    apply: () => ({ before: "1. ", after: "", placeholder: "item" }),
  },
  {
    label: "Quote",
    icon: Quote,
    apply: () => ({ before: "> ", after: "", placeholder: "quote" }),
  },
  {
    label: "Inline code",
    icon: Code2,
    apply: () => ({ before: "`", after: "`", placeholder: "code" }),
  },
];

export function MarkdownEditor({
  value,
  onChange,
  id,
  rows = 18,
  placeholder = "Write in markdown — use the toolbar for formatting…",
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<Mode>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyAction(action: ToolbarAction) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selection = value.slice(start, end);
    const { before, after, placeholder: ph } = action.apply(selection);
    const insertText = selection || ph;
    const next = value.slice(0, start) + before + insertText + after + value.slice(end);
    onChange(next);
    // Restore selection to the inserted text so the user can keep typing/replacing.
    requestAnimationFrame(() => {
      ta.focus();
      const selStart = start + before.length;
      const selEnd = selStart + insertText.length;
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  return (
    <div className="overflow-hidden rounded-sm border border-ink-500/30 bg-bg-base">
      {/* ── Tab + toolbar bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-500/15 bg-bg-elevated px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <TabButton
            label="Write"
            icon={Pencil}
            active={mode === "write"}
            onClick={() => setMode("write")}
          />
          <TabButton
            label="Preview"
            icon={Eye}
            active={mode === "preview"}
            onClick={() => setMode("preview")}
          />
        </div>
        {mode === "write" && (
          <div className="flex flex-wrap items-center gap-0.5">
            {TOOLBAR.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  title={action.label}
                  aria-label={action.label}
                  onClick={() => applyAction(action)}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-ink-700 transition hover:bg-ink-500/10 hover:text-ink-900"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Write / Preview pane ── */}
      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          spellCheck
          className="block w-full resize-y border-0 bg-bg-base p-4 font-mono text-sm leading-relaxed text-ink-900 outline-none focus:outline-none"
        />
      ) : (
        <div className="max-h-[640px] overflow-y-auto bg-bg-base p-5">
          {value.trim().length === 0 ? (
            <p className="text-sm italic text-ink-500">Nothing to preview yet.</p>
          ) : (
            <div className="flex flex-col gap-4 leading-relaxed text-ink-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="font-display text-2xl text-ink-900">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-4 font-display text-xl text-ink-900">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-3 font-display text-lg text-ink-900">{children}</h3>
                  ),
                  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-ink-900">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="ml-5 flex list-disc flex-col gap-1 marker:text-accent-gold">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="ml-5 flex list-decimal flex-col gap-1 marker:text-accent-gold">
                      {children}
                    </ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-accent-gold pl-3 italic text-ink-900">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={typeof href === "string" ? href : "#"}
                      className="text-accent-primary underline-offset-4 transition hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => {
                    const url = typeof src === "string" ? src : "";
                    if (!url) return null;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={alt ?? ""}
                        className="max-h-72 w-auto rounded-sm border border-ink-500/10"
                      />
                    );
                  },
                  code: ({ children }) => (
                    <code className="rounded-sm bg-ink-500/10 px-1.5 py-0.5 font-mono text-xs text-ink-900">
                      {children}
                    </code>
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium transition",
        active ? "bg-ink-900 text-bg-base" : "text-ink-700 hover:bg-ink-500/10 hover:text-ink-900",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
