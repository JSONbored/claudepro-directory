import { BrowseDirectory } from "@/components/browse-directory";
import { getAllEntries } from "@/lib/content";

type BrowsePageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const entries = await getAllEntries();
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="container-shell max-w-5xl space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">Browse</span>
        <h1 className="section-title">Browse the full directory.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Search across agents, MCP servers, skills, rules, commands, hooks,
          guides, collections, and statuslines.
        </p>
      </div>
      <BrowseDirectory entries={entries} initialQuery={params?.q ?? ""} />
    </div>
  );
}
