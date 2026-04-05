import { JobsDirectory } from "@/components/jobs-directory";
import { jobs } from "@/lib/jobs";

export default function JobsPage() {
  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">Jobs</span>
        <h1 className="section-title">Jobs for people building with Claude.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          Featured roles, sponsorship placements, and opportunities for teams
          shipping Claude-native products, agents, and MCP infrastructure.
        </p>
      </div>
      <JobsDirectory jobs={jobs} />
    </div>
  );
}
