import { cn } from "@/lib";

type BrandLogotypeProps = {
  className?: string;
  label?: string;
};

export function BrandLogotype({
  className,
  label = "HeyClaude",
}: BrandLogotypeProps) {
  if (label === "HeyClaude") {
    return (
      <svg
        viewBox="0 0 300 56"
        aria-hidden="true"
        className={cn("h-8 w-auto shrink-0", className)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="56" height="56" rx="15" fill="#C855A0" />
        <circle cx="19" cy="28" r="4" fill="#F5F7F2" />
        <path
          d="M 31 23 Q 39 28 31 33"
          stroke="#F5F7F2"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <text
          x="70"
          y="39"
          fontSize="30"
          fontWeight="700"
          letterSpacing="-0.5"
          style={{
            fontFamily:
              'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
          }}
        >
          <tspan className="fill-[#2D1F3D] dark:fill-[#EDE9F0]">Hey</tspan>
          <tspan className="fill-[#C855A0] dark:fill-[#D470B8]">Claude</tspan>
        </text>
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap text-[15px] font-semibold leading-none tracking-normal text-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
