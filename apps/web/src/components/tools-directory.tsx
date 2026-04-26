import Link from "next/link";
import { ArrowUpRight, BadgeCheck, CircleDollarSign } from "lucide-react";
import type { ToolListing } from "@heyclaude/registry";

type ToolsDirectoryProps = {
  tools: ToolListing[];
};

function disclosureLabel(tool: ToolListing) {
  if (tool.sponsored) return "Sponsored";
  if (tool.disclosure === "affiliate") return "Affiliate";
  if (tool.featured) return "Featured";
  return "Editorial";
}

export function ToolsDirectory({ tools }: ToolsDirectoryProps) {
  if (!tools.length) {
    return (
      <section className="surface-panel space-y-4 p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Open inventory</p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Tool listings are open for maintainer review.
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Free organic listings are reviewed for usefulness and fit. Featured and sponsored placements are available after approval and are always labeled.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/tools/submit" className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Submit a tool
          </Link>
          <Link href="/advertise" className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40">
            Advertising options
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tools.map((tool) => {
        const paid = tool.sponsored || tool.disclosure === "affiliate";
        return (
          <article
            key={tool.slug}
            className={
              tool.sponsored
                ? "surface-panel border-primary/45 bg-card p-6 shadow-lg"
                : "surface-panel p-6"
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 font-medium text-foreground">
                  {disclosureLabel(tool)}
                </span>
                {tool.pricingModel ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5">
                    <CircleDollarSign className="size-3" />
                    {tool.pricingModel}
                  </span>
                ) : null}
                {tool.websiteUrl ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5">
                    <BadgeCheck className="size-3" />
                    website
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">{tool.title}</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  {tool.cardDescription || tool.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/tools/${tool.slug}`} className="directory-link-chip">
                  Details
                </Link>
                {tool.websiteUrl ? (
                  <a
                    href={tool.websiteUrl}
                    target="_blank"
                    rel={paid ? "sponsored nofollow noreferrer" : "noreferrer"}
                    className="directory-link-chip"
                  >
                    <ArrowUpRight className="size-3.5" />
                    Website
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
