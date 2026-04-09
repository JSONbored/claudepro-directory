export const siteConfig = {
  name: "HeyClaude",
  shortName: "heyclaude",
  description:
    "A community-built directory for Claude agents, MCP servers, skills, rules, commands, hooks, guides, collections, and jobs.",
  url: "https://heyclau.de",
  githubUrl: "https://github.com/JSONbored/claudepro-directory",
  twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || "#",
  discordUrl:
    process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.com/invite/Ax3Py4YDrq",
  polarJobBoardUrl: process.env.NEXT_PUBLIC_POLAR_JOB_BOARD_URL || "/advertise",
  polarFeaturedJobUrl: process.env.NEXT_PUBLIC_POLAR_FEATURED_JOB_URL || "/advertise",
  polarSponsoredJobUrl: process.env.NEXT_PUBLIC_POLAR_SPONSORED_JOB_URL || "/advertise",
  nav: [
    { href: "/browse", label: "Browse" },
    { href: "/jobs", label: "Jobs" },
    { href: "/about", label: "About" }
  ],
  categoryOrder: [
    "agents",
    "mcp",
    "skills",
    "rules",
    "commands",
    "hooks",
    "guides",
    "collections",
    "statuslines"
  ]
} as const;

export const categoryLabels: Record<string, string> = {
  agents: "Agents",
  mcp: "MCP Servers",
  skills: "Skills",
  rules: "Rules",
  commands: "Commands",
  hooks: "Hooks",
  guides: "Guides",
  collections: "Collections",
  statuslines: "Statuslines"
};

export const categoryDescriptions: Record<string, string> = {
  agents: "Specialized Claude agents and expert roles.",
  mcp: "Model Context Protocol servers and integrations.",
  skills: "Installable skill packs and reusable capabilities.",
  rules: "Prompt guardrails, project rules, and operating constraints.",
  commands: "Slash commands and reusable command prompts.",
  hooks: "Claude Code hook configs and automation helpers.",
  guides: "Long-form guides and practical walkthroughs.",
  collections: "Curated bundles of related assets.",
  statuslines: "Statusline scripts and workflow telemetry."
};

export const categoryUsageHints: Record<string, string> = {
  agents: "Copy the full prompt into a Claude agent definition and adapt it to your workflow.",
  mcp: "Install the server, copy the Claude config, then verify the connection in Claude Code.",
  skills: "Install or download the skill pack, then reuse the included files, prompts, or scripts directly.",
  rules: "Copy the full rule asset into CLAUDE.md or your project rule system instead of only taking the summary.",
  commands: "Use the exact slash command syntax shown for the best starting point, then inspect the full source if needed.",
  hooks: "Install the hook script, copy the Claude config, and test the trigger locally before wider use.",
  guides: "Use guides as reference docs and implementation walkthroughs, not as standalone assets.",
  collections: "Start with the recommended order and then open the included entries one by one.",
  statuslines: "Copy the Claude statusline config first, then install or adapt the script asset behind it."
};

export const categoryAccentClasses: Record<string, string> = {
  agents: "text-chart-1 border-border bg-secondary/30",
  mcp: "text-chart-2 border-border bg-secondary/30",
  skills: "text-chart-5 border-border bg-secondary/30",
  rules: "text-destructive border-border bg-secondary/30",
  commands: "text-primary border-border bg-secondary/30",
  hooks: "text-chart-4 border-border bg-secondary/30",
  guides: "text-chart-2 border-border bg-secondary/30",
  collections: "text-chart-3 border-border bg-secondary/30",
  statuslines: "text-chart-4 border-border bg-secondary/30"
};
