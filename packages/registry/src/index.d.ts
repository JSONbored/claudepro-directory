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
export type SkillSupportLevel = "native-skill" | "adapter" | "manual-context";

export type SkillPlatformCompatibility = {
  platform: string;
  supportLevel: SkillSupportLevel | string;
  installPath: string;
  adapterPath?: string;
  verifiedAt?: string;
};

export type SkillPackage = {
  format: "agent-skill" | string;
  entrypoint: string;
  downloadUrl: string;
  sha256?: string | null;
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
  contentUpdatedAt?: string;
  tags: string[];
  keywords: string[];
  readingTime?: number;
  difficultyScore?: number;
  documentationUrl?: string;
  websiteUrl?: string;
  affiliateUrl?: string;
  pricingModel?: string;
  disclosure?: Disclosure;
  applicationCategory?: string;
  operatingSystem?: string;
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
  platformCompatibility?: SkillPlatformCompatibility[];
  skillPackage?: SkillPackage;
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

export type RegistryCategorySpecEntry = {
  label: string;
  description: string;
  seoDescription?: string;
  usageHint: string;
  quickstart?: string[];
  template: string;
  requiresAssetContent: boolean;
  requiresUsageSnippet: boolean;
  supportsSkillMetadata: boolean;
  supportsDownloadUrl: boolean;
};

export type RegistryCategorySpec = {
  categoryOrder: string[];
  submissionOrder: string[];
  commonIssueRequiredFields: string[];
  skillTypeValues: SkillType[];
  skillLevelValues: SkillLevel[];
  verificationStatusValues: VerificationStatus[];
  defaultTestedPlatforms: string[];
  aliases: Record<string, string>;
  categories: Record<string, RegistryCategorySpecEntry>;
};

export type DistributionBadge = {
  label: string;
  title: string;
};

export type Disclosure =
  | "editorial"
  | "heyclaude_pick"
  | "affiliate"
  | "sponsored"
  | "claimed";
export type CommercialTier = "free" | "standard" | "featured" | "sponsored";
export type ListingLeadKind = "job" | "tool" | "claim";
export type ListingLead = {
  kind: ListingLeadKind;
  tierInterest: CommercialTier;
  contactName: string;
  contactEmail: string;
  companyName: string;
  listingTitle: string;
  websiteUrl?: string;
  applyUrl?: string;
  message?: string;
};
export type CommercialPlacement = {
  targetKind: "job" | "tool" | "entry";
  targetKey: string;
  tier: Exclude<CommercialTier, "free">;
  disclosure: Disclosure;
  startsAt?: string;
  expiresAt?: string;
};
export type ToolListing = DirectoryEntry & {
  websiteUrl?: string;
  pricingModel?: string;
  disclosure?: Disclosure;
  placement?: CommercialPlacement;
  featured?: boolean;
  sponsored?: boolean;
};
export type JsonLdDocument = Record<string, unknown>;
export type SeoDocument = {
  title: string;
  description: string;
  path: string;
  jsonLd?: JsonLdDocument[];
};

export type DerivedSeoFields = {
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
};

export function platformFeedSlug(platform: string): string;
export function buildCategoryDistributionFeed(
  entries: ContentEntry[],
  category: string,
  params?: { siteUrl?: string },
): unknown;
export function buildPlatformDistributionFeed(
  entries: ContentEntry[],
  platform: string,
  params?: { siteUrl?: string },
): unknown;
export function buildDistributionFeedIndex(
  entries: ContentEntry[],
  params?: { siteUrl?: string },
): unknown;

export function deriveSeoFields(
  data?: Record<string, unknown>,
  category?: string,
): DerivedSeoFields;

export type SourceProvenance = {
  sourceQuality: string;
  hasExternalSource: boolean;
  hasRepository: boolean;
  hasDocumentation: boolean;
  hasFirstPartyPackage: boolean;
  sourceUrls: string[];
  externalSourceUrls: string[];
};

export type EntryQualityReport = {
  key: string;
  category: string;
  slug: string;
  title: string;
  scores: {
    total: number;
    usefulness: number;
    source: number;
    copyability: number;
    freshness: number;
    seo: number;
  };
  provenance: SourceProvenance;
  warnings: string[];
};

export type ContentQualityPrompt = {
  key: string;
  category: string;
  slug: string;
  title: string;
  score: number;
  priority: "high" | "medium" | "low";
  prompt: string;
  warnings: string[];
};

export type SubmissionFieldSpec = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  render?: string;
  options?: string[];
};

