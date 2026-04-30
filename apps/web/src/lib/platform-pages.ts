import "server-only";

import type { ContentEntry } from "@heyclaude/registry";
import {
  buildSkillPlatformCompatibility,
  platformFeedSlug,
} from "@heyclaude/registry/artifacts";

import { getAllEntries } from "@/lib/content";

export type PlatformPageDefinition = {
  slug: string;
  platform: string;
  title: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  ctaLabel: string;
};

export type PlatformPageItem = {
  title: string;
  description: string;
  slug: string;
  url: string;
  tags: string[];
  supportLevel: string;
  installPath: string;
  adapterPath?: string;
  verifiedAt?: string;
};

export type PlatformPage = PlatformPageDefinition & {
  feedUrl: string;
  count: number;
  items: PlatformPageItem[];
};

export const platformPageDefinitions: PlatformPageDefinition[] = [
  {
    slug: "claude",
    platform: "Claude",
    title: "Claude Agent Skills",
    eyebrow: "Claude",
    description:
      "Validated Agent Skills packages that can be installed into Claude-compatible skill folders.",
    seoTitle: "Claude Agent Skills directory",
    seoDescription:
      "Browse Claude Agent Skills with install paths, package validation signals, source links, and HeyClaude compatibility metadata.",
    ctaLabel: "View Claude skill feed",
  },
  {
    slug: "codex",
    platform: "Codex",
    title: "Codex Agent Skills",
    eyebrow: "OpenAI Codex",
    description:
      "Reusable SKILL.md packages shaped for Codex workflows, validation, and adapter-aware installs.",
    seoTitle: "Codex Agent Skills directory",
    seoDescription:
      "Find Codex Agent Skills with SKILL.md package metadata, install guidance, checksums, adapters, and registry source links.",
    ctaLabel: "View Codex skill feed",
  },
  {
    slug: "windsurf",
    platform: "Windsurf",
    title: "Windsurf Agent Skills",
    eyebrow: "Windsurf",
    description:
      "Agent Skills packages that map cleanly into Windsurf Cascade skill folders and workflows.",
    seoTitle: "Windsurf Agent Skills directory",
    seoDescription:
      "Explore Windsurf Agent Skills with Cascade install paths, validation metadata, source links, and HeyClaude skill package checks.",
    ctaLabel: "View Windsurf skill feed",
  },
  {
    slug: "gemini",
    platform: "Gemini",
    title: "Gemini Agent Skills",
    eyebrow: "Gemini",
    description:
      "Agent Skills packages compatible with Gemini CLI skill and extension-oriented workflows.",
    seoTitle: "Gemini Agent Skills directory",
    seoDescription:
      "Browse Gemini Agent Skills with package compatibility metadata, install paths, validation status, and registry feed links.",
    ctaLabel: "View Gemini skill feed",
  },
  {
    slug: "cursor-rules",
    platform: "Cursor",
    title: "Cursor rule adapters",
    eyebrow: "Cursor rules",
    description:
      "Generated Cursor `.mdc` rule adapters for Agent Skills packages that do not install natively in Cursor.",
    seoTitle: "Cursor rule adapters for Agent Skills",
    seoDescription:
      "Find generated Cursor rule adapters for HeyClaude Agent Skills, with source packages, install paths, and adapter metadata.",
    ctaLabel: "View Cursor adapter feed",
  },
  {
    slug: "agents-context",
    platform: "Generic AGENTS",
    title: "Generic AGENTS.md context",
    eyebrow: "AGENTS context",
    description:
      "Portable Agent Skills guidance for AGENTS.md files and other context surfaces that need manual adaptation.",
    seoTitle: "Generic AGENTS.md skill context",
    seoDescription:
      "Use HeyClaude Agent Skills as portable AGENTS.md context with install notes, package metadata, source links, and adapters.",
    ctaLabel: "View AGENTS context feed",
  },
];

function toPlatformItem(
  entry: ContentEntry,
  definition: PlatformPageDefinition,
): PlatformPageItem | null {
  const compatibility = buildSkillPlatformCompatibility(entry).find(
    (item) => item.platform === definition.platform,
  );
  if (!compatibility) return null;

  return {
    title: entry.title,
    description: entry.cardDescription || entry.description,
    slug: entry.slug,
    url: `/skills/${entry.slug}`,
    tags: entry.tags || [],
    supportLevel: compatibility.supportLevel,
    installPath: compatibility.installPath,
    adapterPath: compatibility.adapterPath,
    verifiedAt: compatibility.verifiedAt,
  };
}

function buildPlatformPage(
  definition: PlatformPageDefinition,
  entries: ContentEntry[],
): PlatformPage {
  const items = entries
    .filter((entry) => entry.category === "skills")
    .map((entry) => toPlatformItem(entry, definition))
    .filter((entry): entry is PlatformPageItem => Boolean(entry))
    .sort((left, right) => left.title.localeCompare(right.title));

  return {
    ...definition,
    feedUrl: `/data/feeds/platforms/${platformFeedSlug(definition.platform)}.json`,
    count: items.length,
    items,
  };
}

export function getPlatformPageDefinitions() {
  return platformPageDefinitions;
}

export async function getPlatformPages() {
  const entries = await getAllEntries();
  return platformPageDefinitions.map((definition) =>
    buildPlatformPage(definition, entries),
  );
}

export async function getPlatformPage(slug: string) {
  const definition = platformPageDefinitions.find((item) => item.slug === slug);
  if (!definition) return null;
  const entries = await getAllEntries();
  return buildPlatformPage(definition, entries);
}
