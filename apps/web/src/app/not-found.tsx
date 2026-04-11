import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-shell flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="eyebrow">404</span>
      <h1 className="section-title">Page not found.</h1>
      <Link href="/" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
        Back home
      </Link>
    </div>
  );
}