export type IssueTemplateSpec = {
  schemaVersion: number;
  category: string;
  template?: string;
  labels: string[];
  title: string;
  fields: SubmissionFieldSpec[];
};

export type SubmissionIssueDraft = {
  title: string;
  body: string;
  labels: string[];
};

export function normalizeSubmissionPayloadFields(
  fields?: Record<string, unknown>,
): Record<string, string>;
export function buildSubmissionIssueTitle(
  fields?: Record<string, unknown>,
): string;
export function buildSubmissionIssueBody(
  fields?: Record<string, unknown>,
): string;
export function buildSubmissionIssueDraft(
  fields?: Record<string, unknown>,
): SubmissionIssueDraft;

export type SubmissionValidationReport = {
  ok: boolean;
  skipped: boolean;
  reason: string;
  category: string;
  errors: string[];
  warnings: string[];
  fields: Record<string, string>;
};

export type SubmissionQueueEntry = {
  number: number | null;
  title: string;
  url: string;
  author: string;
  updatedAt: string;
  labels: string[];
  recommendedLabels: string[];
  status: "import_ready" | "needs_changes" | "skipped";
  category: string;
  slug: string;
  name: string;
  errors: string[];
  warnings: string[];
  importPath: string;
};

export type SubmissionQueue = {
  schemaVersion: number;
  kind: "submission-queue";
  generatedAt: string;
  count: number;
  summary: {
    importReady: number;
    needsChanges: number;
    skipped: number;
  };
  entries: SubmissionQueueEntry[];
};

export type JsonLdSnapshot = {
  key: string;
  category: string;
  slug: string;
  url: string;
  documents: JsonLdDocument[];
};

export type SearchDocument = {
  category: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
  author: string;
  dateAdded: string;
  installable: boolean;
  downloadTrust: DownloadTrust;
  verificationStatus: string;
  platforms?: string[];
  supportLevels?: string[];
  documentationUrl: string;
  repoUrl: string;
  url: string;
};

export type ArtifactManifestV2 = {
  schemaVersion: number;
  kind?: string;
  generatedAt: string;
  totalEntries: number;
  categoryOrder: string[];
  categories: Record<string, { count: number; label: string }>;
  artifacts: Record<string, string>;
  routes?: Array<{
    key: string;
    category: string;
    slug: string;
    canonicalUrl: string;
  }>;
  qualitySummary?: Record<string, unknown>;
  artifactContracts?: Record<
    string,
    { path: string; type: string; sha256: string }
  >;
};

export type RegistryEnvelope<T> = {
  schemaVersion: number;
  kind?: string;
  generatedAt?: string;
  count?: number;
  entries: T[];
};

export const categorySpec: RegistryCategorySpec;
export const registryCategorySpec: RegistryCategorySpec;
export const ENTRY_SCHEMA_VERSION: number;
export const RAYCAST_SCHEMA_VERSION: number;
export const REGISTRY_ARTIFACT_SCHEMA_VERSION: number;
export const SITE_URL: string;
export const RAYCAST_COPY_PREVIEW_LIMIT: number;

export function compactCount(value: number): string;
export function firstUsefulLine(value?: string | null): string;
export function extractConfigCommand(value?: string | null): string;
export function buildCollectionSequence(entry: Partial<DirectoryEntry>): string;
export function getPreviewLine(entry: Partial<DirectoryEntry>): string;
export function getCopyText(entry: Partial<DirectoryEntry>): string;
export function getDistributionBadges(
  entry: Partial<DirectoryEntry>,
): DistributionBadge[];
export function buildContentPromptArtifact(entries: ContentEntry[]): {
  schemaVersion: number;
  kind: string;
  generatedAt: string;
  count: number;
  prompts: ContentQualityPrompt[];
};
export function buildRegistryArtifactSet(
  entries: ContentEntry[],
  params?: {
    siteUrl?: string;
    siteName?: string;
    siteDescription?: string;
  },
): Array<
  | {
      path: string;
      type: "json";
      value: unknown;
    }
  | {
      path: string;
      type: "text";
      value: string;
    }
