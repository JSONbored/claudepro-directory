import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Claude ecosystem board",
  description:
    "Track Claude ecosystem releases, package updates, events, community notes, and HeyClaude registry signals in one planning surface.",
  path: "/ecosystem",
});

const boards = [
  {
    title: "Releases",
    description: "Version launches, package updates, and registry additions.",
  },
  {
    title: "Community",
    description:
      "Contributor updates, project ownership changes, and calls for review.",
  },
  {
    title: "Events",
    description: "Meetups, streams, workshops, and implementation sessions.",
  },
  {
    title: "News",
    description:
      "Claude ecosystem changes worth turning into directory updates.",
  },
];

export default function EcosystemPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Ecosystem", url: `${siteConfig.url}/ecosystem` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/ecosystem",
      name: "Claude ecosystem board",
      description:
        "News, releases, events, and community updates for future HeyClaude content operations.",
      breadcrumbId: `${siteConfig.url}/ecosystem#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Ecosystem" }]}
        />
        <span className="eyebrow">Ecosystem</span>
        <h1 className="section-title">Ecosystem board.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          This is the intake structure for future news, releases, events, and
          community posts. It stays empty of fake posts until real submissions
          or maintainer-reviewed updates are available.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {boards.map((board) => (
          <article key={board.title} className="surface-panel p-5">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {board.title}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {board.description}
            </p>
          </article>
        ))}
      </section>

      <section className="surface-panel p-5 text-sm leading-7 text-muted-foreground">
        Submit Claude resources through{" "}
        <Link
          href="/submit"
          className="text-primary underline underline-offset-4"
        >
          the content flow
        </Link>
        , or use{" "}
        <Link
          href="/tools/submit"
          className="text-primary underline underline-offset-4"
        >
          tools intake
        </Link>{" "}
        for products and services.
      </section>
    </div>
  );
}
