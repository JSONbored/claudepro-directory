"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { useToast } from "@/components/ui/toast-provider";
import type { ContentEntry } from "@/lib/content";
import { getCopyText } from "@/lib/entry-presentation";

type EntryCopyButtonProps = {
  entry?: ContentEntry;
  text?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
  title?: string;
};

export function EntryCopyButton({
  entry,
  text,
  label = "Copy full asset",
  className,
  iconOnly = false,
  title
}: EntryCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const value = text ?? (entry ? getCopyText(entry) : "");
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      pushToast({
        variant: "success",
        title: "Copied",
        description: label
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
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      title={title ?? label}
      aria-label={title ?? label}
    >
      {copied ? <Check className="size-4 text-emerald-500 copy-check-icon" /> : <Copy className="size-4" />}
      {iconOnly ? <span className="sr-only">{copied ? "Copied" : label}</span> : copied ? "Copied" : label}
    </button>
  );
}