>;
export function buildSkillPlatformCompatibility(
  entry: ContentEntry,
): SkillPlatformCompatibility[];
export function buildCursorSkillAdapter(entry: ContentEntry): string;
export function summarizePlacementExpiry(
  placements: Array<Record<string, unknown>>,
  now?: Date | string,
  reminderWindowDays?: number,
): Array<{
  targetKind: string;
  targetKey: string;
  tier: CommercialTier;
  status: string;
  expiresAt: string;
  daysUntilExpiry: number | null;
  needsRenewalReminder: boolean;
  expired: boolean;
}>;
export function buildPlacementRenewalReminder(summary: {
  targetKind: string;
  targetKey: string;
  tier: CommercialTier;
  daysUntilExpiry: number | null;
  needsRenewalReminder: boolean;
}): string;
export const LISTING_LEAD_KINDS: string[];
export const COMMERCIAL_TIERS: string[];
export const COMMERCIAL_PLACEMENT_TARGETS: string[];
export const DISCLOSURE_STATES: string[];
export const COMMERCIAL_STATUSES: string[];
export function normalizeCommercialTier(value: unknown): CommercialTier;
export function normalizeLeadKind(value: unknown): ListingLeadKind;
export function normalizeDisclosure(value: unknown): Disclosure;
export function isPaidOrAffiliateDisclosure(value: unknown): boolean;
export function normalizePricingModel(value: unknown): string;
export function validateListingLeadPayload(payload: Record<string, unknown>): {
  ok: boolean;
  errors: string[];
  data: ListingLead;
};
export function normalizeCommercialStatus(value: unknown): string;
export function isPlacementActive(
  placement?: Record<string, unknown>,
  now?: Date | string,
): boolean;
export function linkRelForDisclosure(value: unknown): string;
export function toolPlacementRank(tool: Record<string, unknown>): number;
export function compareToolListings(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): number;
export function nextLeadStatus(currentStatus: unknown, action: unknown): string;

