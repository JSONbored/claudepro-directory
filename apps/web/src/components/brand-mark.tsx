import { cn } from "@/lib";

type BrandMarkProps = {
  className?: string;
  variant?: "solid" | "soft";
};

export function BrandMark({ className, variant = "soft" }: BrandMarkProps) {
  const solid = variant === "solid";

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        className={solid ? "fill-primary" : "fill-primary/14 stroke-primary/45"}
        strokeWidth={solid ? 0 : 1.2}
      />
      <circle
        cx="11"
        cy="16"
        r="2.5"
        className={solid ? "fill-primary-foreground" : "fill-primary"}
      />
      <path
        d="M18 13 Q23 16 18 19"
        className={solid ? "stroke-primary-foreground" : "stroke-primary"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
