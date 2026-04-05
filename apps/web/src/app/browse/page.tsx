import { BrowseDirectory } from "@/components/browse-directory";
import { getAllEntries } from "@/lib/content";

type BrowsePageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const entries = await getAllEntries();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQuery = resolvedSearchParams?.q ?? "";

  return (
    <div className="container space-y-10 py-12">
      <div className="space-y-5 border-b border-[var(--line)] pb-8">
        <span className="eyebrow">Browse all</span>
        <h1 className="section-title">Explore the full HeyClaude directory.</h1>
        <p className="max-w-3xl text-sm leading-8 text-[var(--muted)]">
          Search across agents, MCP servers, skills, rules, commands, hooks,
          guides, collections, and statuslines. The goal is fast discovery with
          enough context to decide what to open next.
        </p>
      </div>

      <BrowseDirectory entries={entries} initialQuery={initialQuery} />
    </div>
  );
}