export function absoluteSiteUrl(siteUrl: string, path?: string): string;
export function buildOrganizationJsonLd(
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildWebsiteJsonLd(
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildSearchActionJsonLd(
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildWebPageJsonLd(
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildCollectionPageJsonLd(
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
): JsonLdDocument;
export function buildItemListJsonLd(
  items: Array<{ name?: string; title?: string; url: string }>,
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildEntryJsonLd(
  entry: Partial<ContentEntry>,
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildToolSoftwareApplicationJsonLd(
  tool: Partial<ToolListing>,
  params?: Record<string, unknown>,
): JsonLdDocument | null;
export function buildJobPostingJsonLd(
  job: Record<string, unknown>,
  params?: Record<string, unknown>,
): JsonLdDocument;
export function buildEntryJsonLdSnapshot(
  entry: Partial<ContentEntry>,
  params?: Record<string, unknown>,
): JsonLdSnapshot;

export function generatedAtForEntries(entries: Partial<ContentEntry>[]): string;
export function buildDirectoryEntries(
  entries: ContentEntry[],
): DirectoryEntry[];
export function buildSearchEntries(entries: ContentEntry[]): SearchDocument[];
export function buildEntryDetail(entry: ContentEntry): Record<string, unknown>;
export function buildRaycastDetail(
  entry: ContentEntry,
): Record<string, unknown>;
export function buildRaycastEnvelope(
  entries: ContentEntry[],
): Record<string, unknown>;
export function buildArtifactHash(
  value: unknown,
  type?: "json" | "text",
): string;
export function buildReadOnlyEcosystemFeed(
  entries: ContentEntry[],
  params?: Record<string, unknown>,
): Record<string, unknown>;
export function buildMcpRegistryFeed(
  entries: ContentEntry[],
): Record<string, unknown>;
export function buildPluginExportFeed(
  entries: ContentEntry[],
): Record<string, unknown>;
export function buildRegistryChangelogFeed(
  entries: ContentEntry[],
): Record<string, unknown>;
export function buildArtifactEnvelope<T>(
  kind: string,
  entries: T[],
  extra?: Record<string, unknown>,
): RegistryEnvelope<T>;
export function buildEnvelopeEntries<T>(payload: RegistryEnvelope<T>): T[];
export function buildRegistryManifest(
  entries: ContentEntry[],
): ArtifactManifestV2;
export function buildArtifactManifestV2(
  entries: ContentEntry[],
  extra?: Record<string, unknown>,
): ArtifactManifestV2;
export function buildContentQualityArtifact(
  entries: ContentEntry[],
): Record<string, unknown>;
export function buildJsonLdSnapshots(
  entries: ContentEntry[],
  params?: Record<string, unknown>,
): Record<string, unknown>;
export function buildEntryLlmsArtifact(
  entry: ContentEntry,
  params?: Record<string, unknown>,
): string;
export function buildCorpusLlmsArtifact(
  entries: ContentEntry[],
  params?: Record<string, unknown>,
): string;
export const QUALITY_REPORT_SCHEMA_VERSION: number;
export const LLMS_ARTIFACT_SCHEMA_VERSION: number;
export const SUBMISSION_SPEC_SCHEMA_VERSION: number;
export function buildSourceProvenance(
  entry: Partial<ContentEntry>,
): SourceProvenance;
export function buildEntryQuality(
  entry: Partial<ContentEntry>,
  referenceDate?: Date | string,
): EntryQualityReport;
export function findDuplicateBodyGroups(
  entries: Partial<ContentEntry>[],
): Array<Array<Record<string, unknown>>>;
export function buildContentQualityReport(
  entries: Partial<ContentEntry>[],
): Record<string, unknown>;
export function renderEntryLlms(
  entry: Partial<ContentEntry>,
  params?: Record<string, unknown>,
): string;
export function buildEntryCitationFacts(
  entry: Partial<ContentEntry>,
  params?: Record<string, unknown>,
): string;
export function renderCorpusLlms(
  entries: Partial<ContentEntry>[],
  params?: Record<string, unknown>,
): string;
export function buildSubmissionFieldModel(category: string): {
  schemaVersion: number;
  category: string;
  label: string;
  description: string;
  template?: string;
  fields: SubmissionFieldSpec[];
} | null;
export function buildIssueTemplateSpec(
  category: string,
): IssueTemplateSpec | null;
export function buildSubmissionSpecs(): Record<string, unknown>;
export const CATEGORY_SCHEMAS: Record<
  string,
  { required: string[]; recommended: string[] }
>;
export const FORBIDDEN_CONTENT_FIELDS: string[];
export function normalizeBody(body: string, category: string): string;
export function inferStructuredFields(
  data: Record<string, unknown>,
  body: string,
  category: string,
): Record<string, unknown>;
export function inferSectionBooleans(body?: string): {
  hasPrerequisites: boolean;
  hasTroubleshooting: boolean;
};
export function extractCodeBlocks(body: string): ContentCodeBlock[];
export function extractHeadings(body: string): ContentHeading[];
export function extractSections(
  body: string,
): Array<{ title: string; id: string; markdown: string }>;
export function headingId(text: string): string;
export function validateEntry(
  category: string,
  data: Record<string, unknown>,
  inferred?: Record<string, unknown>,
): Record<string, unknown>;

export const CORE_CATEGORIES: string[];
export const CATEGORY_REQUIREMENTS: Record<string, string[]>;
export const COMMON_REQUIRED_FIELDS: string[];
export const HEADING_KEY_MAP: Record<string, string>;
export function normalizeHeading(label: string): string;
export function normalizeValue(value: unknown): string;
export function slugify(value: unknown): string;
export function normalizeCategory(value: unknown): string;
export function parseIssueFormBody(body: string): Record<string, string>;
export function normalizeParsedFields(
  fields: Record<string, string>,
): Record<string, string>;
export function issueLabels(issue: Record<string, unknown>): string[];
export function looksLikeSubmissionIssue(
  issue: Record<string, unknown>,
): boolean;
export function isLikelyAffiliateUrl(value: unknown): boolean;
export function recommendedSubmissionLabels(
  issue: Record<string, unknown>,
  report?: SubmissionValidationReport,
): string[];
export function submissionQueueStatus(
  report: SubmissionValidationReport,
): string;
export const SUBMISSION_BASE_LABELS: string[];
export const COMMUNITY_CATEGORY_LABELS: Record<string, string>;
export function submissionLabelsForCategory(category: string): string[];
export function recommendedLabelsForCategory(category: string): string[];
export function buildSubmissionQueue(
  issues: Array<Record<string, unknown>>,
): SubmissionQueue;
export function validateSubmission(
  issue: Record<string, unknown>,
): SubmissionValidationReport;
