import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { getSeoCluster, getSeoClusterDefinitions } from "@/lib/seo-clusters";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@heyclaude/registry/seo";

type ClusterPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getSeoClusterDefinitions().map((cluster) => ({ slug: cluster.slug }));
}

export async function generateMetadata({
  params,
}: ClusterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cluster = await getSeoCluster(slug);
  if (!cluster) {
    return buildPageMetadata({
      title: "Cluster not found",
      description: "The requested editorial cluster could not be found.",
      path: `/best/${slug}`,
      robots: { index: false, follow: false },
    });
  }

  return buildPageMetadata({
    title: cluster.seoTitle,
    description: cluster.seoDescription,
    path: `/best/${cluster.slug}`,
    keywords: ["claude tools", "agent workflows", cluster.eyebrow],
  });
}

export default async function SeoClusterPage({ params }: ClusterPageProps) {
  const { slug } = await params;
  const cluster = await getSeoCluster(slug);
  if (!cluster) notFound();

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Best", url: `${siteConfig.url}/best/${cluster.slug}` },
      {
        name: cluster.title,
        url: `${siteConfig.url}/best/${cluster.slug}`,
      },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: `/best/${cluster.slug}`,
      name: cluster.title,
      description: cluster.description,
      breadcrumbId: `${siteConfig.url}/best/${cluster.slug}#breadcrumb`,
    }),
    buildItemListJsonLd(
      cluster.items.map((item) => ({
        name: item.title,
        url: `${siteConfig.url}${item.url}`,
      })),
      {
        name: cluster.title,
        description: cluster.description,
      },
    ),
  ];

  return (
    <main className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <header className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Best" },
            { label: cluster.title },
          ]}
        />
        <span className="eyebrow">{cluster.eyebrow}</span>
        <h1 className="section-title text-balance">{cluster.title}</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          {cluster.description}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {cluster.items.map((item) => (
          <article
            key={`${item.category}:${item.slug}`}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2.5 py-1">
                {item.category}
              </span>
              {item.disclosure ? (
                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                  {item.disclosure.replace(/_/g, " ")}
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              <Link href={item.url}>{item.title}</Link>
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {item.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
