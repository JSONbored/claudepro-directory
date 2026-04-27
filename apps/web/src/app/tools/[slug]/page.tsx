import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CircleDollarSign,
} from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CommunitySignalPanel } from "@/components/community-signal-panel";
import { JsonLd } from "@/components/json-ld";
import { getToolBySlug } from "@/lib/tools";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildToolSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";
import { linkRelForDisclosure } from "@heyclaude/registry/commercial";

type ToolDetailProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

function disclosureLabel(tool: Awaited<ReturnType<typeof getToolBySlug>>) {
  if (!tool) return "Editorial";
  if (tool.sponsored) return "Sponsored";
  if (tool.disclosure === "affiliate") return "Affiliate";
  if (tool.disclosure === "heyclaude_pick") return "HeyClaude pick";
  if (tool.disclosure === "claimed") return "Claimed";
  if (tool.featured) return "Featured";
  return "Editorial";
}

function disclosureDescription(
  tool: NonNullable<Awaited<ReturnType<typeof getToolBySlug>>>,
) {
  if (tool.sponsored) {
    return "Paid placement. It is visually labeled and does not suppress review or report signals.";
  }
  if (tool.disclosure === "affiliate") {
    return "Editorial listing with an affiliate link. Ranking is not based on payout.";
  }
  if (tool.disclosure === "heyclaude_pick") {
    return "Editorial pick selected for fit with Claude-native workflows.";
  }
  if (tool.disclosure === "claimed") {
    return "Maintainer-reviewed listing with an ownership or update request on file.";
  }
  return "Free editorial listing reviewed for usefulness and fit.";
}

export async function generateMetadata({
  params,
}: ToolDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return buildPageMetadata({
      title: "Tool listing not found",
      description: "The requested tool listing could not be found.",
      path: `/tools/${slug}`,
      robots: { index: false, follow: false },
    });
  }

  return buildPageMetadata({
    title: tool.seoTitle ?? tool.title,
    description: tool.seoDescription ?? tool.description,
    path: `/tools/${tool.slug}`,
    keywords: [...(tool.keywords ?? []), ...(tool.tags ?? []), "claude tools"],
  });
}

export default async function ToolDetailPage({ params }: ToolDetailProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const linkRel = linkRelForDisclosure(
    tool.sponsored ? "sponsored" : tool.disclosure,
  );
  const primaryUrl = tool.affiliateUrl || tool.websiteUrl;
  const visibleDisclosure = disclosureLabel(tool);
  const sourceLinks = [
    tool.websiteUrl ? "Official website" : "",
    tool.documentationUrl ? "Documentation" : "",
    tool.repoUrl ? "Source repository" : "",
  ].filter(Boolean);
  const worksWith = [...(tool.tags ?? [])].slice(0, 5);
  const setupEffort =
    tool.estimatedSetupTime ||
    (tool.pricingModel === "contact-sales"
      ? "Requires vendor conversation"
      : "Varies by workspace");
  const requiredAuth =
    tool.pricingModel === "open-source" || tool.pricingModel === "free"
      ? "May support local or free usage; confirm account requirements in the official docs."
      : "Expect account, billing, API key, or workspace setup before production use.";
  const lastVerified = tool.verifiedAt || tool.dateAdded || "";
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Tools", url: `${siteConfig.url}/tools` },
      { name: tool.title, url: `${siteConfig.url}/tools/${tool.slug}` },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: `/tools/${tool.slug}`,
      name: tool.title,
      description: tool.seoDescription || tool.description,
      breadcrumbId: `${siteConfig.url}/tools/${tool.slug}#breadcrumb`,
    }),
    buildToolSoftwareApplicationJsonLd(tool, { siteUrl: siteConfig.url }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: tool.title },
          ]}
        />
        <Link href="/tools" className="eyebrow">
          Tools
        </Link>
        <h1 className="section-title text-balance">{tool.title}</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          {tool.description}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1">
            <BadgeCheck className="mr-1.5 size-3.5" />
            {visibleDisclosure}
          </span>
          {tool.pricingModel ? (
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1">
              <CircleDollarSign className="mr-1.5 size-3.5" />
              {tool.pricingModel}
            </span>
          ) : null}
        </div>
      </div>

      <section className="surface-panel space-y-4 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Listing details
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          {tool.cardDescription || tool.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {primaryUrl ? (
            <a
              href={primaryUrl}
              target="_blank"
              rel={linkRel}
              className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <ArrowUpRight className="mr-1.5 size-4" />
              {tool.disclosure === "affiliate"
                ? "Open affiliate link"
                : "Open website"}
            </a>
          ) : null}
          {tool.documentationUrl ? (
            <a
              href={tool.documentationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
            >
              <BookOpen className="mr-1.5 size-4" />
              Documentation
            </a>
          ) : null}
          <Link
            href="/tools/submit"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Claim or update listing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          ["Use this when", tool.cardDescription || tool.description],
          ["Setup effort", setupEffort],
          ["Required auth", requiredAuth],
          [
            "Works with",
            worksWith.length ? worksWith.join(", ") : "Claude-native teams",
          ],
          [
            "Last verified",
            lastVerified
              ? lastVerified.slice(0, 10)
              : "Review official docs before production use",
          ],
          [
            "Source/provenance",
            sourceLinks.length
              ? sourceLinks.join(", ")
              : "First-party editorial listing",
          ],
          ["Disclosure", disclosureDescription(tool)],
          [
            "Report broken",
            "Use the signal panel below to flag broken setup, stale links, or incorrect listing details.",
          ],
        ].map(([title, copy]) => (
          <article key={title} className="surface-panel p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">
              {title}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {copy}
            </p>
          </article>
        ))}
      </section>

      <CommunitySignalPanel targetKind="tool" targetKey={`tool:${tool.slug}`} />
    </div>
  );
}
