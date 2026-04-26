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
            {tool.disclosure === "affiliate"
              ? "Affiliate"
              : tool.sponsored
                ? "Sponsored"
                : "Editorial"}
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
          {tool.websiteUrl ? (
            <a
              href={tool.websiteUrl}
              target="_blank"
              rel={linkRel}
              className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <ArrowUpRight className="mr-1.5 size-4" />
              Open website
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
    </div>
  );
}
