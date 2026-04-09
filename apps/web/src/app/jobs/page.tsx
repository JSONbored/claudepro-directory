import { JobsDirectory } from "@/components/jobs-directory";
import { getJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">Jobs</span>
        <h1 className="section-title">Jobs for people building with Claude.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Featured roles, sponsorship placements, and opportunities for teams
          shipping Claude-native products, agents, and MCP infrastructure.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/jobs/post?tier=sponsored"
            className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Post sponsored placement
          </a>
          <a
            href="/jobs/post?tier=featured"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Post featured job
          </a>
          <a
            href="/jobs/post?tier=standard"
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
          >
            Post standard job
          </a>
        </div>
      </div>
      <JobsDirectory jobs={jobs} />

      <section className="surface-panel grid gap-3 p-5 md:grid-cols-3">
        <a
          href="/jobs/post?tier=sponsored"
          className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 transition hover:border-primary/55"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-primary">Sponsored</p>
          <p className="mt-1 text-sm text-foreground">Pinned premium slot for maximum visibility.</p>
        </a>
        <a
          href="/jobs/post?tier=featured"
          className="rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Featured</p>
          <p className="mt-1 text-sm text-foreground">Priority ordering and highlighted card treatment.</p>
        </a>
        <a
          href="/jobs/post?tier=standard"
          className="rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/40"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Standard</p>
          <p className="mt-1 text-sm text-foreground">Listed in the main feed with full detail page.</p>
        </a>
      </section>
    </div>
  );
}
