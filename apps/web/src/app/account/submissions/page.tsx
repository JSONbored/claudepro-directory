import {
  submission_type as SubmissionType,
  submission_status as SubmissionStatus,
} from '@prisma/client';
import type {
  content_category,
  submission_status,
  submission_type,
} from '@prisma/client';
import {
  type GetUserCompleteDataReturns,
  type GetUserDashboardReturns,
} from '@heyclaude/data-layer';
type UserDashboardSubmission = GetUserDashboardReturns['submissions'][number];
import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { getUserCompleteData } from '@heyclaude/web-runtime/data/account';
import { getCategoryConfig } from '@heyclaude/web-runtime/data/config/category';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { formatDate } from '@heyclaude/web-runtime/data/utils';
import { CheckCircle, Clock, GitPullRequest, Send, XCircle } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { Suspense } from 'react';

import { SignInButton } from '@/src/components/core/auth/sign-in-button';
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
  'use cache';
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
// Pattern: starts with alphanumeric, then allows any number of either alphanumeric characters
// or a hyphen only when that hyphen is immediately followed by an alphanumeric
// This ensures: no consecutive hyphens, no trailing hyphens, always starts and ends with alphanumeric
// For single character usernames, the start character also serves as the end character
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/;
// Repo: 1-100 chars, alphanumeric + underscores + dots + hyphens
// Must not end in .git, and must not be . or ..
// Pattern: must not be ., .., or end in .git, and must match valid repo name pattern
const REPO_REGEX = /^(?!\.\.?$|.*\.git$)[\w.-]{1,100}$/;
const PR_NUMBER_REGEX = /^\d+$/;
// Full path pattern: /owner/repo/pull/number
// Uses loose capture groups, then validates components separately to avoid duplication
const PR_PATH_REGEX = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)$/;

/***
 * Formats a parseable date string to the en-US "MM dd, yyyy" style or returns "-" for missing/invalid input.
 *
 * @param {string} dateString - The date string to format.
 * @returns The formatted date (e.g., "Jan 2, 2024"), or "-" if `dateString` is missing or invalid.
 */
function formatSubmissionDate(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') {
    return '-';
  }
  try {
    return formatDate(dateString, 'short');
  } catch {
    return '-';
  }
}

/***
 * Parse a GitHub pull request URL and return its owner, repository, and PR number when the URL is a safe, well-formed GitHub PR link.
 *
 * @param {null | string | undefined} url - Candidate URL string to validate and parse.
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

    return { owner, prNumber, repo };
  } catch {
    return null;
  }
}

/*****
 * Construct a safe GitHub PR URL from validated components
 * This ensures we're using only trusted, validated data instead of user-controlled URLs
 * Uses URL constructor for canonicalization to prevent encoding-based attacks
 * @param {string} owner - GitHub repository owner name
 * @param {string} repo - GitHub repository name
 * @param {string} prNumber - Pull request number
 
 * @returns {string} The constructed URL (or string result returned by the function)
 */
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
// Use Prisma enum value object to ensure sync with database enum
const ALLOWED_TYPES = SubmissionType;

// Typed copy for use as submission_type array
const ALLOWED_TYPES_ARRAY: submission_type[] = Object.values(ALLOWED_TYPES) as submission_type[];

/***
 * Validates that a content slug contains only lowercase letters, digits, hyphens, or underscores.
 *
 * @param {string} slug - Candidate slug to validate (no dots, slashes, spaces, percent-encoding, or uppercase letters).
 * @returns `true` if `slug` matches `/^[a-z0-9-_]+$/`, `false` otherwise.
 *
 * @see getSafeContentUrl
 */
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  // No path separators, no dots, no percent-encoding, no special chars
  return /^[a-z0-9-_]+$/.test(slug);
}

/***
 * Checks whether a string is one of the allowed submission_type values.
 *
 * @param {string} type - Candidate submission type string to validate
 * @returns `true` if `type` is one of the allowed submission_type values, `false` otherwise.
 *
 * @see ALLOWED_TYPES
 */
function isSafeType(type: string): type is submission_type {
  return (Object.values(ALLOWED_TYPES) as readonly submission_type[]).includes(
    type as submission_type
  );
}

/****
 * Constructs a safe internal content URL for a validated submission type and slug.
 *
 * Validates that `type` is an allowed submission_type and `slug` matches the expected
 * pattern before constructing the path.
 *
 * @param {submission_type} type - The submission type to use in the URL (must be an allowed `submission_type`)
 * @param {string} slug - The content slug (must match `^[a-z0-9-_]+$`)
 * @returns The internal URL path in the form `/type/slug` if both inputs are valid, `null` otherwise.
 *
 * @see isSafeType
 * @see isValidSlug
 */
