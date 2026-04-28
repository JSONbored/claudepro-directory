import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Megaphone, PlusCircle } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Advertise or submit to HeyClaude",
  description:
    "Choose the right HeyClaude intake path for tool sponsorships, hiring roles, claim requests, or free Claude and AI workflow resources.",
  path: "/advertise",
  keywords: [
    "advertise claude tools",
    "sponsor ai directory",
    "post claude job",
  ],
});

const paths = [
  {
    href: "/tools/submit",
    icon: Megaphone,
    title: "Promote a tool, app, or service",
    description:
      "For products, hosted apps, agencies, services, affiliate opportunities, and paid featured or sponsored placements.",
    cta: "Open tools intake",
  },
  {
    href: "/jobs/post",
    icon: BriefcaseBusiness,
    title: "Post a hiring role",
    description:
      "For real jobs only: engineering, AI product, MCP, agent, prompt, and Claude workflow roles.",
    cta: "Open jobs intake",
  },
  {
    href: "/submit",
    icon: PlusCircle,
    title: "Submit a free Claude resource",
    description:
      "For community agents, MCP servers, skills, rules, commands, hooks, guides, collections, and statuslines.",
    cta: "Open content intake",
  },
];

export default function AdvertisePage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Advertise", url: `${siteConfig.url}/advertise` },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/advertise",
      name: "Advertise or submit to HeyClaude",
      description:
        "Choose the right HeyClaude intake path for tools, jobs, or free Claude resources.",
      breadcrumbId: `${siteConfig.url}/advertise#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Advertise" }]}
        />
        <span className="eyebrow">Advertise</span>
        <h1 className="section-title">Choose the right intake path.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          HeyClaude separates editorial submissions, commercial product
          listings, and hiring roles so every request lands in the right review
          queue.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {paths.map((path) => {
          const Icon = path.icon;
          return (
            <Link
              key={path.href}
              href={path.href}
              className="surface-panel group flex min-h-72 flex-col justify-between p-6 transition hover:border-primary/45"
            >
              <div className="space-y-4">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {path.title}
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {path.description}
                  </p>
                </div>
              </div>
              <span className="mt-6 inline-flex text-sm font-medium text-primary transition group-hover:translate-x-1">
                {path.cta}
              </span>
            </Link>
          );
        })}
      </section>

      <section className="surface-panel space-y-4 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          Disclosure examples
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            [
              "Editorial",
              "Free listing reviewed for usefulness and fit. Ranking is not paid.",
            ],
            [
              "Featured",
              "Paid or manually selected highlight. The card is labeled Featured.",
            ],
            [
              "Sponsored",
              "Paid placement. Outbound links use sponsored/no-follow treatment.",
            ],
          ].map(([title, copy]) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-background p-4"
            >
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
