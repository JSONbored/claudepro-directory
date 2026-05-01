import type { Metadata } from "next";
import Link from "next/link";
import { FileArchive, FileJson2 } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@heyclaude/registry/seo";

const validators = [
  {
    title: "Agent Skill package validator",
    description:
      "Validate SKILL.md frontmatter, package references, checksum facts, and submission metadata before opening a reviewed skill submission.",
    href: "/validators/skill-package",
    icon: FileArchive,
  },
  {
    title: "MCP config validator",
    description:
      "Check MCP JSON shape, package targets, placeholders, risky shell syntax, remote URLs, and secret-like values with redacted output.",
    href: "/validators/mcp-config",
    icon: FileJson2,
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Claude and MCP validators",
  description:
    "Use HeyClaude validators for Agent Skill packages and MCP configuration JSON before submitting resources or configuring Claude-compatible AI tools.",
  path: "/validators",
  keywords: [
    "claude validators",
    "mcp validator",
    "agent skill validator",
    "heyclaude submission tools",
  ],
});

export default function ValidatorsPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Validators", url: `${siteConfig.url}/validators` },
    ]),
    buildCollectionPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/validators",
      name: "Claude and MCP validators",
      description:
        "Internal HeyClaude validation utilities for Agent Skill packages and MCP configuration JSON.",
      breadcrumbId: `${siteConfig.url}/validators#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Validators" }]}
        />
        <span className="eyebrow">Validators</span>
        <h1 className="section-title">Validation utilities for Claude work.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Browser-side checks for packages and configuration snippets before
          they become submissions, install instructions, or local setup changes.
          These tools do not upload packages, store secrets, or mutate local
          files.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {validators.map((validator) => {
          const Icon = validator.icon;
          return (
            <Link
              key={validator.href}
              href={validator.href}
              className="surface-panel group p-5 transition hover:border-primary/50"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                {validator.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {validator.description}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
