import { Constants, type Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserDashboard,
  getCategoryConfig,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { CheckCircle, Clock, GitPullRequest, Send, XCircle } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  BADGE_COLORS,
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { SubmissionCard } from '@/src/components/core/domain/submissions/submission-card';

import Loading from './loading';

/**
 * Produce metadata for the account submissions page while ensuring request-time evaluation.
 *
 * Awaits a request-time deferral before generating and returning the page metadata for "/account/submissions".
 *
 * @returns The Metadata object for the "/account/submissions" page.
 *
 * @see generatePageMetadata
 * @see connection
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/account/submissions');
}

/**
 * Extract and validate GitHub PR components from URL
 * Returns validated owner, repo, and PR number, or null if invalid
 * This allows us to reconstruct the URL from trusted components instead of using user input directly
 */
// Dangerous Unicode characters that could be used for attacks
// Using Set for O(1) lookup performance instead of O(n) array includes
const dangerousCharsSet = new Set([
  0x20_2e,
  0x20_2d,
  0x20_2c,
  0x20_2b,
  0x20_2a, // RTL override marks
  0x20_0e,
  0x20_0f, // Left-to-right/right-to-left marks
  0x20_66,
  0x20_67,
  0x20_68,
  0x20_69, // Directional isolates
]);

// Shared regex patterns for PR URL validation
// Owner: GitHub usernames are 1-39 chars, alphanumeric + hyphens only (no underscores)
// Must not have consecutive hyphens or trailing hyphens
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)?$/;
// Repo: 1-100 chars, alphanumeric + underscores + dots + hyphens
// Must not end in .git, and must not be . or ..
const REPO_REGEX = /^(?!\.git$|^\.\.?$)[\w.-]{1,100}$/;
const PR_NUMBER_REGEX = /^\d+$/;
// Full path pattern: /owner/repo/pull/number
// Uses loose capture groups, then validates components separately to avoid duplication
const PR_PATH_REGEX = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)$/;

/**
 * Formats a parseable date string to the en-US "MMM d, yyyy" style or returns "-" for missing/invalid input.
 *
 * @param dateString - The date string to format.
 * @returns The formatted date (e.g., "Jan 2, 2024"), or "-" if `dateString` is missing or invalid.
 */
