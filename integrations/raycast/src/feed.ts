export const FEED_URL = "https://heyclau.de/data/raycast-index.json";
export const SUBMIT_URL = "https://heyclau.de/submit";
export const GITHUB_NEW_ISSUE_URL =
  "https://github.com/JSONbored/claudepro-directory/issues/new";
export const CACHE_KEY = "heyclaude-raycast-index";
export const DETAIL_CACHE_PREFIX = "heyclaude-raycast-detail";
export const FAVORITES_KEY = "favorite-entry-keys";

export type DownloadTrust = "first-party" | "external" | null;

export type RaycastEntry = {
  category: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  installCommand: string;
  configSnippet: string;
  copyText: string;
  copyTextLength?: number;
  copyTextTruncated?: boolean;
  detailMarkdown: string;
  detailUrl?: string;
  webUrl: string;
  repoUrl: string;
  documentationUrl: string;
  downloadTrust: DownloadTrust;
  verificationStatus: string;
};

export type RaycastDetail = {
  copyText: string;
  detailMarkdown: string;
};

export type ParsedFeed = {
  entries: RaycastEntry[];
  generatedAt: string;
};

export type CategoryOption = {
  value: string;
  title: string;
};

const categoryLabels: Record<string, string> = {
  agents: "Agents",
  mcp: "MCP Servers",
  tools: "Tools",
  skills: "Skills",
  rules: "Rules",
  commands: "Commands",
  hooks: "Hooks",
  guides: "Guides",
  collections: "Collections",
  statuslines: "Statuslines",
};

const issueTemplateByCategory: Record<string, string> = {
  agents: "submit-agent.yml",
  mcp: "submit-mcp.yml",
  skills: "submit-skill.yml",
  rules: "submit-rule.yml",
  commands: "submit-command.yml",
  hooks: "submit-hook.yml",
  guides: "submit-guide.yml",
  collections: "submit-collection.yml",
  statuslines: "submit-statusline.yml",
};

export function entryKey(entry: Pick<RaycastEntry, "category" | "slug">) {
  return `${entry.category}:${entry.slug}`;
}

export function categoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

export function absoluteDataUrl(value: string, baseUrl = FEED_URL) {
  return new URL(value, baseUrl).toString();
}

export function buildContributeEntryUrl(entry?: Partial<RaycastEntry>) {
  const url = new URL(SUBMIT_URL);
  if (entry?.category) url.searchParams.set("category", entry.category);
  if (entry?.title) url.searchParams.set("name", entry.title);
  if (entry?.slug) url.searchParams.set("slug", entry.slug);
  return url.toString();
}

export function buildSuggestChangeUrl(entry: RaycastEntry) {
  const template = issueTemplateByCategory[entry.category] ?? "submit-entry.md";
  const url = new URL(GITHUB_NEW_ISSUE_URL);
  url.searchParams.set("template", template);
  url.searchParams.set(
    "title",
    `Update ${categoryLabel(entry.category)}: ${entry.title}`,
  );
  url.searchParams.set("name", entry.title);
  url.searchParams.set("slug", entry.slug);
  url.searchParams.set("category", entry.category);
  url.searchParams.set("description", entry.description);
  url.searchParams.set("card_description", entry.description);
  if (entry.repoUrl) url.searchParams.set("github_url", entry.repoUrl);
  if (entry.documentationUrl) {
    url.searchParams.set("docs_url", entry.documentationUrl);
  }
  return url.toString();
}

export function isRaycastEntry(value: unknown): value is RaycastEntry {
  const entry = value as Partial<RaycastEntry>;
  return (
    Boolean(entry) &&
    typeof entry.category === "string" &&
    typeof entry.slug === "string" &&
    typeof entry.title === "string" &&
    typeof entry.description === "string" &&
    Array.isArray(entry.tags) &&
    typeof entry.copyText === "string" &&
    typeof entry.detailMarkdown === "string" &&
    typeof entry.webUrl === "string"
  );
}

export function parseFeed(value: string): ParsedFeed {
  const parsed = JSON.parse(value) as unknown;
  if (Array.isArray(parsed)) {
    return {
      entries: parsed.filter(isRaycastEntry),
      generatedAt: "",
    };
  }

  const envelope = parsed as {
    schemaVersion?: unknown;
    generatedAt?: unknown;
    entries?: unknown;
  };
  if (!Array.isArray(envelope.entries)) {
    return { entries: [], generatedAt: "" };
  }

  return {
    entries: envelope.entries.filter(isRaycastEntry),
    generatedAt:
      typeof envelope.generatedAt === "string" ? envelope.generatedAt : "",
  };
}

export function isRaycastDetail(value: unknown): value is RaycastDetail {
  const detail = value as Partial<RaycastDetail>;
  return (
    Boolean(detail) &&
    typeof detail.copyText === "string" &&
    typeof detail.detailMarkdown === "string"
  );
}

export function parseDetail(value: string): RaycastDetail | null {
  const parsed = JSON.parse(value) as unknown;
  return isRaycastDetail(parsed) ? parsed : null;
}

export function fallbackDetail(entry: RaycastEntry): RaycastDetail {
  return {
    copyText: entry.copyText,
    detailMarkdown: entry.detailMarkdown,
  };
}

export function sortedCategoryOptions(
  entries: RaycastEntry[],
): CategoryOption[] {
  const categories = [...new Set(entries.map((entry) => entry.category))].sort(
    (left, right) => categoryLabel(left).localeCompare(categoryLabel(right)),
  );

  return [
    { value: "all", title: "All Categories" },
    { value: "favorites", title: "Favorites" },
    ...categories.map((category) => ({
      value: category,
      title: categoryLabel(category),
    })),
  ];
}

export function filterEntriesByCategory(
  entries: RaycastEntry[],
  category: string,
  favorites: Set<string>,
) {
  if (category === "favorites") {
    return entries.filter((entry) => favorites.has(entryKey(entry)));
  }
  if (category === "all") return entries;
  return entries.filter((entry) => entry.category === category);
}

export function parseFavoriteKeys(raw: string | null | undefined) {
  if (!raw) return [];

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return [...new Set(parsed.map(String))].sort();
}

export function serializeFavoriteKeys(favorites: Iterable<string>) {
  return JSON.stringify([...new Set(favorites)].sort());
}
