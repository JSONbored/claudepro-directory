import "server-only";

import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type {
  ArtifactManifestV2,
  CategorySummary,
  ContentEntry,
  DirectoryEntry,
  RegistryEnvelope,
  SearchDocument,
} from "@heyclaude/registry";

import { categoryDescriptions, categoryLabels, siteConfig } from "@/lib/site";

export type { CategorySummary, ContentEntry, DirectoryEntry };

const DATA_ORIGIN = "https://heyclau.de";
let directoryIndexPromise: Promise<DirectoryEntry[]> | null = null;
const entryDetailPromises = new Map<string, Promise<ContentEntry | null>>();

export async function loadJsonDataFile<T>(fileName: string): Promise<T> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", fileName);
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    // In the Cloudflare Worker runtime, read from the static ASSETS binding.
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as {
      ASSETS: {
        fetch: (
          input: RequestInfo | URL,
          init?: RequestInit,
        ) => Promise<Response>;
      };
    };
    const response = await envRecord.ASSETS.fetch(
      new Request(`${DATA_ORIGIN}/data/${fileName}`),
    );
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName} asset (${response.status})`);
    }
    return (await response.json()) as T;
  }
}

export async function loadTextDataFile(fileName: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", fileName);
    return await readFile(filePath, "utf8");
  } catch {
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as {
      ASSETS: {
        fetch: (
          input: RequestInfo | URL,
          init?: RequestInit,
        ) => Promise<Response>;
      };
    };
    const response = await envRecord.ASSETS.fetch(
      new Request(`${DATA_ORIGIN}/data/${fileName}`),
    );
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName} asset (${response.status})`);
    }
    return response.text();
  }
}

export function normalizeRegistryEntries<T>(payload: RegistryEnvelope<T>): T[] {
  if (!Array.isArray(payload?.entries)) {
    throw new Error("Invalid registry artifact: expected entries envelope");
  }
  return payload.entries;
}

const loadDirectoryIndex = cache(async (): Promise<DirectoryEntry[]> => {
  directoryIndexPromise ??= loadJsonDataFile<RegistryEnvelope<DirectoryEntry>>(
    "directory-index.json",
  ).then(normalizeRegistryEntries);
  return directoryIndexPromise;
});

export function isSafeContentPathPart(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

async function loadEntryDetail(category: string, slug: string) {
  if (!isSafeContentPathPart(category) || !isSafeContentPathPart(slug)) {
    return null;
  }

  const key = `${category}:${slug}`;
  let promise = entryDetailPromises.get(key);
  if (!promise) {
    promise = loadJsonDataFile<{
      schemaVersion?: number;
      entry?: ContentEntry;
    }>(`entries/${category}/${slug}.json`)
      .then((payload) => payload.entry ?? null)
      .catch(() => null);
    entryDetailPromises.set(key, promise);
  }

  return promise;
}

export const getAllEntries = cache(async (): Promise<ContentEntry[]> => {
  const directoryEntries = await getDirectoryEntries();
  const details = await Promise.all(
    directoryEntries.map((entry) => getEntry(entry.category, entry.slug)),
  );
  return details.filter((entry): entry is ContentEntry => Boolean(entry));
});

export const getDirectoryEntries = cache(
  async (): Promise<DirectoryEntry[]> => {
    return loadDirectoryIndex();
  },
);

export const getEntry = cache(async (category: string, slug: string) => {
  return loadEntryDetail(category, slug);
});

export const getEntryLlmsText = cache(
  async (category: string, slug: string) => {
    if (!isSafeContentPathPart(category) || !isSafeContentPathPart(slug)) {
      return null;
    }

    try {
      return await loadTextDataFile(`llms/${category}/${slug}.txt`);
    } catch {
      return null;
    }
  },
);

export const getRegistryManifest = cache(async () => {
  return loadJsonDataFile<ArtifactManifestV2>("registry-manifest.json");
});

export const getSearchIndex = cache(async () => {
  return loadJsonDataFile<RegistryEnvelope<SearchDocument>>(
    "search-index.json",
  ).then(normalizeRegistryEntries);
});

export const getEntriesByCategory = cache(async (category: string) => {
  const entries = await getDirectoryEntriesByCategory(category);
  const details = await Promise.all(
    entries.map((entry) => getEntry(entry.category, entry.slug)),
  );
  return details.filter((entry): entry is ContentEntry => Boolean(entry));
});

export const getDirectoryEntriesByCategory = cache(async (category: string) => {
  const entries = await getDirectoryEntries();
  return entries.filter((entry) => entry.category === category);
});

export const getCategorySummaries = cache(
  async (): Promise<CategorySummary[]> => {
    const entries = await getDirectoryEntries();
    return siteConfig.categoryOrder
      .map((category) => {
        const count = entries.filter(
          (entry) => entry.category === category,
        ).length;
        return {
          category,
          label: categoryLabels[category],
          count,
          description: categoryDescriptions[category],
        };
      })
      .filter((entry) => entry.count > 0);
  },
);

export const getRecentEntries = cache(async () => {
  const entries = await getDirectoryEntries();
  return [...entries]
    .filter((entry) => entry.dateAdded)
    .sort((left, right) =>
      String(right.dateAdded).localeCompare(String(left.dateAdded)),
    )
    .slice(0, 12);
});
