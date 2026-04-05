import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:color-mix(in_oklab,var(--bg)_86%,transparent)] backdrop-blur-2xl">
      <div className="container flex items-center justify-between gap-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-[0.7rem] uppercase tracking-[0.32em] text-[var(--muted)]">
            Hey
          </span>
          <span className="text-xl font-semibold tracking-[-0.06em] text-[var(--ink)]">
            Clau.de
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[var(--ink)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/submit" className="link-button link-button-primary text-sm">
            Submit
          </Link>
        </div>
      </div>
    </header>
  );
}
