import "server-only";

import type { DirectoryEntry, ToolListing } from "@heyclaude/registry";

import { getDirectoryEntries } from "@/lib/content";
import { getTools } from "@/lib/tools";

export type SeoClusterDefinition = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  categories: string[];
  tags?: string[];
  keywords?: string[];
  itemLimit: number;
};

export type SeoClusterItem = {
  title: string;
  description: string;
  category: string;
  slug: string;
  url: string;
  tags: string[];
  disclosure?: string;
};

export type SeoCluster = SeoClusterDefinition & {
  items: SeoClusterItem[];
};

export const seoClusterDefinitions: SeoClusterDefinition[] = [
  {
    slug: "claude-code-hooks",
    title: "Best Claude Code hooks for safer agent workflows",
    eyebrow: "Claude Code hooks",
    description:
      "Reviewed hooks for testing, security, repository hygiene, and repeatable Claude Code automation.",
    seoTitle: "Best Claude Code hooks for safer agent workflows",
    seoDescription:
      "Find Claude Code hooks for testing, security checks, repository hygiene, and repeatable agent workflows.",
    categories: ["hooks"],
    tags: ["security", "testing", "git", "automation"],
    itemLimit: 12,
  },
  {
    slug: "mcp-servers",
    title: "MCP servers for developer workflows",
    eyebrow: "MCP servers",
    description:
      "Useful MCP servers for files, browsers, APIs, repositories, databases, and developer automation.",
    seoTitle: "MCP servers for Claude developer workflows",
    seoDescription:
      "Browse MCP servers for Claude developer workflows, including files, browsers, APIs, repositories, databases, and automation tools.",
    categories: ["mcp"],
    tags: ["development", "automation", "browser", "database"],
    itemLimit: 16,
  },
  {
    slug: "claude-skills",
    title: "Claude skills for production teams",
    eyebrow: "Claude skills",
    description:
      "Claude skills for repeatable engineering, documentation, design, data, and operational workflows.",
    seoTitle: "Claude skills for production teams",
    seoDescription:
      "Find Claude skills for repeatable engineering, documentation, design, data, and operations workflows.",
    categories: ["skills"],
    tags: ["development", "documentation", "data", "design"],
    itemLimit: 16,
  },
  {
    slug: "security-reviewed-mcp-servers",
    title: "Security-reviewed MCP servers and agent tools",
    eyebrow: "Security",
    description:
      "MCP and agent resources that deserve extra scrutiny for credentials, file access, network access, and operational trust.",
    seoTitle: "Security-reviewed MCP servers and agent tools",
    seoDescription:
      "Review MCP servers and agent tools through a security lens covering credentials, file access, network access, and trust.",
    categories: ["mcp", "hooks", "rules", "tools"],
    tags: ["security", "audit", "guardrails", "red-teaming"],
    itemLimit: 16,
  },
  {
    slug: "agent-workflow-starter-kits",
    title: "Agent workflow starter kits",
    eyebrow: "Starter kits",
    description:
      "A practical starting set for agent workflows: agents, commands, hooks, skills, and supporting tools.",
    seoTitle: "Agent workflow starter kits for Claude teams",
    seoDescription:
      "Build agent workflow starter kits with Claude agents, commands, hooks, skills, and supporting tools.",
    categories: ["agents", "commands", "hooks", "skills", "tools"],
    tags: ["workflow", "automation", "agent-framework", "ai-coding"],
    itemLimit: 18,
  },
  {
    slug: "claude-native-tools",
    title: "Tools for Claude-native teams",
    eyebrow: "Claude tools",
    description:
      "Coding, observability, automation, browser, security, and agent infrastructure tools for Claude-native teams.",
    seoTitle: "Tools for Claude-native teams",
    seoDescription:
      "Browse coding, observability, automation, browser, security, and agent infrastructure tools for Claude-native teams.",
    categories: ["tools"],
    tags: [
      "ai-coding",
      "observability",
      "workflow-automation",
      "agent-framework",
    ],
    itemLimit: 24,
  },
];

function scoreItem(
  item: DirectoryEntry | ToolListing,
  definition: SeoClusterDefinition,
) {
  const itemTags = new Set((item.tags || []).map((tag) => tag.toLowerCase()));
  const itemKeywords = new Set(
    (item.keywords || []).map((keyword) => keyword.toLowerCase()),
  );
  const tagScore = (definition.tags || []).filter((tag) =>
    itemTags.has(tag.toLowerCase()),
  ).length;
  const keywordScore = (definition.keywords || []).filter((keyword) =>
    itemKeywords.has(keyword.toLowerCase()),
  ).length;
  const pickScore = item.disclosure === "heyclaude_pick" ? 2 : 0;
  return tagScore * 3 + keywordScore * 2 + pickScore;
}

function toClusterItem(item: DirectoryEntry | ToolListing): SeoClusterItem {
  const isTool = item.category === "tools";
  return {
    title: item.title,
    description: item.cardDescription || item.description,
    category: item.category,
    slug: item.slug,
    url: isTool ? `/tools/${item.slug}` : `/${item.category}/${item.slug}`,
    tags: item.tags || [],
    disclosure: item.disclosure,
  };
}

export function getSeoClusterDefinitions() {
  return seoClusterDefinitions;
}

export async function getSeoCluster(slug: string): Promise<SeoCluster | null> {
  const definition =
    seoClusterDefinitions.find((cluster) => cluster.slug === slug) ?? null;
  if (!definition) return null;

  const [entries, tools] = await Promise.all([
    getDirectoryEntries(),
    getTools(),
  ]);
  const pool = [
    ...entries.filter((entry) => entry.category !== "tools"),
    ...tools,
  ].filter((item) => definition.categories.includes(item.category));

  const items = pool
    .map((item) => ({ item, score: scoreItem(item, definition) }))
    .filter(({ score }) => score > 0 || definition.categories.length === 1)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return left.item.title.localeCompare(right.item.title);
    })
    .slice(0, definition.itemLimit)
    .map(({ item }) => toClusterItem(item));

  return {
    ...definition,
    items,
  };
}
