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

export type DownloadTrust = "first-party" | "external" | null;

export type SkillType = "general" | "capability-pack";
export type SkillLevel = "foundational" | "advanced" | "expert";
export type VerificationStatus = "draft" | "validated" | "production";

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
  skillType?: SkillType;
  skillLevel?: SkillLevel;
  verificationStatus?: VerificationStatus;
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
  downloadTrust?: DownloadTrust;
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

export type CategorySummary = {
  category: string;
  label: string;
  count: number;
  description: string;
};

export type DistributionBadge = {
  label: string;
  title: string;
};

export type RegistryEnvelope<T> = {
  schemaVersion: number;
  kind?: string;
  generatedAt?: string;
  count?: number;
  entries: T[];
};

export const categorySpec: Record<string, unknown>;
export const registryCategorySpec: Record<string, unknown>;
export const ENTRY_SCHEMA_VERSION: number;
export const RAYCAST_SCHEMA_VERSION: number;
export const REGISTRY_ARTIFACT_SCHEMA_VERSION: number;
export const SITE_URL: string;

export function compactCount(value: number): string;
export function firstUsefulLine(value?: string | null): string;
export function extractConfigCommand(value?: string | null): string;
export function buildCollectionSequence(entry: Partial<DirectoryEntry>): string;
export function getPreviewLine(entry: Partial<DirectoryEntry>): string;
export function getCopyText(entry: Partial<DirectoryEntry>): string;
export function getDistributionBadges(entry: Partial<DirectoryEntry>): DistributionBadge[];

export function generatedAtForEntries(entries: Partial<ContentEntry>[]): string;
export function buildDirectoryEntries(entries: ContentEntry[]): DirectoryEntry[];
export function buildSearchEntries(entries: ContentEntry[]): Record<string, unknown>[];
export function buildEntryDetail(entry: ContentEntry): Record<string, unknown>;
export function buildRaycastDetail(entry: ContentEntry): Record<string, unknown>;
export function buildRaycastEnvelope(entries: ContentEntry[]): Record<string, unknown>;
export function buildArtifactEnvelope<T>(kind: string, entries: T[], extra?: Record<string, unknown>): RegistryEnvelope<T>;
export function buildRegistryManifest(entries: ContentEntry[]): Record<string, unknown>;

export const CATEGORY_SCHEMAS: Record<string, { required: string[]; recommended: string[] }>;
export const FORBIDDEN_CONTENT_FIELDS: string[];
export function normalizeBody(body: string, category: string): string;
export function inferStructuredFields(data: Record<string, unknown>, body: string, category: string): Record<string, unknown>;
export function inferSectionBooleans(body?: string): { hasPrerequisites: boolean; hasTroubleshooting: boolean };
export function extractCodeBlocks(body: string): ContentCodeBlock[];
export function extractHeadings(body: string): ContentHeading[];
export function extractSections(body: string): Array<{ title: string; id: string; markdown: string }>;
export function headingId(text: string): string;
export function validateEntry(category: string, data: Record<string, unknown>, inferred?: Record<string, unknown>): Record<string, unknown>;

export const CORE_CATEGORIES: string[];
export const CATEGORY_REQUIREMENTS: Record<string, string[]>;
export const COMMON_REQUIRED_FIELDS: string[];
export const HEADING_KEY_MAP: Record<string, string>;
export function normalizeHeading(label: string): string;
export function normalizeValue(value: unknown): string;
export function slugify(value: unknown): string;
export function normalizeCategory(value: unknown): string;
export function parseIssueFormBody(body: string): Record<string, string>;
export function normalizeParsedFields(fields: Record<string, string>): Record<string, string>;
export function issueLabels(issue: Record<string, unknown>): string[];
export function validateSubmission(issue: Record<string, unknown>): Record<string, unknown>;