function formatSubmissionDate(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') {
    return '-';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Parse a GitHub pull request URL and return its owner, repository, and PR number when the URL is a safe, well-formed GitHub PR link.
 *
 * @param url - Candidate URL string to validate and parse.
 * @returns An object `{ owner, repo, prNumber }` when `url` is a valid `https://github.com/:owner/:repo/pull/:number` URL; `null` otherwise.
 *
 * @see buildSafePrUrl
 * @see PR_PATH_REGEX
 * @see dangerousCharsSet
 */
function extractPrComponents(
  url: null | string | undefined
): null | { owner: string; prNumber: string; repo: string } {
  if (!url || typeof url !== 'string') return null;

  // Disallow control characters, invisible chars, and dangerous unicode
  for (let index = 0; index < url.length; index++) {
    const code = url.codePointAt(index);
    if (
      code === undefined ||
      (code >= 0x0 && code <= 0x1f) ||
      (code >= 0x7f && code <= 0x9f) ||
      dangerousCharsSet.has(code)
    ) {
      return null;
    }
  }

  try {
    const parsed = new URL(url);
    // Only allow HTTPS links to github.com
    if (parsed.protocol.toLowerCase() !== 'https:') return null;
    if (parsed.hostname.toLowerCase() !== 'github.com') return null;
    // Reject any query parameters or fragments
    if (parsed.search || parsed.hash) return null;
    // Reject if username/password present
    if (parsed.username || parsed.password) return null;
    // Match path structure with loose capture groups, then validate components separately
    const pathMatch = parsed.pathname.match(PR_PATH_REGEX);
    if (!pathMatch || pathMatch.length < 4) return null;

    const [, owner, repo, prNumber] = pathMatch;

    // Validate owner and repo against their specific regex patterns
    if (!owner || !OWNER_REGEX.test(owner)) return null;
    if (!repo || !REPO_REGEX.test(repo)) return null;
    if (!prNumber || !PR_NUMBER_REGEX.test(prNumber)) return null;

    return { owner, repo, prNumber };
  } catch {
    return null;
  }
}

/**
 * Construct a safe GitHub PR URL from validated components
 * This ensures we're using only trusted, validated data instead of user-controlled URLs
 * Uses URL constructor for canonicalization to prevent encoding-based attacks
 * @param owner
 * @param repo
 * @param prNumber
 
 * @returns {unknown} Description of return value*/
function buildSafePrUrl(owner: string, repo: string, prNumber: string): string {
  // Additional validation matching GitHub's rules using shared regex patterns
  if (!OWNER_REGEX.test(owner) || !REPO_REGEX.test(repo) || !PR_NUMBER_REGEX.test(prNumber)) {
    return '#';
  }
  try {
    // Use URL constructor to get canonicalized, normalized URL
    // This prevents encoding-based attacks and ensures proper URL encoding
    const url = new URL(`https://github.com/${owner}/${repo}/pull/${prNumber}`);
    // Return the canonicalized href (guaranteed to be normalized and safe)
    return url.href;
  } catch {
    // If URL construction fails, return fallback
    return '#';
  }
}

// Allow-list of valid content types shown in URLs
// Use Constants from database types to ensure sync with database enum
const ALLOWED_TYPES = Constants.public.Enums.submission_type;

// Typed copy for use as submission_type array
const ALLOWED_TYPES_ARRAY: Database['public']['Enums']['submission_type'][] = [...ALLOWED_TYPES];

/**
 * Validates that a content slug contains only lowercase letters, digits, hyphens, or underscores.
 *
 * @param slug - Candidate slug to validate (no dots, slashes, spaces, percent-encoding, or uppercase letters).
 * @returns `true` if `slug` matches `/^[a-z0-9-_]+$/`, `false` otherwise.
 *
 * @see getSafeContentUrl
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  // No path separators, no dots, no percent-encoding, no special chars
  return /^[a-z0-9-_]+$/.test(slug);
}

/**
 * Checks whether a string is one of the allowed submission_type values.
 *
 * @param type - Candidate submission type string to validate
 * @returns `true` if `type` is one of the allowed submission_type values, `false` otherwise.
 *
 * @see ALLOWED_TYPES
 */
function isSafeType(type: string): type is Database['public']['Enums']['submission_type'] {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

/**
 * Constructs a safe internal content URL for a validated submission type and slug.
 *
 * Validates that `type` is an allowed submission_type and `slug` matches the expected
 * pattern before constructing the path.
 *
 * @param type - The submission type to use in the URL (must be an allowed `submission_type`)
 * @param slug - The content slug (must match `^[a-z0-9-_]+$`)
 * @returns The internal URL path in the form `/type/slug` if both inputs are valid, `null` otherwise.
 *
 * @see isSafeType
 * @see isValidSlug
 */
function getSafeContentUrl(
  type: Database['public']['Enums']['submission_type'],
  slug: string
): null | string {
  if (!isSafeType(type) || !isValidSlug(slug)) {
    return null;
  }
  return `/${type}/${slug}`;
}

/**
 * Render the authenticated user's submissions page.
 *
 * Fetches the current request's authenticated user and their dashboard submissions, validates
 * external PR and internal content links, and renders the appropriate UI (submissions list,
 * sign-in prompt, or error message) for this server-rendered page.
 *
 * @returns A React Server Component subtree representing the submissions page.
 *
 * @see SubmissionCard
 * @see getUserDashboard
 * @see getAuthenticatedUser
 * @see getSafeContentUrl
 * @see extractPrComponents
 */
export default async function SubmissionsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'SubmissionsPage',
    route: '/account/submissions',
    module: 'apps/web/src/app/account/submissions',
  });

  return (
    <Suspense fallback={<Loading />}>
      <SubmissionsPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Render the authenticated user's submissions page content, including list, empty state, and error or sign-in prompts.
 *
 * @param reqLogger - Request-scoped logger used for telemetry and data-integrity warnings; a child logger is created with user context when available.
 * @param reqLogger.reqLogger
 * @returns A React element containing the submissions UI: sign-in prompt when unauthenticated, an error message on fetch failure, an empty-state call-to-action when no submissions exist, or a grid of submission cards when submissions are available.
 *
 * @see getAuthenticatedUser
 * @see getUserDashboard
 * @see SubmissionCard
 * @see extractPrComponents
 * @see buildSafePrUrl
 * @see getSafeContentUrl
 */
async function SubmissionsPageContent({
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
}) {
  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'SubmissionsPage' });

  if (!user) {
    reqLogger.warn(
      {
        section: 'data-fetch',
        timestamp: new Date().toISOString(),
      },
      'SubmissionsPage: unauthenticated access attempt'
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view and manage your submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  // Section: Submissions Data Fetch
  let submissions: NonNullable<
    Database['public']['Functions']['get_user_dashboard']['Returns']['submissions']
  > = [];
  let hasError = false;
  try {
    const data = await getUserDashboard(user.id);
    if (data?.submissions) {
      submissions = data.submissions;
    } else {
      userLogger.error(
        {
          section: 'data-fetch',
          err: new Error('getUserDashboard returned null'),
        },
        'SubmissionsPage: getUserDashboard returned null'
      );
      hasError = true;
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submissions from dashboard');
    userLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'SubmissionsPage: getUserDashboard threw'
    );
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Unable to load submissions</CardTitle>
            <CardDescription>
              We couldn&apos;t load your submissions right now. Please refresh or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid enum values for validation - use Constants from database types
  const VALID_SUBMISSION_STATUSES = Constants.public.Enums.submission_status;

  /**
   * Validate submission status against enum values
   *
   * @param status - The status value to validate
   * @returns True if status is a valid submission_status enum value, false otherwise
   */
  function isValidSubmissionStatus(
    status: unknown
  ): status is Database['public']['Enums']['submission_status'] {
    if (typeof status !== 'string') return false;
    return (VALID_SUBMISSION_STATUSES as readonly string[]).includes(status);
  }

  /**
   * Validate submission type against enum values
   *
   * @param type - The type value to validate
   * @returns True if type is a valid submission_type enum value, false otherwise
   */
  function isValidSubmissionType(
    type: unknown
  ): type is Database['public']['Enums']['submission_type'] {
    if (typeof type !== 'string') return false;
    return (ALLOWED_TYPES as readonly string[]).includes(type);
  }

  // Use Constants for enum values in Record keys
  // Use string literals directly to avoid unsafe assignment from array index access
  // Enum values: 'pending', 'approved', 'rejected', 'spam', 'merged'
  const SUBMISSION_STATUS_VARIANTS = {
    pending: { icon: Clock, label: 'Pending Review' },
    approved: { icon: CheckCircle, label: 'Approved' },
    rejected: { icon: XCircle, label: 'Rejected' },
    spam: { icon: XCircle, label: 'Spam' },
    merged: { icon: CheckCircle, label: 'Merged ✓' },
  } satisfies Record<
    Database['public']['Enums']['submission_status'],
    { icon: typeof Clock; label: string }
  >;

  const getStatusBadge = (status: Database['public']['Enums']['submission_status']) => {
    const variant = SUBMISSION_STATUS_VARIANTS[status];
    const Icon = variant.icon;
    const colorClass = BADGE_COLORS.submissionStatus[status];

    return (
      <UnifiedBadge variant="base" style="outline" className={colorClass}>
        <Icon className="mr-1 h-3 w-3" />
        {variant.label}
      </UnifiedBadge>
    );
  };

  const getTypeLabel = (type: Database['public']['Enums']['submission_type']): string => {
    // Map submission_type to content_category for config lookup
    // Use explicit enum string values instead of fragile numeric indexing
    const categoryMap: Record<
      Database['public']['Enums']['submission_type'],
      Database['public']['Enums']['content_category']
    > = {
      agents: 'agents',
      mcp: 'mcp',
      rules: 'rules',
      commands: 'commands',
      hooks: 'hooks',
      statuslines: 'statuslines',
      skills: 'skills',
    };

    const category = categoryMap[type];
    if (category && isValidCategory(category)) {
      const config = getCategoryConfig(category);
      return config?.typeName ?? type;
    }

    // Fallback to hardcoded labels if category mapping fails
    // Use explicit enum string values instead of fragile numeric indexing
    const fallbackLabels: Record<Database['public']['Enums']['submission_type'], string> = {
      agents: 'Claude Agent',
      mcp: 'MCP Server',
      rules: 'CLAUDE.md',
      commands: 'Command',
      hooks: 'Hook',
      statuslines: 'Statusline',
      skills: 'Skill',
    };
    return fallbackLabels[type];
  };

  /**
   * Produce safe GitHub PR link properties for a submission when its PR reference is valid.
   *
   * Validates and normalizes a submission's PR reference and returns an object suitable for link props.
   *
   * @param submission - A submission record (one element from `submissions`) that may contain `pr_url` and/or `pr_number`.
   * @returns `{ href: string }` with a canonical, validated GitHub PR URL if a safe PR link can be constructed, `null` otherwise.
   *
   * @see extractPrComponents
   * @see buildSafePrUrl
   */
  function getPrLinkProperties(submission: (typeof submissions)[number]) {
    const components = submission.pr_url ? extractPrComponents(submission.pr_url) : null;

    // Bail early if components are invalid
    if (!components) return null;

    // Use DB field with fallback to extracted value
    const prNumber = submission.pr_number ?? components.prNumber;
    if (!prNumber) return null;

    const safePrUrl = buildSafePrUrl(components.owner, components.repo, prNumber);
    return safePrUrl && safePrUrl !== '#' ? { href: safePrUrl } : null;
  }

  /**
   * Return a safe internal content link when the submission is merged and inputs are valid.
   *
   * @param type - The submission's type (one of Database.public.Enums.submission_type)
   * @param slug - The content slug to link to; must match the internal slug pattern
   * @param status - The submission's status (one of Database.public.Enums.submission_status)
   * @returns `{ href: string }` containing a safe `/type/slug` URL when `status` equals the merged status and `type`/`slug` validate; otherwise `null`
   *
   * @see getSafeContentUrl
   * @see Constants.public.Enums.submission_status
   */
  function getContentLinkProperties(
    type: Database['public']['Enums']['submission_type'],
    slug: string,
    status: Database['public']['Enums']['submission_status']
  ): null | { href: string } {
    const safeUrl = getSafeContentUrl(type, slug);
    return safeUrl && status === 'merged' ? { href: safeUrl } : null;
  }

  // Log any submissions with missing IDs for data integrity monitoring
  for (const [index, sub] of submissions.entries()) {
    if (!sub.id) {
      userLogger.warn({ section: 'data-fetch', index: index }, 'SubmissionsPage: submission missing ID');
    }
  }

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 text-3xl font-bold">My Submissions</h1>
          <p className="text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.SUBMIT}>
            <Send className={`mr-2 ${UI_CLASSES.ICON_SM}`} />
            New Submission
          </Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Send className={`mb-4 h-12 w-12 ${UI_CLASSES.ICON_NEUTRAL}`} />
            <h3 className="mb-2 text-xl font-semibold">No submissions yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md text-center">
              Share your Claude configurations with the community! Your contributions help everyone
              build better AI workflows.
            </p>
            <Button asChild>
              <Link href={ROUTES.SUBMIT}>
                <Send className={`mr-2 ${UI_CLASSES.ICON_SM}`} />
                Submit Your First Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission, index) => (
            <SubmissionCard
              key={submission.id ?? `submission-${index}`}
              submission={submission}
              index={index}
              getStatusBadge={getStatusBadge}
              getTypeLabel={getTypeLabel}
              formatSubmissionDate={formatSubmissionDate}
              getPrLinkProps={getPrLinkProperties}
              getContentLinkProps={getContentLinkProperties}
              isValidSubmissionStatus={isValidSubmissionStatus}
              isValidSubmissionType={isValidSubmissionType}
              VALID_SUBMISSION_STATUSES={[...VALID_SUBMISSION_STATUSES]}
              VALID_SUBMISSION_TYPES={ALLOWED_TYPES_ARRAY}
            />
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <GitPullRequest
              className={`${UI_CLASSES.ICON_MD} ${UI_CLASSES.ICON_INFO} ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-400">How it works</p>
              <p className="text-muted-foreground mt-1 text-sm">
                When you submit a configuration, we automatically create a Pull Request on GitHub.
                Our team reviews it for quality, security, and accuracy. Once approved and merged,
                your contribution goes live for everyone to use!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
