export type JobListing = {
  slug: string;
  title: string;
  company: string;
  location: string;
  description: string;
  featured: boolean;
  applyUrl: string;
};

export const jobs: JobListing[] = [
  {
    slug: "feature-your-role-on-heyclaude",
    title: "Feature your role on HeyClaude",
    company: "Your company",
    location: "Remote",
    description:
      "Reach Claude-native developers, agent builders, and MCP tinkerers with a featured listing.",
    featured: true,
    applyUrl: "/advertise"
  }
];
