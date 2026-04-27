import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { DirectoryEntryCard } from "@/components/directory-entry-card";
import { JsonLd } from "@/components/json-ld";
import { getContributor } from "@/lib/contributors";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

type ContributorPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ContributorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const contributor = await getContributor(slug);

  if (!contributor) {
    return buildPageMetadata({
      title: "Contributor not found",
      description: "The requested contributor profile could not be found.",
      path: `/contributors/${slug}`,
      robots: { index: false, follow: false },
    });
  }

  return buildPageMetadata({
    title: `${contributor.name} on HeyClaude`,
    description: `${contributor.entryCount} accepted HeyClaude entries attributed to ${contributor.name}.`,
    path: `/contributors/${contributor.slug}`,
  });
}

export default async function ContributorPage({
  params,
}: ContributorPageProps) {
  const { slug } = await params;
  const contributor = await getContributor(slug);
  if (!contributor) notFound();

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Contributors", url: `${siteConfig.url}/contributors` },
      {
        name: contributor.name,
        url: `${siteConfig.url}/contributors/${contributor.slug}`,
      },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: `/contributors/${contributor.slug}`,
      name: `${contributor.name} on HeyClaude`,
      description: `${contributor.entryCount} accepted directory entries.`,
      breadcrumbId: `${siteConfig.url}/contributors/${contributor.slug}#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Contributors", href: "/contributors" },
            { label: contributor.name },
          ]}
        />
        <span className="eyebrow">Contributor</span>
        <h1 className="section-title">{contributor.name}</h1>
        <div className="flex flex-wrap gap-2">
          {contributor.profileUrl ? (
            <a
              href={contributor.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
            >
              Source profile
            </a>
          ) : null}
          <Link
            href="/claim"
            className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Claim/update attribution
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        {contributor.entries.map((entry) => (
          <DirectoryEntryCard
            key={`${entry.category}:${entry.slug}`}
            entry={entry}
          />
        ))}
      </section>
    </div>
  );
}
