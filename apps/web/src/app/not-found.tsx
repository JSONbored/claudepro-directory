import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60svh] flex-col items-start justify-center gap-6 py-12">
      <span className="eyebrow">404</span>
      <h1 className="section-title max-w-2xl">
        That page does not exist in the rebuilt directory.
      </h1>
      <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
        The old site had too many routes and too much dead surface area. This one is
        intentionally smaller and cleaner.
      </p>
      <Link href="/" className="link-button link-button-primary">
        Back to homepage
      </Link>
    </div>
  );
}
