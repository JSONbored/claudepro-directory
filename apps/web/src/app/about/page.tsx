import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeDollarSign,
  FileText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About HeyClaude",
  description:
    "Learn how HeyClaude reviews content, separates free resources from paid placements, and keeps Claude directory entries useful and transparent.",
  path: "/about",
  keywords: [
    "about heyclaude",
    "claude directory project",
    "open source claude resources",
  ],
});

const principles = [
  {
    icon: FileText,
    title: "File-backed editorial source",
    description:
      "Approved Claude resources live as MDX in the repository. The registry package owns validation, generated artifacts, and channel contracts.",
  },
  {
    icon: ShieldCheck,
    title: "Practical trust signals",
    description:
      "Entries favor source links, install commands, package trust, provenance, and copyable assets over vanity metrics.",
  },
  {
    icon: BadgeDollarSign,
    title: "Disclosed commercial surfaces",
    description:
      "Free listings, affiliate links, featured slots, and sponsored placements are separated and labeled instead of mixed into one ambiguous intake path.",
  },
  {
    icon: UsersRound,
    title: "Maintainer-reviewed contributions",
    description:
      "Community submissions remain issue-first and maintainer-reviewed. Jobs and tool promotions go through private lead intake before publication.",
  },
];

export default function AboutPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "About", url: `${siteConfig.url}/about` },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/about",
      name: "About HeyClaude",
      description:
        "How HeyClaude reviews content and separates editorial and paid placements.",
      breadcrumbId: `${siteConfig.url}/about#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-10 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "About" }]}
        />
        <span className="eyebrow">About</span>
        <h1 className="section-title">
          A useful Claude directory with clear review paths.
        </h1>
        <p className="max-w-3xl text-base leading-8 text-muted-foreground">
          HeyClaude exists to make Claude resources, MCP servers, skills, tools,
          and hiring opportunities easier to find, evaluate, and use without
          hiding the source, review state, or commercial relationship.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {principles.map((principle) => {
          const Icon = principle.icon;
          return (
            <div key={principle.title} className="surface-panel p-6">
              <Icon className="size-5 text-primary" />
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                {principle.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {principle.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Editorial policy
          </p>
          <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
            <p>
              The main directory is not a paid placement database. Agents, MCP
              servers, skills, rules, commands, hooks, guides, collections, and
              statuslines are reviewed as reusable Claude resources.
            </p>
            <p>
              Tools, apps, agencies, services, affiliate offers, and sponsored
              inventory live under the tools and advertising flow. Jobs are
              hiring-only. This keeps user intent clear and prevents product
              submissions from landing in the job queue.
            </p>
            <p>
              D1 stores dynamic state such as votes, listing leads, jobs, and
              sponsorship windows. The canonical editorial registry stays in Git
              so content remains reviewable, portable, and easy to improve.
            </p>
          </div>
        </div>

        <div className="surface-panel p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Choose a path
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              href="/submit"
              className="block rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
            >
              Submit a free Claude resource
            </Link>
            <Link
              href="/tools/submit"
              className="block rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
            >
              Promote or list a tool/app/service
            </Link>
            <Link
              href="/jobs/post"
              className="block rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
            >
              Post a hiring role
            </Link>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
            >
              View the source repository
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
