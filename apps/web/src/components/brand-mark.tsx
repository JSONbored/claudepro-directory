import { cn } from "@/lib";

type BrandMarkProps = {
  className?: string;
  variant?: "solid" | "soft";
};

export function BrandMark({ className, variant = "soft" }: BrandMarkProps) {
  return (
    <img
      src={variant === "solid" ? "/icon.svg" : "/favicon.svg"}
      alt=""
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0", className)}
      width={variant === "solid" ? 100 : 32}
      height={variant === "solid" ? 100 : 32}
      decoding="async"
    />
  );
}
