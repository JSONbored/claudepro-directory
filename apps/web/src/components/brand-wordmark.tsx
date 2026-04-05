import Link from "next/link";

import { cn } from "@/lib";

type BrandWordmarkProps = {
  href?: string;
  className?: string;
};

export function BrandWordmark({ href = "/", className }: BrandWordmarkProps) {
  const mark = (
    <svg
      viewBox="0 0 188 28"
      aria-hidden="true"
      className={cn("h-7 w-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <rect
          x="1"
          y="2"
          width="24"
          height="24"
          rx="8"
          className="fill-primary/14 stroke-primary/40"
          strokeWidth="1.2"
        />
        <path
          d="M8 14h10M13 9v10"
          className="stroke-primary"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="18.5" cy="9.5" r="2.2" className="fill-chart-2" />
      </g>
      <text
        x="35"
        y="18.7"
        className="fill-foreground"
        style={{
          fontSize: "15px",
          fontWeight: 650,
          letterSpacing: "-0.06em",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
      >
        heyclaude
      </text>
    </svg>
  );

  return (
    <Link href={href} aria-label="HeyClaude home" className="inline-flex items-center">
      {mark}
    </Link>
  );
}
