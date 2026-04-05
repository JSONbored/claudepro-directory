export type JobListing = {
  slug: string;
  title: string;
  company: string;
  location: string;
  description: string;
  remote: boolean;
  featured: boolean;
  applyUrl: string;
};

export const jobs: JobListing[] = [
  {
    slug: "your-job-posting-here",
    title: "Your Job Posting Here",
    company: "Your Company",
    location: "Remote • Worldwide",
    description:
      "Reach Claude-first developers, automation builders, and MCP tinkerers with a simple featured job slot on HeyClaude.",
    remote: true,
    featured: true,
    applyUrl: "/advertise"
  }
];
