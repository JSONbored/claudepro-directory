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
  title: "Claim or update a HeyClaude listing",
  description:
    "Request maintainer-reviewed updates to existing HeyClaude listings, attribution profiles, source links, install notes, and claim metadata.",
  path: "/claim",
  keywords: ["claim claude listing", "update claude directory listing"],
});

export default function ClaimPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Claim", url: `${siteConfig.url}/claim` },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/claim",
      name: "Claim or update a HeyClaude listing",
      description:
        "Maintainer-reviewed intake for listing ownership and profile updates.",
      breadcrumbId: `${siteConfig.url}/claim#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_28rem]">
      <JsonLd data={jsonLd} />
      <div className="space-y-6">
        <div className="space-y-4 border-b border-border/80 pb-8">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Claim" }]}
          />
          <span className="eyebrow">Claim or update</span>
          <h1 className="section-title">Request a listing update.</h1>
          <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
            Use this path when you own or maintain a listed project and need to
            update attribution, source links, install notes, or commercial
            profile details. Maintainer review stays required before anything
            changes publicly.
          </p>
        </div>

        <section className="surface-panel space-y-3 p-5 text-sm leading-7 text-muted-foreground">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">
            Review requirements
          </p>
          <p>
            Include a source URL that proves the requested change: a repository,
            docs page, release note, product page, or email domain that matches
            the project owner.
          </p>
          <p>
            New free resources still belong in{" "}
            <Link
              href="/submit"
              className="text-primary underline underline-offset-4"
            >
              the content submission flow
            </Link>
            . Tools, apps, and services belong in{" "}
            <Link
              href="/tools/submit"
              className="text-primary underline underline-offset-4"
            >
              the tools intake
            </Link>
            .
          </p>
        </section>
      </div>

      <ListingLeadForm kind="claim" />
    </div>
  );
}
