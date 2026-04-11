type TwitterMarkProps = {
  className?: string;
};

export function TwitterMark({ className }: TwitterMarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.91 2H21l-4.57 5.23L22 15.6h-4.43l-3.47-4.54L10.1 15.6H8l4.89-5.6L7.64 2h4.53l3.14 4.12L18.91 2Zm-1.55 12.26h1.22L11.5 3.27h-1.3l7.16 10.99Z" />
    </svg>
  );
}
