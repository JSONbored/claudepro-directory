import { cn } from "@/lib";

type BrandLogotypeProps = {
  className?: string;
  label?: string;
};

export function BrandLogotype({
  className,
  label = "HeyClaude",
}: BrandLogotypeProps) {
  return (
    <svg
      viewBox="0 0 160 24"
      aria-hidden="true"
      className={cn("h-6 w-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="16.6"
        className="fill-foreground"
        style={{
          fontSize: "15px",
          fontWeight: 640,
          letterSpacing: "-0.045em",
          fontFamily:
            '"Manrope", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {label}
      </text>
    </svg>
  );
}
