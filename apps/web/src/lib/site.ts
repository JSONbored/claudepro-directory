export const siteConfig = {
  name: "HeyClaude",
  shortName: "heyclau.de",
  description:
    "A fast, community-driven directory for Claude agents, MCP servers, skills, rules, commands, hooks, guides, and jobs.",
  url: "https://heyclau.de",
  githubUrl: "https://github.com/JSONbored/claudepro-directory",
  legacyUrl: "https://claudepro.directory",
  nav: [
    { href: "/browse", label: "Browse" },
    { href: "/jobs", label: "Jobs" },
    { href: "/about", label: "About" },
    { href: "/advertise", label: "Advertise" },
    { href: "/submit", label: "Submit" }
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
  collections: "Collections",
  commands: "Commands",
  guides: "Guides",
  hooks: "Hooks",
  mcp: "MCP Servers",
  rules: "Rules",
  skills: "Skills",
  statuslines: "Statuslines"
};

export const categoryPillClasses: Record<string, string> = {
  agents:
    "border-[color:color-mix(in_oklab,var(--signal-cyan)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-cyan)_16%,transparent)] text-[color:var(--signal-cyan)]",
  collections:
    "border-[color:color-mix(in_oklab,var(--signal-violet)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-violet)_16%,transparent)] text-[color:var(--signal-violet)]",
  commands:
    "border-[color:color-mix(in_oklab,var(--signal-amber)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-amber)_16%,transparent)] text-[color:var(--signal-amber)]",
  guides:
    "border-[color:color-mix(in_oklab,var(--signal-emerald)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-emerald)_16%,transparent)] text-[color:var(--signal-emerald)]",
  hooks:
    "border-[color:color-mix(in_oklab,var(--signal-pink)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-pink)_16%,transparent)] text-[color:var(--signal-pink)]",
  mcp:
    "border-[color:color-mix(in_oklab,var(--accent)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--accent)_16%,transparent)] text-[color:var(--accent)]",
  rules:
    "border-[color:color-mix(in_oklab,var(--signal-red)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-red)_16%,transparent)] text-[color:var(--signal-red)]",
  skills:
    "border-[color:color-mix(in_oklab,var(--signal-gold)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-gold)_16%,transparent)] text-[color:var(--signal-gold)]",
  statuslines:
    "border-[color:color-mix(in_oklab,var(--signal-teal)_45%,var(--line))] bg-[color:color-mix(in_oklab,var(--signal-teal)_16%,transparent)] text-[color:var(--signal-teal)]"
};

export const featuredSurfaces = [
  {
    title: "Sponsor a spotlight",
    description:
      "Featured placements for tools, products, and launches that are relevant to Claude users.",
    href: "/advertise"
  },
  {
    title: "Post a job",
    description: "Reach builders working with Claude, MCP servers, prompts, and AI workflows.",
    href: "/jobs"
  },
  {
    title: "Share something useful",
    description: "Submit new configs, guides, rules, prompts, and tools through GitHub.",
    href: "/submit"
  }
];

export const categoryTileClasses: Record<string, string> = {
  agents:
    "from-[color:color-mix(in_oklab,var(--signal-cyan)_30%,transparent)] to-transparent text-[color:var(--signal-cyan)]",
  collections:
    "from-[color:color-mix(in_oklab,var(--signal-violet)_30%,transparent)] to-transparent text-[color:var(--signal-violet)]",
  commands:
    "from-[color:color-mix(in_oklab,var(--signal-amber)_28%,transparent)] to-transparent text-[color:var(--signal-amber)]",
  guides:
    "from-[color:color-mix(in_oklab,var(--signal-emerald)_26%,transparent)] to-transparent text-[color:var(--signal-emerald)]",
  hooks:
    "from-[color:color-mix(in_oklab,var(--signal-pink)_28%,transparent)] to-transparent text-[color:var(--signal-pink)]",
  mcp:
    "from-[color:color-mix(in_oklab,var(--accent)_28%,transparent)] to-transparent text-[color:var(--accent)]",
  rules:
    "from-[color:color-mix(in_oklab,var(--signal-red)_28%,transparent)] to-transparent text-[color:var(--signal-red)]",
  skills:
    "from-[color:color-mix(in_oklab,var(--signal-gold)_26%,transparent)] to-transparent text-[color:var(--signal-gold)]",
  statuslines:
    "from-[color:color-mix(in_oklab,var(--signal-teal)_28%,transparent)] to-transparent text-[color:var(--signal-teal)]"
};

export const categoryUsageGuides: Record<
  string,
  {
    title: string;
    summary: string;
    steps: string[];
    sourceLabel: string;
    emptyState: string;
  }
> = {
  agents: {
    title: "Use as a specialized agent",
    summary:
      "Agent entries are long-form agent instructions you can adapt into project agents or sub-agents.",
    steps: [
      "Read the brief, scope, and constraints before copying anything.",
      "Adapt the prompt to your own repo, tools, and coding standards.",
      "Save the final version in your Claude agent or project agent setup."
    ],
    sourceLabel: "Agent source",
    emptyState:
      "This entry needs a stronger agent body so people can use it directly."
  },
  collections: {
    title: "Use as a curated bundle",
    summary:
      "Collections should group related entries and explain when to use them together.",
    steps: [
      "Review the summary and linked source.",
      "Open the related entries that belong in the collection.",
      "Use the bundle as a starter pack for a specific workflow."
    ],
    sourceLabel: "Collection source",
    emptyState:
      "This collection is metadata-only right now. It needs an item list and a short explanation of how the bundle fits together."
  },
  commands: {
    title: "Run as a Claude Code command",
    summary:
      "Command entries work best when they expose a copyable command invocation and clear options.",
    steps: [
      "Copy the command syntax or adapt it for your own workflow.",
      "Save it in your Claude Code command setup.",
      "Run it with the options or arguments shown in the examples."
    ],
    sourceLabel: "Command source",
    emptyState:
      "This command needs a usage block and at least one worked example."
  },
  guides: {
    title: "Follow as a reference guide",
    summary:
      "Guide entries should read like documentation: prerequisites, steps, troubleshooting, and related links.",
    steps: [
      "Scan the section list before reading end to end.",
      "Work through prerequisites and steps in order.",
      "Use the related links and references for deeper setup."
    ],
    sourceLabel: "Guide source",
    emptyState:
      "This guide needs real sections before it is useful as documentation."
  },
  hooks: {
    title: "Install as a Claude Code hook",
    summary:
      "Hook entries should explain trigger type, config shape, and what command or script Claude Code runs.",
    steps: [
      "Check what trigger the hook is meant for.",
      "Add the config snippet or script path to your Claude Code setup.",
      "Test it on a small project before relying on it."
    ],
    sourceLabel: "Hook source",
    emptyState:
      "This hook is metadata-only right now. It needs a real config example or script body so people can install it."
  },
  mcp: {
    title: "Connect as an MCP server",
    summary:
      "MCP entries are integration listings. The key actions are reading the docs, opening the source repo, and connecting the server in your MCP client.",
    steps: [
      "Open the documentation or source repository.",
      "Install or configure the MCP server in your client.",
      "Test a single tool or resource before wider use."
    ],
    sourceLabel: "Server source",
    emptyState:
      "This MCP entry needs setup instructions or links to be more useful."
  },
  rules: {
    title: "Use as a reusable rule set",
    summary:
      "Rules are long-form instructions and constraints you can drop into project context, system prompts, or shared guidance files.",
    steps: [
      "Read the rule set for scope and assumptions.",
      "Copy the parts that match your team or project.",
      "Trim anything generic so the final rule stays specific."
    ],
    sourceLabel: "Rule source",
    emptyState:
      "This rule needs direct instruction text rather than metadata alone."
  },
  skills: {
    title: "Install as a skill package",
    summary:
      "Skill entries should provide a downloadable package, docs, and clear examples of the tasks the skill unlocks.",
    steps: [
      "Download the skill package or inspect the source file.",
      "Install it in the Claude environment you use.",
      "Use the examples as starting prompts rather than fixed scripts."
    ],
    sourceLabel: "Skill source",
    emptyState:
      "This skill needs an installable package or a direct setup section."
  },
  statuslines: {
    title: "Save as a statusline script",
    summary:
      "Statusline entries are executable scripts. They should show the full script body and explain where Claude Code expects it.",
    steps: [
      "Copy the script into a local file and make it executable.",
      "Point your Claude Code statusline config at the script path.",
      "Test it in a live session and adjust the output format if needed."
    ],
    sourceLabel: "Statusline source",
    emptyState:
      "This statusline needs an actual script body before it can be used."
  }
};
