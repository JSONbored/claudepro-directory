import type { ContentEntry } from "./index.js";

export const DEFAULT_DIRECTORY_REPO_URL: string;
export function buildGitHubUrl(filePath: string, repoRoot: string): string;
export function parseGitHubRepo(repoUrl?: string | null): {
  owner: string;
  repo: string;
  key: string;
  url: string;
} | null;
export function normalizeDownloadUrl(downloadUrl?: string | null): string;
export function normalizeDateAdded(value: unknown): string | undefined;
export function isFirstPartyPackage(data?: Record<string, unknown>): boolean;
export function isLocalDownloadUrl(downloadUrl?: string | null): boolean;
export function localDownloadSourcePath(
  downloadUrl: string,
  contentRoot: string,
): string | null;
export function buildContentEntryFromMdx(params: {
  category: string;
  fileName: string;
  filePath: string;
  source: string;
  repoRoot: string;
  contentRoot: string;
  getLocalDownloadSha256?: (localDownloadPath: string) => string | null;
}): ContentEntry;
