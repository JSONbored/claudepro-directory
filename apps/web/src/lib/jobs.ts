export type JobListing = {
  slug: string;
  title: string;
  company: string;
  location: string;
  description: string;
  type?: string;
  postedAt?: string;
  compensation?: string;
  responsibilities?: string[];
  requirements?: string[];
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
    type: "Sponsored placement",
    postedAt: "2026-04-08",
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
    type: "Full-time",
    postedAt: "2026-04-08",
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
    type: "Full-time",
    postedAt: "2026-04-07",
    compensation: "$160k - $220k",
    responsibilities: [
      "Design and maintain Claude-native internal tooling.",
      "Own MCP integration reliability and observability.",
      "Ship automation paths that reduce manual support load."
    ],
    requirements: [
      "Production TypeScript or backend engineering experience.",
      "Strong API design and distributed systems debugging skills.",
      "Comfort working directly with AI workflows and prompts."
    ],
    featured: false,
    applyUrl: "/advertise"
  }
];

export function getJobBySlug(slug: string) {
  return jobs.find((job) => job.slug === slug) ?? null;
}
