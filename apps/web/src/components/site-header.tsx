import Link from "next/link";

import { BrandWordmark } from "@/components/brand-wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur">
      <div className="container-shell flex h-15 items-center justify-between gap-6">
        <BrandWordmark />
        <div className="ml-auto flex items-center gap-2.5 md:gap-3">
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 transition hover:bg-card hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <Link
            href="/submit"
            className="inline-flex items-center rounded-full border border-primary/35 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_26px_-12px_color-mix(in_oklab,var(--primary)_74%,transparent)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-14px_color-mix(in_oklab,var(--primary)_80%,transparent)]"
          >
            Submit
          </Link>
        </div>
      </div>
    </header>
  );
}
