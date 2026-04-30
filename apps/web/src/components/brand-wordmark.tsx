import Link from "next/link";

import { BrandLogotype } from "@/components/brand-logotype";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib";

type BrandWordmarkProps = {
  href?: string;
  className?: string;
  mode?: "lockup" | "icon" | "text";
  variant?: "solid" | "soft";
  label?: string;
};

export function BrandWordmark({
  href = "/",
  className,
  mode = "lockup",
  variant = "solid",
  label = "HeyClaude",
}: BrandWordmarkProps) {
  const mark =
    mode === "icon" ? (
      <BrandMark variant={variant} className={cn("h-7 w-7", className)} />
    ) : mode === "text" ? (
      <BrandLogotype label={label} className={cn("h-6", className)} />
    ) : (
      <BrandLogotype label={label} className={className} />
    );

  return (
    <Link
      href={href}
      aria-label="HeyClaude home"
      className="inline-flex items-center"
    >
      {mark}
    </Link>
  );
}
