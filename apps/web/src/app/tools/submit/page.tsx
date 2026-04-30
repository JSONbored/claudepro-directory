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

export const metadata: Metadata = buildPageMetadata({
  title: "Submit a tool, app, or service",
  description:
    "Submit a Claude-related tool, app, service, or product for free editorial review or optional paid placement.",
  path: "/tools/submit",
  keywords: ["submit claude tool", "sponsor claude tool", "ai app directory"],
});

export default function ToolSubmitPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Tools", url: `${siteConfig.url}/tools` },
      { name: "Submit", url: `${siteConfig.url}/tools/submit` },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/tools/submit",
      name: "Submit a tool, app, or service",
      description:
        "Lead intake for Claude-related tools, apps, services, and optional paid placements.",
      breadcrumbId: `${siteConfig.url}/tools/submit#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_28rem]">
      <JsonLd data={jsonLd} />
      <div className="space-y-6">
        <div className="space-y-4 border-b border-border/80 pb-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Tools", href: "/tools" },
              { label: "Submit" },
            ]}
          />
          <span className="eyebrow">Tool submission</span>
          <h1 className="section-title">Submit a tool, app, or service.</h1>
          <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
            This is separate from the free Claude resource intake. Use it for
            products, hosted apps, consulting/services, paid tools, and
            affiliate or sponsored opportunities.
          </p>
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            [
              "Free editorial",
              "Reviewed for usefulness and fit. No payment required.",
            ],
            ["Featured", "Priority placement after approval, clearly labeled."],
            [
              "Sponsored",
              "Pinned placement with explicit sponsorship disclosure.",
            ],
          ].map(([title, description]) => (
            <div key={title} className="surface-panel p-4">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </section>

        <div className="rounded-2xl border border-border bg-card/70 p-5 text-sm leading-7 text-muted-foreground">
          Submit free Claude agents, MCP servers, skills, commands, hooks,
          rules, guides, collections, and statuslines through{" "}
          <Link
            href="/submit"
            className="text-primary underline underline-offset-4"
          >
            the content submission flow
          </Link>
          . This form is only for products and commercial listings.
        </div>
      </div>

      <ListingLeadForm kind="tool" />
    </div>
  );
}
