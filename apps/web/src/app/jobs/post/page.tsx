import Link from "next/link";
import { Mail, ArrowUpRight } from "lucide-react";

import { siteConfig } from "@/lib/site";

const tierMap = {
  sponsored: {
    label: "Sponsored",
    checkoutUrl: siteConfig.polarSponsoredJobUrl,
    priceHint: "Top placement + premium styling"
  },
  featured: {
    label: "Featured",
    checkoutUrl: siteConfig.polarFeaturedJobUrl,
    priceHint: "Priority placement + highlighted card"
  },
  standard: {
    label: "Standard",
    checkoutUrl: siteConfig.polarJobBoardUrl,
    priceHint: "Main feed listing with full detail page"
  }
} as const;

type TierKey = keyof typeof tierMap;

function getTier(value?: string): TierKey {
  if (value === "sponsored" || value === "featured") return value;
  return "standard";
}

function getTemplateEmailLink(tier: TierKey) {
  const subject = `[HeyClaude Jobs] ${tierMap[tier].label} listing request`;
  const body = [
    `Tier: ${tierMap[tier].label}`,
    "",
    "Company:",
    "Role title:",
    "Location:",
    "Employment type:",
    "Compensation:",
    "Apply URL:",
    "Company URL:",
    "",
    "Short summary (1-2 sentences):",
    "",
    "Responsibilities (bullets):",
    "- ",
    "",
    "Requirements (bullets):",
    "- ",
    "",
    "Preferred launch date:",
    "Any deadline or expiration date:"
  ].join("\n");

  return `mailto:${siteConfig.jobsEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function JobPostPage({
  searchParams
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const params = await searchParams;
  const tier = getTier(params.tier);
  const selected = tierMap[tier];
  const checkoutIsExternal = selected.checkoutUrl.startsWith("http");

  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">Jobs</span>
        <h1 className="section-title">Post a job to the HeyClaude board.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Choose a listing tier, complete checkout, and send your role details so we can publish your job quickly.
        </p>
      </div>

      <section className="surface-panel space-y-4 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Selected tier</p>
        <div className="flex flex-wrap items-center gap-2">
          {(["sponsored", "featured", "standard"] as const).map((key) => (
            <Link
              key={key}
              href={`/jobs/post?tier=${key}`}
              className={
                key === tier
                  ? "inline-flex rounded-full border border-primary/45 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  : "inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
              }
            >
              {tierMap[key].label}
            </Link>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{selected.priceHint}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={selected.checkoutUrl}
            target={checkoutIsExternal ? "_blank" : undefined}
            rel={checkoutIsExternal ? "noreferrer" : undefined}
            className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <ArrowUpRight className="mr-1.5 size-4" />
            Complete checkout
          </a>
          <a
            href={getTemplateEmailLink(tier)}
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            <Mail className="mr-1.5 size-4" />
            Send templated email
          </a>
        </div>
      </section>

      <section className="surface-panel space-y-3 p-6 text-sm leading-7 text-muted-foreground">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
        <p>1. Choose your tier and complete checkout via Polar.</p>
        <p>2. Send listing details to {siteConfig.jobsEmail} using the templated email button.</p>
        <p>3. We review your listing and publish it on the jobs board.</p>
      </section>
    </div>
  );
}
