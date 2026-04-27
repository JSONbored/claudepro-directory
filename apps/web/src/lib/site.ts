import { categorySpec } from "@heyclaude/registry";

type CategorySpecEntry = {
  label: string;
  description: string;
  seoDescription?: string;
  usageHint: string;
  quickstart?: string[];
};

const categories = categorySpec.categories as Record<string, CategorySpecEntry>;

export const siteConfig = {
  name: "HeyClaude",
  shortName: "heyclaude",
  description:
    "A community-built directory for Claude agents, MCP servers, tools, skills, rules, commands, hooks, guides, collections, and jobs.",
  url: "https://heyclau.de",
  githubUrl: "https://github.com/JSONbored/claudepro-directory",
  jobsEmail: "jobs@heyclau.de",
  twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/jsonbored",
  discordUrl:
    process.env.NEXT_PUBLIC_DISCORD_URL ||
    "https://discord.com/invite/Ax3Py4YDrq",
  polarJobBoardUrl: process.env.NEXT_PUBLIC_POLAR_JOB_BOARD_URL || "/advertise",
  polarFeaturedJobUrl:
    process.env.NEXT_PUBLIC_POLAR_FEATURED_JOB_URL || "/advertise",
  polarSponsoredJobUrl:
    process.env.NEXT_PUBLIC_POLAR_SPONSORED_JOB_URL || "/advertise",
  nav: [
    { href: "/browse", label: "Browse" },
    { href: "/tools", label: "Tools" },
    { href: "/jobs", label: "Jobs" },
    { href: "/about", label: "About" },
  ],
  categoryOrder: categorySpec.categoryOrder,
} as const;

export const categoryLabels: Record<string, string> = Object.fromEntries(
  Object.entries(categories).map(([category, spec]) => [category, spec.label]),
);

export const categoryDescriptions: Record<string, string> = Object.fromEntries(
  Object.entries(categories).map(([category, spec]) => [
    category,
    spec.description,
  ]),
);

export const categorySeoDescriptions: Record<string, string> =
  Object.fromEntries(
    Object.entries(categories).map(([category, spec]) => [
      category,
      spec.seoDescription ?? spec.description,
    ]),
  );

export const categoryUsageHints: Record<string, string> = Object.fromEntries(
  Object.entries(categories).map(([category, spec]) => [
    category,
    spec.usageHint,
  ]),
);

export const categoryQuickstarts: Record<string, string[]> = Object.fromEntries(
  Object.entries(categories).map(([category, spec]) => [
    category,
    Array.isArray(spec.quickstart) ? spec.quickstart : [],
  ]),
);

export const categoryAccentClasses: Record<string, string> = {
  agents: "text-chart-1 border-border bg-secondary/30",
  mcp: "text-chart-2 border-border bg-secondary/30",
  tools: "text-primary border-border bg-secondary/30",
  skills: "text-chart-5 border-border bg-secondary/30",
  rules: "text-destructive border-border bg-secondary/30",
  commands: "text-primary border-border bg-secondary/30",
  hooks: "text-chart-4 border-border bg-secondary/30",
  guides: "text-chart-2 border-border bg-secondary/30",
  collections: "text-chart-3 border-border bg-secondary/30",
  statuslines: "text-chart-4 border-border bg-secondary/30",
};
