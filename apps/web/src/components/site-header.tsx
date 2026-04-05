import Link from "next/link";

import { BrandWordmark } from "@/components/brand-wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-6">
        <BrandWordmark />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/submit"
            className="inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Submit
          </Link>
        </div>
      </div>
    </header>
  );
}
