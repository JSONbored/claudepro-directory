import Link from "next/link";

import { BrowseDirectory } from "@/components/browse-directory";
import { getAllEntries, getCategorySummaries } from "@/lib/content";

export default async function HomePage() {
  const [entries, categories] = await Promise.all([getAllEntries(), getCategorySummaries()]);
  const totalEntries = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <div className="space-y-16 pb-24">
      <section className="border-b border-border/80">
        <div className="container-shell py-16 text-center sm:py-24">
          <div className="mx-auto max-w-4xl space-y-6">
            <span className="eyebrow">Community directory for Claude</span>
            <h1 className="display-title text-balance">
              Discover the best Claude tools, skills, MCP servers, and workflows.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              A GitHub-native directory for Claude Code setups, MCP integrations,
              prompts, hooks, reusable skills, and practical guides.
            </p>
          <div className="mx-auto flex max-w-md justify-center gap-8 text-center">
            <div>
              <div className="hero-stat-number">{totalEntries}+</div>
              <div className="hero-stat-label">Entries</div>
            </div>
            <div>
              <div className="hero-stat-number">{categories.length}</div>
              <div className="hero-stat-label">Categories</div>
            </div>
            <div>
              <div className="hero-stat-number">
                {categories.find((item) => item.category === "skills")?.count ?? 0}
              </div>
              <div className="hero-stat-label">Skill Packs</div>
            </div>
          </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/browse" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
                Browse
              </Link>
              <Link href="/submit" className="rounded-full border border-border bg-card px-5 py-3 text-sm font-medium">
                Submit
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell max-w-5xl space-y-6">
        <BrowseDirectory entries={entries} limit={15} />
      </section>
    </div>
  );
}
