import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FolderKanban,
  Sparkles,
  Zap
} from "lucide-react";

import { BrowseDirectory } from "@/components/browse-directory";
import {
  getAllEntries,
  getCategorySummaries,
  getRecentEntries
} from "@/lib/content";
import { featuredSurfaces, siteConfig } from "@/lib/site";

export default async function HomePage() {
  const [categories, entries, recent] = await Promise.all([
    getCategorySummaries(),
    getAllEntries(),
    getRecentEntries()
  ]);

  const totalEntries = categories.reduce((sum, item) => sum + item.count, 0);
  const packagedSkills =
    categories.find((category) => category.category === "skills")?.count ?? 0;

  return (
    <div className="space-y-20 pb-24">
      <section className="hero-shell border-b border-[var(--line)]">
        <div className="container py-14 md:py-18">
          <div className="mx-auto max-w-[58rem] space-y-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line)] bg-[color:color-mix(in_oklab,var(--panel-strong)_94%,transparent)] text-[var(--accent)]">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-5">
              <h1 className="hero-massive mx-auto max-w-[52rem] text-balance">
                Discover the best Claude agents, MCP servers, skills, guides, and workflows.
              </h1>
              <p className="hero-subcopy mx-auto max-w-[40rem]">
                The community-built directory for Claude Code, MCP, prompts, rules,
                and reusable workflows. Find, evaluate, and open the strongest assets fast.
              </p>
            </div>
            <div className="grid gap-3 pt-4 sm:grid-cols-3">
              <div className="stat-chip p-4 text-left">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Entries
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.08em]">
                  {totalEntries}
                </p>
              </div>
              <div className="stat-chip p-4 text-left">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Categories
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.08em]">
                  {categories.length}
                </p>
              </div>
              <div className="stat-chip p-4 text-left">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Skill packs
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.08em]">
                  {packagedSkills}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/browse" className="link-button link-button-primary">
                Browse
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/submit" className="link-button link-button-secondary">
                Submit
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-[68rem] space-y-6">
        <BrowseDirectory entries={entries} limit={18} />
      </section>

      <section className="container grid gap-8 md:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <span className="eyebrow">Recently added</span>
          <div className="panel rounded-[1.75rem] p-6">
            <div className="space-y-5">
              {recent.slice(0, 5).map((entry) => (
                <Link
                  key={`${entry.category}-${entry.slug}`}
                  href={`/${entry.category}/${entry.slug}`}
                  className="block border-b border-[var(--line)] pb-5 last:border-none last:pb-0"
                >
                  <p className="text-sm text-[var(--muted)]">
                    {entry.category} {entry.dateAdded ? `• ${entry.dateAdded}` : ""}
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                    {entry.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <span className="eyebrow">Explore more</span>
          <div className="space-y-4">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.category}
                href={`/${category.category}`}
                className="panel block rounded-[1.5rem] p-5 transition hover:-translate-y-0.5"
              >
                <p className="text-lg font-semibold tracking-[-0.03em]">
                  {category.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-4 md:grid-cols-3">
        <Link href="/jobs" className="panel rounded-[1.5rem] p-6">
          <BriefcaseBusiness className="h-6 w-6 text-[var(--accent)]" />
          <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            Jobs
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Hiring opportunities for people working with Claude, MCP, prompts, and AI tools.
          </p>
        </Link>
        <Link href="/advertise" className="panel rounded-[1.5rem] p-6">
          <Zap className="h-6 w-6 text-[var(--signal-amber)]" />
          <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            Sponsor spots
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Featured placements for relevant tools, launches, and products.
          </p>
        </Link>
        <Link href="/submit" className="panel rounded-[1.5rem] p-6">
          <FolderKanban className="h-6 w-6 text-[var(--accent)]" />
          <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            Submit your work
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Share an agent, rule, hook, guide, or MCP server with the community.
          </p>
        </Link>
      </section>

      <section className="container">
        <div className="grid gap-4 rounded-[2rem] border border-[var(--line)] bg-[color:color-mix(in_oklab,var(--panel-strong)_94%,transparent)] p-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-3">
            <span className="eyebrow">Newsletter</span>
            <h2 className="section-title max-w-2xl">Get the best new Claude tools and workflows in your inbox.</h2>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Resend-powered signup is coming next. The slot is here so the final
              site architecture already has a clean home for it.
            </p>
          </div>
          <div className="space-y-4">
            {featuredSurfaces.map((surface) => (
              <Link
                key={surface.href}
                href={surface.href}
                className="block rounded-[1.25rem] border border-[var(--line)] px-5 py-4 transition hover:bg-[color:color-mix(in_oklab,var(--panel)_88%,transparent)]"
              >
                <p className="font-medium tracking-[-0.02em]">{surface.title}</p>
                <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                  {surface.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
