import fs from "node:fs";
import path from "node:path";

import type {
  ContentEntry,
  DirectoryEntry,
  RegistryEnvelope,
  SearchDocument,
} from "@heyclaude/registry";

export const repoRoot = process.cwd();
export const dataRoot = path.join(repoRoot, "apps/web/public/data");

export function readDataJson<T>(relativePath: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(dataRoot, relativePath), "utf8"),
  ) as T;
}

export function readEnvelopeEntries<T>(relativePath: string): T[] {
  const payload = readDataJson<RegistryEnvelope<T>>(relativePath);
  if (!payload || Array.isArray(payload) || !Array.isArray(payload.entries)) {
    throw new Error(`${relativePath} must be a registry envelope`);
  }
  return payload.entries;
}

export function loadDirectoryEntries(): DirectoryEntry[] {
  return readEnvelopeEntries<DirectoryEntry>("directory-index.json");
}

export function loadSearchEntries(): SearchDocument[] {
  return readEnvelopeEntries<SearchDocument>("search-index.json");
}

export function loadContentEntries(): ContentEntry[] {
  return loadDirectoryEntries().map((entry) => {
    const detail = readDataJson<{ entry: ContentEntry }>(
      `entries/${entry.category}/${entry.slug}.json`,
    );
    return detail.entry;
  });
}
