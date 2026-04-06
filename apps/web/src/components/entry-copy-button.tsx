"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import type { ContentEntry } from "@/lib/content";
import { getCopyText } from "@/lib/entry-presentation";

type EntryCopyButtonProps = {
  entry?: ContentEntry;
  text?: string;
  label?: string;
  className?: string;
};

export function EntryCopyButton({
  entry,
  text,
  label = "Copy full asset",
  className
}: EntryCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const value = text ?? (entry ? getCopyText(entry) : "");
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}
