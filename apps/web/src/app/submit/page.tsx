import type { Metadata } from "next";

import { SubmitForm } from "@/components/submit-form";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Submit a new directory entry",
  description:
    "Submit agents, MCP servers, skills, rules, hooks, commands, and statuslines through schema-aligned GitHub issue templates.",
  path: "/submit",
  keywords: ["submit claude skill", "submit mcp server", "heyclaude contribution"]
});

export default function SubmitPage() {
  return (
    <div className="border-b border-border/80">
      <section className="container-shell grid min-h-[calc(100vh-8rem)] gap-12 py-16 lg:grid-cols-[1fr_620px] lg:items-center">
        <div className="space-y-6">
          <span className="eyebrow">Submit</span>
          <div className="space-y-4">
            <h1 className="section-title text-balance">Submit a tool or resource.</h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              Share an agent, MCP server, skill pack, rule set, hook, command,
              or statusline with the HeyClaude community.
            </p>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              This stays intentionally lightweight. Fill out the form and we open a
              category-specific GitHub issue template with schema-aligned fields.
            </p>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Skill submissions now support both general skills and deep capability packs
              with verification metadata and retrieval sources.
            </p>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Job listings are private and handled separately through the{" "}
              <a href="/jobs/post" className="text-primary underline underline-offset-4">
                jobs intake flow
              </a>
              .
            </p>
          </div>

          <div className="submit-orb-wrap" aria-hidden="true">
            <div className="submit-orb" />
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">
              Submit to HeyClaude
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              GitHub is the backend here. The form below opens a clean category template
              so maintainers can review and import submissions without email back-and-forth.
            </p>
          </div>

          <SubmitForm />

          <div className="rounded-2xl border border-border/80 bg-card/70 px-5 py-4 text-sm leading-7 text-muted-foreground">
            If you are sharing something installable, include the real command or the
            exact config somebody would need to use it. The goal is to keep new entries
            useful on day one, not just listed.
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/70 px-5 py-4 text-sm leading-7 text-muted-foreground">
            <p className="font-medium text-foreground">Contributor references</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={`${siteConfig.githubUrl}/tree/main/examples/content`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40"
              >
                Content examples
              </a>
              <a
                href={`${siteConfig.githubUrl}/blob/main/examples/content/SCHEMA.md`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40"
              >
                Schema reference
              </a>
              <a
                href={`${siteConfig.githubUrl}/issues/new/choose`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40"
              >
                Issue templates
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
