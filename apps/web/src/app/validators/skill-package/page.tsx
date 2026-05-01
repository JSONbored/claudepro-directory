import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SkillValidatorClient } from "@/components/skill-validator-client";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Agent Skill package validator",
  description:
    "Validate Agent Skill zip packages for HeyClaude submissions, including SKILL.md frontmatter, resource references, checksums, and platform adapter readiness.",
  path: "/validators/skill-package",
  keywords: [
    "agent skill validator",
    "claude skills",
    "codex skills",
    "heyclaude submission",
  ],
});

export default function SkillValidatorPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Validators", url: `${siteConfig.url}/validators` },
      {
        name: "Skill package validator",
        url: `${siteConfig.url}/validators/skill-package`,
      },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/validators/skill-package",
      name: "Agent Skill package validator",
      description:
        "Browser-side Agent Skill zip validation for HeyClaude submissions.",
      breadcrumbId: `${siteConfig.url}/validators/skill-package#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Validators", href: "/validators" },
            { label: "Skill package" },
          ]}
        />
        <span className="eyebrow">Validator</span>
        <h1 className="section-title">Agent Skill package validator</h1>
        <p className="max-w-3xl text-base leading-8 text-muted-foreground">
          Check an installable skill package locally, then open a review-ready
          GitHub issue when the package passes.
        </p>
      </div>
      <SkillValidatorClient />
    </div>
  );
}
