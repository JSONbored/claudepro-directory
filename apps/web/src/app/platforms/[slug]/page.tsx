import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import {
  getPlatformPage,
  getPlatformPageDefinitions,
} from "@/lib/platform-pages";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from "@heyclaude/registry/seo";

type PlatformPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPlatformPageDefinitions().map((platform) => ({
    slug: platform.slug,
  }));
}

export async function generateMetadata({
  params,
}: PlatformPageProps): Promise<Metadata> {
  const { slug } = await params;
  const platform = await getPlatformPage(slug);
  if (!platform) {
    return buildPageMetadata({
      title: "Platform not found",
      description: "The requested HeyClaude platform page could not be found.",
      path: `/platforms/${slug}`,
      robots: { index: false, follow: false },
    });
  }

  return buildPageMetadata({
    title: platform.seoTitle,
    description: platform.seoDescription,
    path: `/platforms/${platform.slug}`,
    keywords: ["agent skills", platform.platform, "skill compatibility"],
    imageLabel: platform.platform,
    imageKind: "platform",
    imageBadge: "Platform compatibility",
  });
}

export default async function PlatformDetailPage({
  params,
}: PlatformPageProps) {
  const { slug } = await params;
  const platform = await getPlatformPage(slug);
  if (!platform) notFound();

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Platforms", url: `${siteConfig.url}/platforms` },
      {
        name: platform.title,
        url: `${siteConfig.url}/platforms/${platform.slug}`,
      },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: `/platforms/${platform.slug}`,
      name: platform.title,
      description: platform.description,
      breadcrumbId: `${siteConfig.url}/platforms/${platform.slug}#breadcrumb`,
    }),
    buildItemListJsonLd(
      platform.items.slice(0, 24).map((item) => ({
        name: item.title,
        url: `${siteConfig.url}${item.url}`,
      })),
      {
        name: platform.title,
        description: platform.description,
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
            { label: "Platforms", href: "/platforms" },
            { label: platform.title },
          ]}
        />
        <span className="eyebrow">{platform.eyebrow}</span>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <h1 className="section-title text-balance">{platform.title}</h1>
            <p className="text-sm leading-8 text-muted-foreground">
              {platform.description}
            </p>
          </div>
          <Link
            href={platform.feedUrl}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/50"
          >
            Open JSON feed
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {platform.items.map((item) => (
          <article
            key={item.slug}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2.5 py-1">
                {item.supportLevel.replace(/-/g, " ")}
              </span>
              {item.verifiedAt ? (
                <span className="rounded-full border border-border bg-background px-2.5 py-1">
                  Verified {item.verifiedAt}
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              <Link href={item.url}>{item.title}</Link>
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {item.description}
            </p>
            <div className="mt-4 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Install path:</span>{" "}
              <code>{item.installPath}</code>
              {item.adapterPath ? (
                <p className="mt-2">
                  <span className="font-medium text-foreground">Adapter:</span>{" "}
                  <Link
                    href={item.adapterPath}
                    className="text-primary underline underline-offset-4"
                  >
                    {item.adapterPath}
                  </Link>
                </p>
              ) : null}
            </div>
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
