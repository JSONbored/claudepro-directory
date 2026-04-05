import { jobs } from "@/lib/jobs";

export default function JobsPage() {
  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">Jobs</span>
        <h1 className="section-title">Jobs for people building with Claude.</h1>
      </div>
      <div className="space-y-4">
        {jobs.map((job) => (
          <article key={job.slug} className="surface-panel p-6">
            <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground">{job.company}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{job.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{job.location}</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{job.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
