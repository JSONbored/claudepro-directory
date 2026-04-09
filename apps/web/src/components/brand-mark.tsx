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
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="9"
        className={solid ? "fill-primary stroke-primary" : "fill-primary/14 stroke-primary/45"}
        strokeWidth="1.2"
      />
      <g
        className={solid ? "stroke-primary-foreground" : "stroke-primary"}
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M16 8.2V12.4" />
        <path d="M16 19.6V23.8" />
        <path d="M8.2 16H12.4" />
        <path d="M19.6 16H23.8" />
        <path d="M10.5 10.5L13.5 13.5" />
        <path d="M18.5 18.5L21.5 21.5" />
        <path d="M10.5 21.5L13.5 18.5" />
        <path d="M18.5 13.5L21.5 10.5" />
      </g>
      <circle
        cx="22.4"
        cy="9.6"
        r="1.8"
        className={solid ? "fill-primary-foreground/95" : "fill-chart-2"}
      />
    </svg>
  );
}
