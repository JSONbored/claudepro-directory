"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";

import { useToast } from "@/components/ui/toast-provider";

type SnippetCardProps = {
  eyebrow: string;
  title: string;
  code: string;
  language?: string;
};

export function SnippetCard({ eyebrow, title, code, language = "text" }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { pushToast } = useToast();
  const lineCount = code.split("\n").length;
  const canCollapse = lineCount > 18;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      pushToast({
        variant: "success",
        title: "Copied",
        description: title
      });
    } catch {
      pushToast({
        variant: "error",
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser."
      });
    }
  };

  return (
    <section className="surface-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-foreground">{title}</p>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              {lineCount} lines
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCollapse ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="directory-link-chip"
            >
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              {expanded ? "Collapse" : "Expand"}
            </button>
          ) : null}
          <button type="button" onClick={handleCopy} className="directory-link-chip">
            {copied ? <Check className="copy-check-icon size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre className={`detail-code-block ${!expanded && canCollapse ? "detail-code-block-collapsed" : ""}`}>
        <code data-language={language}>{code}</code>
      </pre>
    </section>
  );
}
