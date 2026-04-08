import { BrowseDirectory } from "@/components/browse-directory";
import siteStats from "@/generated/site-stats.json";
import { getCategorySummaries, getDirectoryEntries } from "@/lib/content";

export default async function HomePage() {
  const [directoryEntries, categories] = await Promise.all([
    getDirectoryEntries(),
    getCategorySummaries()
  ]);
  const totalEntries = categories.reduce((sum, category) => sum + category.count, 0);
  const githubStars = Number(siteStats.githubStars ?? 0);

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
            <div className="hero-stats-grid">
              <div className="hero-stat-block">
                <div className="hero-stat-number">
                  {githubStars > 0 ? `${githubStars.toLocaleString()}+` : "GitHub"}
                </div>
                <div className="hero-stat-label">GitHub Stars</div>
              </div>
              <div className="hero-stat-block">
                <div className="hero-stat-number">{categories.length}</div>
                <div className="hero-stat-label">Categories</div>
              </div>
              <div className="hero-stat-block">
                <div className="hero-stat-number">{totalEntries.toLocaleString()}+</div>
                <div className="hero-stat-label">Configs</div>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-[52rem] text-left">
            <BrowseDirectory entries={directoryEntries} limit={15} />
          </div>
        </div>
      </section>
    </div>
  );
}
