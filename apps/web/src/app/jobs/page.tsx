import { JobsDirectory } from "@/components/jobs-directory";
import { jobs } from "@/lib/jobs";

type JobsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQuery = resolvedSearchParams?.q ?? "";

  return (
    <div className="container space-y-10 py-12">
      <div className="space-y-4">
        <span className="eyebrow">Jobs</span>
        <h1 className="section-title">Jobs for people building with Claude.</h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Browse featured roles aimed at prompt engineers, agent builders, MCP
          developers, and AI-native product teams.
        </p>
      </div>

      <JobsDirectory jobs={jobs} initialQuery={initialQuery} />
    </div>
  );
}
