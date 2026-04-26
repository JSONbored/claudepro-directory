import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { ListingLeadForm } from "@/components/listing-lead-form";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

const tierMap = {
  sponsored: {
    label: "Sponsored",
    priceHint: "Top placement + premium styling",
  },
  featured: {
    label: "Featured",
    priceHint: "Priority placement + highlighted card",
  },
  standard: {
    label: "Standard",
    priceHint: "Main feed listing with full detail page",
  },
} as const;

type TierKey = keyof typeof tierMap;

export const metadata: Metadata = buildPageMetadata({
  title: "Post a job on HeyClaude",
  description:
    "Submit a real Claude or AI workflow hiring role for maintainer review before publication.",
  path: "/jobs/post",
  keywords: ["post ai job", "post claude job", "heyclaude jobs listing"],
});

function getTier(value?: string): TierKey {
  if (value === "sponsored" || value === "featured") return value;
  return "standard";
}

export default async function JobPostPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const params = await searchParams;
  const tier = getTier(params.tier);
  const selected = tierMap[tier];
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Jobs", url: `${siteConfig.url}/jobs` },
      { name: "Post", url: `${siteConfig.url}/jobs/post` },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/jobs/post",
      name: "Post a job on HeyClaude",
      description: "Lead intake for real Claude and AI workflow hiring roles.",
      breadcrumbId: `${siteConfig.url}/jobs/post#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_28rem]">
      <JsonLd data={jsonLd} />
      <div className="space-y-8">
        <div className="space-y-4 border-b border-border/80 pb-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Jobs", href: "/jobs" },
              { label: "Post" },
            ]}
          />
          <span className="eyebrow">Jobs</span>
          <h1 className="section-title">Post a real hiring role.</h1>
          <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
            This form is only for hiring roles. Tool, app, service, affiliate,
            and sponsored product listings belong in the tools intake flow.
          </p>
        </div>

        <section className="surface-panel space-y-4 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">
            Selected hiring tier
          </p>
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
        </section>

        <section className="surface-panel space-y-3 p-6 text-sm leading-7 text-muted-foreground">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
          <p>1. Send the role details for maintainer review.</p>
          <p>
            2. We confirm fit, timing, and any placement tier before payment.
          </p>
          <p>
            3. Approved roles are published as real jobs with a detail page.
          </p>
          <p>
            Promoting a product instead? Use{" "}
            <Link
              href="/tools/submit"
              className="text-primary underline underline-offset-4"
            >
              the tools listing form
            </Link>
            .
          </p>
        </section>
      </div>

      <ListingLeadForm kind="job" tier={tier} />
    </div>
  );
}
