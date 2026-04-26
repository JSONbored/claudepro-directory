import "server-only";

import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { categoryDescriptions, categoryLabels, siteConfig } from "@/lib/site";

export type ContentCodeBlock = {
  language: string;
  code: string;
};

export type ContentSection = {
  title: string;
  id: string;
  markdown: string;
  codeBlocks: ContentCodeBlock[];
};

export type ContentHeading = {
  depth: number;
  text: string;
  id: string;
};

export type ContentCollectionItem = {
  slug: string;
  category: string;
};

export type ContentEntry = {
  category: string;
  slug: string;
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  author?: string;
  authorProfileUrl?: string;
  dateAdded?: string;
  tags: string[];
  keywords: string[];
  readingTime?: number;
  difficultyScore?: number;
  documentationUrl?: string;
  cardDescription?: string;
  installable?: boolean;
  installCommand?: string;
  usageSnippet?: string;
  copySnippet?: string;
  configSnippet?: string;
  commandSyntax?: string;
  argumentHint?: string;
  allowedTools?: string[];
  scriptLanguage?: string;
  scriptBody?: string;
  trigger?: string;
  items?: ContentCollectionItem[];
  installationOrder?: string[];
  estimatedSetupTime?: string;
  difficulty?: string;
  skillType?: "general" | "capability-pack";
  skillLevel?: "foundational" | "advanced" | "expert";
  verificationStatus?: "draft" | "validated" | "production";
  verifiedAt?: string;
  retrievalSources?: string[];
  testedPlatforms?: string[];
  prerequisites?: string[];
  hasPrerequisites?: boolean;
  hasTroubleshooting?: boolean;
  hasBreakingChanges?: boolean;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  packageVerified?: boolean;
  downloadUrl?: string;
  downloadTrust?: "first-party" | "external" | null;
  downloadSha256?: string | null;
  body: string;
  sections: ContentSection[];
  headings: ContentHeading[];
  codeBlocks: ContentCodeBlock[];
  filePath?: string;
  githubUrl?: string;
  repoUrl?: string | null;
  githubStars?: number | null;
  githubForks?: number | null;
  repoUpdatedAt?: string | null;
};

export type CategorySummary = {
  category: string;
  label: string;
  count: number;
  description: string;
};

export type DirectoryEntry = Omit<
  ContentEntry,
  "body" | "sections" | "headings" | "codeBlocks" | "scriptBody"
> & {
  body?: string;
  sections?: ContentSection[];
  headings?: ContentHeading[];
  codeBlocks?: ContentCodeBlock[];
  scriptBody?: string;
};

const DATA_ORIGIN = "https://heyclau.de";
let contentIndexPromise: Promise<ContentEntry[]> | null = null;
let directoryIndexPromise: Promise<DirectoryEntry[]> | null = null;
const entryDetailPromises = new Map<string, Promise<ContentEntry | null>>();

async function loadJsonDataFile<T>(fileName: string): Promise<T> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", fileName);
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    // In the Cloudflare Worker runtime, read from the static ASSETS binding.
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as {
      ASSETS: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
    };
    const response = await envRecord.ASSETS.fetch(new Request(`${DATA_ORIGIN}/data/${fileName}`));
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName} asset (${response.status})`);
    }
    return (await response.json()) as T;
  }
}

const loadContentIndex = cache(async (): Promise<ContentEntry[]> => {
  contentIndexPromise ??= loadJsonDataFile<ContentEntry[]>("content-index.json");
  return contentIndexPromise;
});

const loadDirectoryIndex = cache(async (): Promise<DirectoryEntry[]> => {
  directoryIndexPromise ??= loadJsonDataFile<DirectoryEntry[]>("directory-index.json");
  return directoryIndexPromise;
});

function isSafeContentPathPart(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

async function loadEntryDetail(category: string, slug: string) {
  if (!isSafeContentPathPart(category) || !isSafeContentPathPart(slug)) {
    return null;
  }

  const key = `${category}:${slug}`;
  let promise = entryDetailPromises.get(key);
  if (!promise) {
    promise = loadJsonDataFile<{ schemaVersion?: number; entry?: ContentEntry }>(
      `entries/${category}/${slug}.json`
    )
      .then((payload) => payload.entry ?? null)
      .catch(() => null);
    entryDetailPromises.set(key, promise);
  }

  return promise;
}

export const getAllEntries = cache(async (): Promise<ContentEntry[]> => {
  return loadContentIndex();
});

export const getDirectoryEntries = cache(async (): Promise<DirectoryEntry[]> => {
  return loadDirectoryIndex();
});

export const getEntry = cache(async (category: string, slug: string) => {
  return loadEntryDetail(category, slug);
});

export const getEntriesByCategory = cache(async (category: string) => {
  const entries = await getAllEntries();
  return entries.filter((entry) => entry.category === category);
});

export const getDirectoryEntriesByCategory = cache(async (category: string) => {
  const entries = await getDirectoryEntries();
  return entries.filter((entry) => entry.category === category);
});

export const getCategorySummaries = cache(async (): Promise<CategorySummary[]> => {
  const entries = await getDirectoryEntries();
  return siteConfig.categoryOrder
    .map((category) => {
      const count = entries.filter((entry) => entry.category === category).length;
      return {
        category,
        label: categoryLabels[category],
        count,
        description: categoryDescriptions[category]
      };
    })
    .filter((entry) => entry.count > 0);
});

export const getRecentEntries = cache(async () => {
  const entries = await getDirectoryEntries();
  return [...entries]
    .filter((entry) => entry.dateAdded)
    .sort((left, right) => String(right.dateAdded).localeCompare(String(left.dateAdded)))
    .slice(0, 12);
});