function getSafeContentUrl(type: submission_type, slug: string): null | string {
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
 * @see getUserCompleteData
 * @see getAuthenticatedUser
 * @see getSafeContentUrl
 * @see extractPrComponents
 */
export default async function SubmissionsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/submissions',
    operation: 'SubmissionsPage',
    route: '/account/submissions',
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
 * @param reqLogger - Request-scoped logger used for telemetry and data-integrity warnings; a child logger is created with user context when available
 * @param reqLogger.reqLogger
 * @returns A React element containing the submissions UI: sign-in prompt when unauthenticated, an error message on fetch failure, an empty-state call-to-action when no submissions exist, or a grid of submission cards when submissions are available.
 *
 * @see getAuthenticatedUser
 * @see getUserCompleteData
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
      },
      'SubmissionsPage: unauthenticated access attempt'
    );
    return (
      <div className="space-y-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription className="text-sm">
              Please sign in to view and manage your submissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton
              redirectTo="/account/submissions"
              valueProposition="Sign in to view and manage your submissions"
            >
              Go to login
            </SignInButton>
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
  let submissions: NonNullable<GetUserCompleteDataReturns['user_dashboard']>['submissions'] = [];
  let hasError = false;
  try {
    const completeData = await getUserCompleteData(user.id);
    if (completeData?.user_dashboard?.submissions) {
      submissions = completeData.user_dashboard.submissions;
    } else {
      userLogger.error(
        {
          err: new Error('getUserCompleteData returned null or missing user_dashboard'),
          section: 'data-fetch',
        },
        'SubmissionsPage: getUserCompleteData returned null or missing user_dashboard'
      );
      hasError = true;
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submissions from dashboard');
    userLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'SubmissionsPage: getUserCompleteData threw'
    );
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Unable to load submissions</CardTitle>
            <CardDescription className="text-sm">
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

  // Valid enum values for validation - use Prisma enum value object
  const VALID_SUBMISSION_STATUSES = SubmissionStatus;

  /***
   * Validate submission status against enum values
   *
   * @param {unknown} status - The status value to validate
   * @returns True if status is a valid submission_status enum value, false otherwise
   */
  function isValidSubmissionStatus(status: unknown): status is submission_status {
    if (typeof status !== 'string') return false;
    return (Object.values(VALID_SUBMISSION_STATUSES) as readonly submission_status[]).includes(
      status as submission_status
    );
  }

  /***
   * Validate submission type against enum values
   *
   * @param {unknown} type - The type value to validate
   * @returns True if type is a valid submission_type enum value, false otherwise
   */
  function isValidSubmissionType(type: unknown): type is submission_type {
    if (typeof type !== 'string') return false;
    return (Object.values(ALLOWED_TYPES) as readonly submission_type[]).includes(
      type as submission_type
    );
  }

  // Use Constants for enum values in Record keys
  // Use string literals directly to avoid unsafe assignment from array index access
  // Enum values: 'pending', 'approved', 'rejected', 'spam', 'merged'
  const SUBMISSION_STATUS_VARIANTS = {
    approved: { icon: CheckCircle, label: 'Approved' },
    merged: { icon: CheckCircle, label: 'Merged ✓' },
    pending: { icon: Clock, label: 'Pending Review' },
    rejected: { icon: XCircle, label: 'Rejected' },
    spam: { icon: XCircle, label: 'Spam' },
  } satisfies Record<submission_status, { icon: typeof Clock; label: string }>;

  // Direct Tailwind utilities mapping
  const submissionStatusBadgeMap: Record<submission_status, string> = {
    approved:
      'bg-color-badge-submissionstatus-approved-bg text-color-badge-submissionstatus-approved-text border-color-badge-submissionstatus-approved-border',
    merged:
      'bg-color-badge-submissionstatus-merged-bg text-color-badge-submissionstatus-merged-text border-color-badge-submissionstatus-merged-border',
    pending:
      'bg-color-badge-submissionstatus-pending-bg text-color-badge-submissionstatus-pending-text border-color-badge-submissionstatus-pending-border',
    rejected:
      'bg-color-badge-submissionstatus-rejected-bg text-color-badge-submissionstatus-rejected-text border-color-badge-submissionstatus-rejected-border',
    spam: 'bg-color-badge-submissionstatus-spam-bg text-color-badge-submissionstatus-spam-text border-color-badge-submissionstatus-spam-border',
  };

  const getStatusBadge = (status: submission_status) => {
    const variant = SUBMISSION_STATUS_VARIANTS[status];
    const Icon = variant.icon;
    const colorClass = submissionStatusBadgeMap[status];

    return (
      <UnifiedBadge className={colorClass} style="outline" variant="base">
        <Icon className="mr-1 h-3 w-3" />
        {variant.label}
      </UnifiedBadge>
    );
  };

  const getTypeLabel = (type: submission_type): string => {
    // Map submission_type to content_category for config lookup
    // Use explicit enum string values instead of fragile numeric indexing
    const categoryMap: Record<submission_type, content_category> = {
      agents: 'agents',
      commands: 'commands',
      hooks: 'hooks',
      mcp: 'mcp',
      rules: 'rules',
      skills: 'skills',
      statuslines: 'statuslines',
    };

    const category = categoryMap[type];
    if (category && isValidCategory(category)) {
      const config = getCategoryConfig(category);
      return config?.typeName ?? type;
    }

    // Fallback to hardcoded labels if category mapping fails
    // Use explicit enum string values instead of fragile numeric indexing
    const fallbackLabels: Record<submission_type, string> = {
      agents: 'Claude Agent',
      commands: 'Command',
      hooks: 'Hook',
      mcp: 'MCP Server',
      rules: 'CLAUDE.md',
      skills: 'Skill',
      statuslines: 'Statusline',
    };
    return fallbackLabels[type];
  };

  /***
   * Produce safe GitHub PR link properties for a submission when its PR reference is valid.
   *
   * Validates and normalizes a submission's PR reference and returns an object suitable for link props.
   *
   * @param {(typeof submissions)[number]} submission - A submission record (one element from `submissions`) that may contain `pr_url` and/or `pr_number`.
   * @returns `{ href: string }` with a canonical, validated GitHub PR URL if a safe PR link can be constructed, `null` otherwise.
   *
   * @see extractPrComponents
   * @see buildSafePrUrl
   */
  function getPrLinkProperties(submission: UserDashboardSubmission) {
    const components = submission.pr_url ? extractPrComponents(submission.pr_url) : null;

    // Bail early if components are invalid
    if (!components) return null;

    // Use DB field with fallback to extracted value
    const prNumber = submission.pr_number ?? components.prNumber;
    if (!prNumber) return null;

    const safePrUrl = buildSafePrUrl(components.owner, components.repo, prNumber);
    return safePrUrl && safePrUrl !== '#' ? { href: safePrUrl } : null;
  }

  /*****
   * Return a safe internal content link when the submission is merged and inputs are valid.
   *
   * @param {submission_type} type - The submission's type (one of Prisma submission_type enum values)
   * @param {string} slug - The content slug to link to; must match the internal slug pattern
   * @param {submission_status} status - The submission's status (one of Prisma submission_status enum values)
   * @returns `{ href: string }` containing a safe `/type/slug` URL when `status` equals the merged status and `type`/`slug` validate; otherwise `null`
   *
   * @see getSafeContentUrl
   * @see SubmissionStatus
   */
  function getContentLinkProperties(
    type: submission_type,
    slug: string,
    status: submission_status
  ): null | { href: string } {
    const safeUrl = getSafeContentUrl(type, slug);
    return safeUrl && status === 'merged' ? { href: safeUrl } : null;
  }

  // Log any submissions with missing IDs for data integrity monitoring
  for (const [index, sub] of submissions.entries()) {
    if (!sub.id) {
      userLogger.warn({ index, section: 'data-fetch' }, 'SubmissionsPage: submission missing ID');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">My Submissions</h1>
          <p className="text-muted-foreground text-base">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.SUBMIT}>
            <Send className="mr-2 h-4 w-4" />
            New Submission
          </Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Send className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">No submissions yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md text-center">
              Share your Claude configurations with the community! Your contributions help everyone
              build better AI workflows.
            </p>
            <Button asChild>
              <Link href={ROUTES.SUBMIT}>
                <Send className="mr-2 h-4 w-4" />
                Submit Your First Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {submissions.map((submission: UserDashboardSubmission, index: number) => (
            <SubmissionCard
              formatSubmissionDate={formatSubmissionDate}
              getContentLinkProps={getContentLinkProperties}
              getPrLinkProps={getPrLinkProperties}
              getStatusBadge={getStatusBadge}
              getTypeLabel={getTypeLabel}
              index={index}
              isValidSubmissionStatus={isValidSubmissionStatus}
              isValidSubmissionType={isValidSubmissionType}
              key={submission.id ?? `submission-${index}`}
              submission={submission}
              VALID_SUBMISSION_STATUSES={
                Object.values(VALID_SUBMISSION_STATUSES) as submission_status[]
              }
              VALID_SUBMISSION_TYPES={ALLOWED_TYPES_ARRAY}
            />
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <GitPullRequest className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm-medium text-blue-400">How it works</p>
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
