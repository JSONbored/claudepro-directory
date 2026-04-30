export const SUBMISSION_SITE_URL: string;
export const GITHUB_NEW_ISSUE_URL: string;

export function slugify(value: string): string;
export function normalizeSubmissionFields(
  fields?: Record<string, unknown>,
): Record<string, string>;
export function buildIssueDraftFromSpec(
  spec: Record<string, unknown>,
  fields?: Record<string, unknown>,
): Record<string, unknown>;
export function buildSubmissionUrlsFromSpec(
  spec: Record<string, unknown>,
  args?: Record<string, unknown>,
): Record<string, unknown>;
export function getSubmissionSchemaFromSpec(
  spec: Record<string, unknown>,
  args?: Record<string, unknown>,
): Record<string, unknown>;
export function validateSubmissionDraftFromSpec(
  spec: Record<string, unknown>,
  args?: Record<string, unknown>,
): Record<string, unknown>;
export function searchDuplicateEntries(
  entries?: Array<Record<string, unknown>>,
  args?: Record<string, unknown>,
): Record<string, unknown>;
export function getCategorySubmissionGuidanceFromSpec(
  spec: Record<string, unknown>,
  args?: Record<string, unknown>,
): Record<string, unknown>;
