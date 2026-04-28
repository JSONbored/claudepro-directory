"use client";

import { useMemo, useState } from "react";

import { brandfetchLogoUrl } from "@heyclaude/registry/brand-assets";

import { cn } from "@/lib";

type BrandAssetEntry = {
  title?: string;
  brandName?: string;
  brandDomain?: string;
  brandIconUrl?: string;
  brandLogoUrl?: string;
};

type BrandAssetProps = {
  entry: BrandAssetEntry;
  fallback: string;
  size?: "sm" | "md" | "lg";
  logo?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-14 text-sm",
};

export function BrandAsset({
  entry,
  fallback,
  size = "md",
  logo = false,
  className,
}: BrandAssetProps) {
  const [failed, setFailed] = useState(false);
  const source = useMemo(() => {
    if (failed) return "";
    if (logo && entry.brandLogoUrl) return entry.brandLogoUrl;
    if (entry.brandIconUrl) return entry.brandIconUrl;
    const clientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;
    if (entry.brandDomain && clientId) {
      return brandfetchLogoUrl(entry.brandDomain, {
        clientId,
        width: logo ? 192 : 128,
        height: logo ? 64 : 128,
        type: logo ? "logo" : "icon",
        theme: "dark",
      });
    }
    return "";
  }, [entry.brandDomain, entry.brandIconUrl, entry.brandLogoUrl, failed, logo]);
  const label = entry.brandName || entry.title || "Brand";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background text-center font-semibold uppercase text-muted-foreground shadow-sm",
        sizeClasses[size],
        className,
      )}
      title={entry.brandDomain ? `${label} (${entry.brandDomain})` : label}
    >
      {source ? (
        // Brand logos are external registry assets; keep layout stable and fall back if unavailable.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source}
          alt={`${label} icon`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className={cn("h-full w-full object-contain p-1.5", logo && "px-2")}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{fallback.slice(0, 2)}</span>
      )}
    </span>
  );
}
