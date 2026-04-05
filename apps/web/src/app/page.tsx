import Link from "next/link";
import { Blocks, FolderKanban, Package2 } from "lucide-react";

import { BrowseDirectory } from "@/components/browse-directory";
import { getAllEntries, getCategorySummaries } from "@/lib/content";

export default async function HomePage() {
  const [entries, categories] = await Promise.all([getAllEntries(), getCategorySummaries()]);
  const totalEntries = categories.reduce((sum, category) => sum + category.count, 0);
  const skillPacks = categories.find((item) => item.category === "skills")?.count ?? 0;
  const featuredCategories = categories.slice(0, 6);

  return (
    <div className="pb-24">
      <section className="border-b border-border/80">
        <div className="container-shell py-14 text-center sm:py-18">
          <div className="mx-auto max-w-4xl space-y-5">
            <span className="eyebrow">Community directory for Claude</span>
            <h1 className="display-title text-balance">
              Discover the best Claude tools, skills, MCP servers, and workflows.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              A GitHub-native directory for Claude Code setups, MCP integrations,
              prompts, hooks, reusable skills, and practical guides.
            </p>
            <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3 text-left">
              <div className="hero-count-pill">
                <Blocks className="size-4 text-primary" />
                <div>
                  <div className="hero-stat-number">{totalEntries.toLocaleString()}+</div>
                  <div className="hero-stat-label">Entries</div>
                </div>
              </div>
              <div className="hero-count-pill">
                <FolderKanban className="size-4 text-primary" />
                <div>
                  <div className="hero-stat-number">{categories.length}</div>
                  <div className="hero-stat-label">Categories</div>
                </div>
              </div>
              <div className="hero-count-pill">
                <Package2 className="size-4 text-primary" />
                <div>
                  <div className="hero-stat-number">{skillPacks}</div>
                  <div className="hero-stat-label">Skill Packs</div>
                </div>
              </div>
            </div>
            <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
              {featuredCategories.map((category) => (
                <Link
                  key={category.category}
                  href={`/${category.category}`}
                  className="hero-category-link"
                >
                  {category.label}
                  <span className="ml-2 text-primary">{category.count}</span>
                </Link>
              ))}
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
          <div className="mx-auto mt-12 max-w-[52rem] text-left">
            <BrowseDirectory entries={entries} limit={15} />
          </div>
        </div>
      </section>
    </div>
  );
}
