export type JobListing = {
  slug: string;
  title: string;
  company: string;
  location: string;
  description: string;
  featured: boolean;
  sponsored?: boolean;
  applyUrl: string;
};

export const jobs: JobListing[] = [
  {
    slug: "sponsored-job-listing-here",
    title: "Sponsored job listing here",
    company: "Your company",
    location: "Remote",
    description:
      "Reach Claude-native developers, agent builders, and MCP tinkerers with a pinned sponsored job at the top of the board.",
    featured: true,
    sponsored: true,
    applyUrl: "/advertise"
  },
  {
    slug: "your-job-here",
    title: "Your job here",
    company: "Hiring team",
    location: "Remote or hybrid",
    description:
      "Post a role for engineers, AI builders, prompt designers, MCP maintainers, or Claude-native product teams.",
    featured: false,
    applyUrl: "/advertise"
  },
  {
    slug: "claude-infra-engineer-placeholder",
    title: "Claude Infrastructure Engineer",
    company: "Example AI Company",
    location: "Remote · US timezones",
    description:
      "Own Claude workflows, MCP integrations, evals, and internal tooling for a fast-moving AI product team.",
    featured: false,
    applyUrl: "/advertise"
  }
];
