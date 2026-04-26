import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { ToolsDirectory } from "@/components/tools-directory";
import { getTools } from "@/lib/tools";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@heyclaude/registry/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Claude tools, apps, and services",
  description:
    "Discover vetted tools, apps, services, and products for Claude-native builders. Free editorial listings and disclosed paid placements.",
  path: "/tools",
  keywords: ["claude tools", "claude apps", "mcp tools", "ai developer tools"],
});

export default async function ToolsPage() {
  const tools = await getTools();
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Tools", url: `${siteConfig.url}/tools` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/tools",
      name: "Claude tools, apps, and services",
      description:
        "Apps, tools, services, and products for Claude-native builders.",
      breadcrumbId: `${siteConfig.url}/tools#breadcrumb`,
    }),
    buildItemListJsonLd(
      tools.map((tool) => ({
        name: tool.title,
        url: `${siteConfig.url}/tools/${tool.slug}`,
      })),
      {
        name: "HeyClaude tools directory",
        description:
          "Apps, tools, services, and products for Claude-native builders.",
      },
    ),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Tools" }]}
        />
        <span className="eyebrow">Tools</span>
        <h1 className="section-title">
          Tools, apps, and services for Claude builders.
        </h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          A separate commercial/editorial directory for products that help
          people build with Claude. Organic listings are free and reviewed; paid
          placements are optional and clearly disclosed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tools/submit"
            className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Submit a tool
          </Link>
          <Link
            href="/advertise"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Sponsorship options
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Submit free resource
          </Link>
        </div>
      </div>
      <ToolsDirectory tools={tools} />
    </div>
  );
}
